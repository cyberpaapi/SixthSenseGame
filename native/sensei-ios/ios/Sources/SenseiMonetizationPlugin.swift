import Capacitor
import GoogleMobileAds
import UserMessagingPlatform
import UIKit

@objc(SenseiMonetizationPlugin)
public final class SenseiMonetizationPlugin: CAPPlugin, CAPBridgedPlugin, FullScreenContentDelegate, BannerViewDelegate {
    public let identifier = "SenseiMonetizationPlugin"
    public let jsName = "SenseiMonetization"
    public let pluginMethods: [CAPPluginMethod] = [
        "getState", "initialize", "privacyOptions", "setBanner", "prepareReward", "showReward",
        "acknowledgeReward", "showInterstitial", "purchaseProduct", "purchaseRemoveAds", "restorePurchases", "acknowledgePurchaseDelivery"
    ].map { CAPPluginMethod(name: $0, returnType: CAPPluginReturnPromise) }
    private var saved: NativeState?
    private var store: AppleStore?
    private var banner: BannerView?
    private var bannerLoaded = false
    private var bannerWanted = false
    private var bannerWidth: CGFloat = 0
    private var reward: RewardedAd?
    private var interstitial: InterstitialAd?
    private var rewardDate = Date.distantPast, interstitialDate = Date.distantPast
    private var loadingReward = false, loadingInterstitial = false, started = false, initializing = false
    private var fullScreenCall: CAPPluginCall?
    private var privacyBusy = false
    private var message = ""
    private var observers: [NSObjectProtocol] = []
    private var consentGeneration = 0
    private var controller: GameViewController? { bridge?.viewController as? GameViewController }
    private var eligible: Bool { saved != nil && !(saved?.age.isEmpty ?? true) && saved?.age != "under13" }
    private var foreground: Bool { UIApplication.shared.applicationState == .active }
    private var canAdvertise: Bool { eligible && started && ConsentInformation.shared.canRequestAds && !privacyBusy }
    private func config(_ key: String) -> String { Bundle.main.object(forInfoDictionaryKey: key) as? String ?? "" }

    public override func load() {
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            do {
                self.saved = try NativeState()
                self.store = AppleStore(state: self.saved!) { [weak self] in self?.changed() }
            } catch { self.message = "Device storage is unavailable. Free up space to use ads or purchases." }
            self.controller?.onLayout = { [weak self] in self?.updateBanner() }
            self.observers.append(NotificationCenter.default.addObserver(forName: UIApplication.didBecomeActiveNotification, object: nil, queue: .main) { [weak self] _ in
                Task { @MainActor in
                    guard let self else { return }
                    if self.eligible { await self.store?.refresh(); self.loadAds() }
                    self.updateBanner()
                }
            })
            self.observers.append(NotificationCenter.default.addObserver(forName: UIApplication.willResignActiveNotification, object: nil, queue: .main) { [weak self] _ in self?.controller?.showBanner(nil) })
        }
    }
    deinit { observers.forEach { NotificationCenter.default.removeObserver($0) } }
    @MainActor private func status() -> JSObject {
        let offers = store?.offers ?? [:]
        let data: [String: Any] = ["ageBand": saved?.age ?? "", "eligible": eligible, "owned": store?.owned ?? false,
                "price": (offers["remove_banner_ads"] as? [String: Any])?["price"] ?? "", "products": offers,
                "billingReady": store?.ready ?? false, "purchaseBusy": store?.busy ?? false,
                "pendingPurchases": store?.receipts ?? [], "pendingReward": saved?.reward ?? [:],
                "rewardReady": reward != nil && Date().timeIntervalSince(rewardDate) < 3300 && fullScreenCall == nil,
                "rewardLoading": loadingReward, "interstitialReady": interstitial != nil,
                "privacyOptionsRequired": ConsentInformation.shared.privacyOptionsRequirementStatus == .required,
                "message": message.isEmpty ? store?.message ?? "" : message]
        return data.mapValues(Self.jsValue)
    }
    private static func jsValue(_ value: Any) -> JSValue {
        if let object = value as? [String: Any] { return object.mapValues(jsValue) }
        if let array = value as? [Any] { return array.map(jsValue) }
        return value as? JSValue ?? NSNull()
    }
    @MainActor private func changed() { updateBanner(); notifyListeners("stateChanged", data: status()) }
    private func run(_ call: CAPPluginCall, _ action: @escaping @MainActor () async throws -> Void) {
        Task { @MainActor in
            do { try await action(); call.resolve(status()) }
            catch { call.reject(error.localizedDescription) }
        }
    }
    @objc func getState(_ call: CAPPluginCall) { run(call) {} }
    @objc func initialize(_ call: CAPPluginCall) {
        run(call) {
            guard let saved = self.saved, let age = call.getString("ageBand"), ["under13", "13-15", "16-17", "18+"].contains(age) else { return }
            // Age is selected once per installation; the web client cannot toggle ad eligibility.
            if saved.age.isEmpty { try saved.update { $0["ageBand"] = age } }
            guard self.eligible, !self.initializing else { return }
            self.initializing = true
            await self.store?.start()
            await self.updateConsent()
        }
    }
    @MainActor private func updateConsent() async {
        let minor = saved?.age != "18+"
        MobileAds.shared.requestConfiguration.tagForUnderAgeOfConsent = NSNumber(value: minor)
        MobileAds.shared.requestConfiguration.maxAdContentRating = .parentalGuidance
        MobileAds.shared.requestConfiguration.publisherPrivacyPersonalizationState = .disabled
        // No ATT prompt or cross-app identifier access. Request contextual ads only.
        let parameters = RequestParameters(); parameters.isTaggedForUnderAgeOfConsent = minor
        do {
            try await ConsentInformation.shared.requestConsentInfoUpdate(with: parameters)
            try await ConsentForm.loadAndPresentIfRequired(from: bridge?.viewController)
        } catch { message = "Privacy check unavailable. You can keep playing." }
        guard ConsentInformation.shared.canRequestAds else { changed(); return }
        if !started { await MobileAds.shared.start(); started = true }
        loadAds(); changed()
    }
    @objc func privacyOptions(_ call: CAPPluginCall) {
        run(call) {
            guard self.fullScreenCall == nil, !self.privacyBusy else { return }
            self.privacyBusy = true; self.consentGeneration += 1
            self.reward = nil; self.interstitial = nil; self.destroyBanner()
            defer { self.privacyBusy = false; self.loadAds(); self.changed() }
            try await ConsentForm.presentPrivacyOptionsForm(from: self.bridge?.viewController)
        }
    }
    @MainActor private func request() -> Request {
        let request = Request(); let extras = Extras(); extras.additionalParameters = ["npa": "1"]
        request.register(extras); return request
    }
    @MainActor private func loadAds() {
        guard canAdvertise, foreground else { return }
        if Date().timeIntervalSince(rewardDate) >= 3300 { reward = nil }
        if reward == nil && !loadingReward {
            loadingReward = true; let generation = consentGeneration
            Task { @MainActor in
                defer { loadingReward = false; changed() }
                do {
                    let ad = try await RewardedAd.load(with: config("SenseiRewardedAdID"), request: request())
                    guard generation == consentGeneration, canAdvertise else { return }
                    reward = ad; rewardDate = Date(); ad.fullScreenContentDelegate = self
                } catch { message = "No reward ad available right now. You can keep playing." }
            }
        }
        if Date().timeIntervalSince(interstitialDate) >= 3300 { interstitial = nil }
        if store?.owned != true && interstitial == nil && !loadingInterstitial {
            loadingInterstitial = true; let generation = consentGeneration
            Task { @MainActor in
                defer { loadingInterstitial = false; changed() }
                do {
                    let ad = try await InterstitialAd.load(with: config("SenseiInterstitialAdID"), request: request())
                    guard generation == consentGeneration, canAdvertise else { return }
                    interstitial = ad; interstitialDate = Date(); ad.fullScreenContentDelegate = self
                } catch { /* Missing automatic ads never delay a game result. */ }
            }
        }
    }
    @objc func prepareReward(_ call: CAPPluginCall) { run(call) { self.loadAds() } }
    @objc func showReward(_ call: CAPPluginCall) {
        Task { @MainActor in
            guard let saved, canAdvertise, foreground, fullScreenCall == nil, store?.busy != true,
                  let ad = reward, Date().timeIntervalSince(rewardDate) < 3300 else { call.reject("Ad unavailable. Try again shortly."); loadAds(); return }
            let claim = call.getString("claimId") ?? "", kind = call.getString("kind") ?? "coins", coins = call.getInt("coins") ?? 0
            let extraTry = ["last-chance", "last-chance-online"].contains(kind)
            guard claim.range(of: "^[a-zA-Z0-9-]{20,80}$", options: .regularExpression) != nil,
                  extraTry || (kind == "coins" && (1...280).contains(coins)), saved.reward.isEmpty,
                  !(saved.values["claimed"] as? [String] ?? []).contains(claim) else { call.reject("Reward already collected or invalid."); return }
            fullScreenCall = call; reward = nil; updateBanner()
            ad.present(from: bridge?.viewController) { [weak self] in
                guard let self else { return }
                do { try saved.update { $0["pendingReward"] = ["claimId": claim, "coins": extraTry ? 0 : coins, "kind": kind] } }
                catch { self.message = "Reward could not be saved. Free up device storage and contact support." }
                self.changed()
            }
        }
    }
    @objc func acknowledgeReward(_ call: CAPPluginCall) {
        run(call) {
            guard let saved = self.saved, let claim = call.getString("claimId"), saved.reward["claimId"] as? String == claim else { return }
            try saved.update {
                var claimed = $0["claimed"] as? [String] ?? []; claimed.append(claim)
                $0["claimed"] = claimed; $0.removeValue(forKey: "pendingReward")
            }
        }
    }
    @objc func showInterstitial(_ call: CAPPluginCall) {
        Task { @MainActor in
            do {
                let opportunity = try saved?.recordBreak(placement: call.getString("placement") ?? "", id: call.getString("eventId") ?? "") ?? false
                guard opportunity, canAdvertise, foreground, fullScreenCall == nil, store?.busy != true,
                      store?.owned != true, let ad = interstitial, Date().timeIntervalSince(interstitialDate) < 3300 else {
                    call.resolve(status()); loadAds(); return
                }
                fullScreenCall = call; interstitial = nil; updateBanner(); ad.present(from: bridge?.viewController)
            } catch { call.resolve(status()) }
        }
    }
    public func adDidDismissFullScreenContent(_ ad: FullScreenPresentingAd) { finishAd() }
    public func ad(_ ad: FullScreenPresentingAd, didFailToPresentFullScreenContentWithError error: Error) { finishAd() }
    private func finishAd() {
        Task { @MainActor in
            let call = fullScreenCall; fullScreenCall = nil; call?.resolve(status()); loadAds(); changed()
            controller?.setNeedsStatusBarAppearanceUpdate(); controller?.setNeedsUpdateOfHomeIndicatorAutoHidden()
        }
    }
    @objc func setBanner(_ call: CAPPluginCall) { run(call) { self.bannerWanted = call.getBool("visible") ?? false; self.updateBanner() } }
    private func destroyBanner() { controller?.showBanner(nil); banner?.delegate = nil; banner?.removeFromSuperview(); banner = nil; bannerLoaded = false }
    @MainActor private func updateBanner() {
        guard let controller else { return }
        let width = floor(controller.view.bounds.width - controller.view.safeAreaInsets.left - controller.view.safeAreaInsets.right)
        if bannerWidth != width { destroyBanner(); bannerWidth = width }
        guard bannerWanted, canAdvertise, foreground, store?.owned != true, fullScreenCall == nil, width > 0 else { controller.showBanner(nil); return }
        if banner == nil {
            let view = BannerView(adSize: currentOrientationAnchoredAdaptiveBanner(width: width))
            banner = view; view.adUnitID = config("SenseiBannerAdID"); view.rootViewController = controller; view.delegate = self
            view.load(request())
        }
        controller.showBanner(bannerLoaded ? banner : nil)
    }
    public func bannerViewDidReceiveAd(_ bannerView: BannerView) { Task { @MainActor in if bannerView === banner { bannerLoaded = true; updateBanner() } } }
    public func bannerView(_ bannerView: BannerView, didFailToReceiveAdWithError error: Error) { Task { @MainActor in if bannerView === banner { bannerLoaded = false; controller?.showBanner(nil) } } }
    @objc func purchaseProduct(_ call: CAPPluginCall) { purchase(call, id: call.getString("productId") ?? "") }
    @objc func purchaseRemoveAds(_ call: CAPPluginCall) { purchase(call, id: "remove_banner_ads") }
    private func purchase(_ call: CAPPluginCall, id: String) {
        run(call) {
            guard self.eligible, self.fullScreenCall == nil, !self.privacyBusy, let store = self.store else { throw NSError(domain: "Store", code: 1, userInfo: [NSLocalizedDescriptionKey: "Purchase unavailable."]) }
            try await store.purchase(id)
        }
    }
    @objc func restorePurchases(_ call: CAPPluginCall) { run(call) { guard self.eligible else { return }; try await self.store?.restore() } }
    @objc func acknowledgePurchaseDelivery(_ call: CAPPluginCall) { run(call) { try await self.store?.acknowledge(call.getString("claimId") ?? "") } }
}
