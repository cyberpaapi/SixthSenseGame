package com.sensei.sixthsense;

import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import androidx.annotation.NonNull;
import androidx.coordinatorlayout.widget.CoordinatorLayout;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.ads.*;
import com.google.android.gms.ads.rewarded.*;
import com.google.android.gms.ads.interstitial.*;
import com.google.android.ump.*;
import com.android.billingclient.api.*;
import org.json.JSONObject;
import org.json.JSONArray;
import java.net.HttpURLConnection;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "SenseiMonetization")
public class SenseiMonetizationPlugin extends Plugin {
    private SharedPreferences prefs;
    private ConsentInformation consent;
    private BillingClient billing;
    private AdView banner;
    private FrameLayout bannerHost;
    private RewardedAd rewarded;
    private InterstitialAd interstitial;
    private boolean loadingInterstitial, foreground = true;
    private long interstitialLoadedAt;
    private boolean initialized, adsStarted, loadingReward, bannerWanted, bannerLoaded, fullscreen, purchaseBusy, restoreBusy;
    private String price = "", ageBand = "", message = "";
    private final ExecutorService network = Executors.newSingleThreadExecutor();
    private final Handler main = new Handler(Looper.getMainLooper());
    private PluginCall rewardCall;
    private static final List<String> PRODUCTS = Arrays.asList("remove_banner_ads", "coins_500", "coins_1500", "coins_3500", "lifeline_kit", "complete_pack");
    private final Map<String, String> prices = new HashMap<>();
    private final Set<String> verifyingTokens = new HashSet<>();
    private String installationId;
    private boolean delivering;
    private boolean permanent(String id) { return id.equals("remove_banner_ads") || id.equals("complete_pack"); }
    private boolean productOwned(String id) {
        return prefs.getBoolean("owned-" + id, false) && System.currentTimeMillis() - prefs.getLong("verified-" + id, 0) < 7L * 86400000;
    }
    private JSONObject pendingPurchases() {
        try { return new JSONObject(prefs.getString("pendingPurchases", "{}")); }
        catch (Exception ignored) { return new JSONObject(); }
    }
    private JSONArray purchaseReceipts() {
        JSONArray result = new JSONArray(); JSONObject pending = pendingPurchases();
        Iterator<String> keys = pending.keys();
        while (keys.hasNext()) { JSONObject entry = pending.optJSONObject(keys.next()); if (entry != null) result.put(entry.optJSONObject("receipt")); }
        return result;
    }

    @Override public void load() {
        prefs = getContext().getSharedPreferences("sensei-monetization", 0);
        ageBand = prefs.getString("ageBand", "");
        installationId = prefs.getString("storeInstallation", "");
        if (installationId.isEmpty()) {
            byte[] random = new byte[32]; new java.security.SecureRandom().nextBytes(random);
            StringBuilder value = new StringBuilder(); for (byte b : random) value.append(String.format("%02x", b & 255));
            installationId = value.toString(); prefs.edit().putString("storeInstallation", installationId).commit();
        }
        consent = UserMessagingPlatform.getConsentInformation(getContext());
    }

    private boolean owned() {
        // Refresh via Play on each foreground. A bounded offline grace avoids taking away a paid benefit during outages.
        return productOwned("remove_banner_ads") || productOwned("complete_pack") || (prefs.getBoolean("owned", false) && System.currentTimeMillis() - prefs.getLong("verifiedAt", 0) < 7L * 86400000);
    }
    private boolean eligible() { return !ageBand.isEmpty() && !ageBand.equals("under13"); }
    private JSObject receipt() {
        try { return JSObject.fromJSONObject(new JSONObject(prefs.getString("pendingReward", "{}"))); }
        catch (Exception e) { return new JSObject(); }
    }
    private JSObject status() {
        JSObject data = new JSObject();
        data.put("owned", owned()); data.put("price", price); data.put("ageBand", ageBand);
        data.put("rewardReady", rewarded != null && !fullscreen);
        data.put("interstitialReady", interstitial != null && !fullscreen);
        data.put("rewardLoading", loadingReward); data.put("eligible", eligible());
        data.put("purchaseBusy", purchaseBusy || !verifyingTokens.isEmpty() || delivering); data.put("message", message);
        data.put("billingReady", billing != null && billing.isReady());
        data.put("privacyOptionsRequired", consent.getPrivacyOptionsRequirementStatus() == ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED);
        data.put("pendingReward", receipt());
        data.put("pendingPurchases", purchaseReceipts());
        JSObject products = new JSObject();
        for (String id : PRODUCTS) { JSObject item = new JSObject(); item.put("price", prices.getOrDefault(id, "")); item.put("owned", productOwned(id)); products.put(id, item); }
        data.put("products", products);
        return data;
    }
    private void changed() { notifyListeners("stateChanged", status()); }
    @PluginMethod public void getState(PluginCall call) { getActivity().runOnUiThread(() -> call.resolve(status())); }

    @PluginMethod public void initialize(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            String requested = call.getString("ageBand", ageBand);
            if (!Arrays.asList("under13", "13-15", "16-17", "18+").contains(requested)) { call.resolve(status()); return; }
            ageBand = requested;
            prefs.edit().putString("ageBand", ageBand).apply();
            if (!initialized) {
                initialized = true;
                if (eligible()) { startBilling(); updateConsent(); }
            }
            call.resolve(status());
        });
    }

    private void updateConsent() {
        boolean minor = !ageBand.equals("18+");
        MobileAds.setRequestConfiguration(new RequestConfiguration.Builder()
            .setTagForUnderAgeOfConsent(minor ? RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_TRUE : RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_FALSE)
            .setMaxAdContentRating(RequestConfiguration.MAX_AD_CONTENT_RATING_PG).build());
        ConsentRequestParameters params = new ConsentRequestParameters.Builder().setTagForUnderAgeOfConsent(minor).build();
        consent.requestConsentInfoUpdate(getActivity(), params, () ->
            UserMessagingPlatform.loadAndShowConsentFormIfRequired(getActivity(), error -> { startAdsIfAllowed(); changed(); }),
            error -> { message = "Privacy check unavailable. You can keep playing."; startAdsIfAllowed(); changed(); });
    }
    private void startAdsIfAllowed() {
        if (!eligible() || !consent.canRequestAds()) return;
        if (adsStarted) { loadReward(); loadInterstitial(); updateBanner(); return; }
        adsStarted = true;
        MobileAds.initialize(getContext(), result -> main.post(() -> { loadReward(); loadInterstitial(); updateBanner(); }));
    }
    @PluginMethod public void privacyOptions(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            rewarded = null; interstitial = null; destroyBanner();
            UserMessagingPlatform.showPrivacyOptionsForm(getActivity(), error -> {
                startAdsIfAllowed(); changed();
                if (error == null) call.resolve(status()); else call.reject("Privacy choices are unavailable right now.");
            });
        });
    }

    @PluginMethod public void setBanner(PluginCall call) {
        getActivity().runOnUiThread(() -> { bannerWanted = call.getBoolean("visible", false); updateBanner(); call.resolve(); });
    }
    private void updateBanner() {
        boolean visible = bannerWanted && !owned() && !fullscreen && eligible() && adsStarted && consent.canRequestAds();
        if (!visible) { if (bannerHost != null) bannerHost.setVisibility(View.GONE); setWebMargin(0); return; }
        if (banner != null) {
            bannerHost.setVisibility(bannerLoaded ? View.VISIBLE : View.GONE);
            setWebMargin(bannerLoaded ? banner.getAdSize().getHeightInPixels(getContext()) + bannerHost.getPaddingTop() : 0);
            return;
        }
        ViewGroup parent = (ViewGroup) getBridge().getWebView().getParent();
        bannerHost = new FrameLayout(getContext());
        CoordinatorLayout.LayoutParams hostParams = new CoordinatorLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        hostParams.gravity = Gravity.BOTTOM;
        parent.addView(bannerHost, hostParams);
        int width = Math.max(1, (int) (getBridge().getWebView().getWidth() / getContext().getResources().getDisplayMetrics().density));
        AdSize size = AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize(getContext(), width);
        banner = new AdView(getContext()); banner.setAdSize(size); banner.setAdUnitId(BuildConfig.BANNER_AD_ID);
        bannerHost.setPadding(0, (int) (8 * getContext().getResources().getDisplayMetrics().density), 0, 0);
        bannerHost.addView(banner, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.CENTER));
        bannerHost.setVisibility(View.GONE);
        final AdView requestedBanner = banner;
        banner.setAdListener(new AdListener() {
            @Override public void onAdLoaded() { if (banner == requestedBanner) { bannerLoaded = true; updateBanner(); } }
            @Override public void onAdFailedToLoad(@NonNull LoadAdError error) { if (banner == requestedBanner) destroyBanner(); }
        });
        banner.loadAd(new AdRequest.Builder().build());
    }
    private void setWebMargin(int bottom) {
        View web = getBridge().getWebView();
        ViewGroup.MarginLayoutParams params = (ViewGroup.MarginLayoutParams) web.getLayoutParams();
        if (params.bottomMargin != bottom) { params.bottomMargin = bottom; web.setLayoutParams(params); }
    }
    private void destroyBanner() {
        bannerLoaded = false;
        if (banner != null) { banner.destroy(); banner = null; }
        if (bannerHost != null) { ((ViewGroup) bannerHost.getParent()).removeView(bannerHost); bannerHost = null; }
        setWebMargin(0);
    }
    private void loadReward() {
        if (!adsStarted || !consent.canRequestAds() || rewarded != null || loadingReward || fullscreen) return;
        loadingReward = true; changed();
        RewardedAd.load(getContext(), BuildConfig.REWARDED_AD_ID, new AdRequest.Builder().build(), new RewardedAdLoadCallback() {
            @Override public void onAdLoaded(@NonNull RewardedAd ad) { loadingReward = false; rewarded = ad; message = ""; changed(); }
            @Override public void onAdFailedToLoad(@NonNull LoadAdError error) { loadingReward = false; message = "No reward ad available. Try again later."; changed(); }
        });
    }
    private void loadInterstitial() {
        if (interstitial != null && System.currentTimeMillis() - interstitialLoadedAt > 55L * 60000) interstitial = null;
        if (!eligible() || owned() || !adsStarted || !consent.canRequestAds() || interstitial != null || loadingInterstitial || fullscreen) return;
        loadingInterstitial = true;
        InterstitialAd.load(getContext(), BuildConfig.INTERSTITIAL_AD_ID, new AdRequest.Builder().build(), new InterstitialAdLoadCallback() {
            @Override public void onAdLoaded(@NonNull InterstitialAd ad) {
                loadingInterstitial = false;
                if (!owned() && consent.canRequestAds()) { interstitial = ad; interstitialLoadedAt = System.currentTimeMillis(); }
                changed();
            }
            @Override public void onAdFailedToLoad(@NonNull LoadAdError error) { loadingInterstitial = false; changed(); }
        });
    }
    @PluginMethod public void showInterstitial(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            String placement = call.getString("placement", ""), id = call.getString("eventId", "");
            if (!Arrays.asList("adventure", "multiplayer").contains(placement) || !id.matches("[a-zA-Z0-9:._-]{1,160}")) { call.resolve(status()); return; }
            AdBreakPolicy policy = new AdBreakPolicy(prefs.getStringSet("adBreaks", Collections.emptySet()), prefs.getInt("adventureBreakCount", 0));
            if (policy.alreadyRecorded(placement, id)) { call.resolve(status()); return; }
            boolean due = policy.record(placement, id);
            // Persist before opening. Reconnect/reload cannot replay a finished match.
            if (!prefs.edit().putStringSet("adBreaks", policy.seen).putInt("adventureBreakCount", policy.adventureCount).commit()) { call.resolve(status()); return; }
            boolean fresh = System.currentTimeMillis() - interstitialLoadedAt < 55L * 60000;
            // Never wait for an ad or pop one up later after play has resumed.
            if (!due || owned() || !eligible() || !foreground || fullscreen || interstitial == null || !fresh || !consent.canRequestAds()) {
                if (!fresh) interstitial = null;
                loadInterstitial(); call.resolve(status()); return;
            }
            InterstitialAd ad = interstitial; interstitial = null; fullscreen = true; updateBanner(); changed();
            ad.setFullScreenContentCallback(new FullScreenContentCallback() {
                private boolean done;
                private void finish() {
                    if (done) return; done = true; fullscreen = false;
                    updateBanner(); loadInterstitial(); loadReward(); changed(); call.resolve(status());
                }
                @Override public void onAdDismissedFullScreenContent() { finish(); }
                @Override public void onAdFailedToShowFullScreenContent(@NonNull AdError error) { finish(); }
            });
            try { ad.show(getActivity()); }
            catch (RuntimeException ignored) {
                fullscreen = false; updateBanner(); loadInterstitial(); loadReward(); changed(); call.resolve(status());
            }
        });
    }
    @PluginMethod public void prepareReward(PluginCall call) { getActivity().runOnUiThread(() -> { loadReward(); call.resolve(status()); }); }
    @PluginMethod public void showReward(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            String claim = call.getString("claimId", "");
            int coins = call.getInt("coins", 0);
            String kind = call.getString("kind", "coins");
            boolean extraTry = kind.equals("last-chance") || kind.equals("last-chance-online");
            if (!claim.matches("[a-zA-Z0-9-]{20,80}") || (!extraTry && (!kind.equals("coins") || coins < 1 || coins > 280))) { call.reject("Invalid reward."); return; }
            if (receipt().has("claimId") || prefs.getStringSet("claimed", Collections.emptySet()).contains(claim)) { call.reject("This reward has already been collected or is awaiting recovery."); return; }
            if (!eligible() || rewarded == null || fullscreen || !consent.canRequestAds()) { loadReward(); call.reject("No ad is ready. Please try again."); return; }
            RewardedAd ad = rewarded; rewarded = null; fullscreen = true; rewardCall = call;
            updateBanner(); changed();
            ad.setFullScreenContentCallback(new FullScreenContentCallback() {
                @Override public void onAdDismissedFullScreenContent() { finishReward(null); }
                @Override public void onAdFailedToShowFullScreenContent(@NonNull AdError error) { finishReward("The ad could not open. No reward was claimed."); }
            });
            ad.show(getActivity(), reward -> {
                JSObject pending = new JSObject(); pending.put("claimId", claim); pending.put("coins", extraTry ? 0 : coins); pending.put("kind", kind);
                // Commit before dismissing: recover this receipt after process death, never award on close alone.
                prefs.edit().putString("pendingReward", pending.toString()).commit();
            });
        });
    }
    private void finishReward(String error) {
        fullscreen = false;
        if (rewardCall != null) {
            if (error == null) rewardCall.resolve(status()); else rewardCall.reject(error);
            rewardCall = null;
        }
        updateBanner(); loadReward(); loadInterstitial(); changed();
    }
    @PluginMethod public void acknowledgeReward(PluginCall call) {
        String claim = call.getString("claimId", "");
        if (claim.equals(receipt().optString("claimId"))) {
            Set<String> claimed = new HashSet<>(prefs.getStringSet("claimed", Collections.emptySet())); claimed.add(claim);
            prefs.edit().putStringSet("claimed", claimed).remove("pendingReward").commit();
        }
        call.resolve();
    }

    private String storeUrl() { return BuildConfig.VERIFY_PURCHASE_URL.replaceFirst("/play-purchase$", "/play-store"); }
    private JSONObject requestStore(JSONObject body) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) URI.create(storeUrl()).toURL().openConnection();
        connection.setConnectTimeout(15000); connection.setReadTimeout(15000); connection.setInstanceFollowRedirects(false);
        try {
            if (body != null) {
                connection.setRequestMethod("POST"); connection.setDoOutput(true); connection.setRequestProperty("Content-Type", "application/json");
                try (java.io.OutputStream out = connection.getOutputStream()) { out.write(body.toString().getBytes(StandardCharsets.UTF_8)); }
            }
            if (connection.getResponseCode() != 200) throw new IllegalStateException("Store unavailable");
            try (java.io.InputStream in = connection.getInputStream(); java.io.ByteArrayOutputStream bytes = new java.io.ByteArrayOutputStream()) {
                byte[] buffer = new byte[4096]; int count;
                while ((count = in.read(buffer)) != -1) { bytes.write(buffer, 0, count); if (bytes.size() > 65536) throw new IllegalStateException("Invalid response"); }
                return new JSONObject(bytes.toString("UTF-8"));
            }
        } finally { connection.disconnect(); }
    }
    private void startBilling() {
        billing = BillingClient.newBuilder(getContext()).setListener((result, purchases) -> main.post(() -> {
            purchaseBusy = false;
            if (result.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) processPurchases(purchases, false);
            else { message = result.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED ? "Purchase cancelled." : "Purchase unavailable. Please try again."; changed(); }
        })).enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build()).enableAutoServiceReconnection().build();
        billing.startConnection(new BillingClientStateListener() {
            @Override public void onBillingSetupFinished(@NonNull BillingResult result) {
                main.post(() -> {
                    if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) { queryPrice(); restore(); }
                    else { message = "Google Play purchases are unavailable on this device."; changed(); }
                });
            }
            @Override public void onBillingServiceDisconnected() { main.post(() -> changed()); }
        });
    }
    private QueryProductDetailsParams productQuery(List<String> ids) {
        List<QueryProductDetailsParams.Product> items = new ArrayList<>();
        for (String id : ids) items.add(QueryProductDetailsParams.Product.newBuilder().setProductId(id).setProductType(BillingClient.ProductType.INAPP).build());
        return QueryProductDetailsParams.newBuilder().setProductList(items).build();
    }
    private ProductDetails.OneTimePurchaseOfferDetails purchaseOffer(ProductDetails product) {
        List<ProductDetails.OneTimePurchaseOfferDetails> offers = product.getOneTimePurchaseOfferDetailsList();
        return offers == null || offers.isEmpty() ? product.getOneTimePurchaseOfferDetails() : offers.get(0);
    }
    private void queryPrice() {
        billing.queryProductDetailsAsync(productQuery(PRODUCTS), (result, details) -> main.post(() -> {
            prices.clear();
            if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) for (ProductDetails product : details.getProductDetailsList()) {
                ProductDetails.OneTimePurchaseOfferDetails offer = purchaseOffer(product);
                if (offer != null) prices.put(product.getProductId(), offer.getFormattedPrice());
            }
            price = prices.getOrDefault("remove_banner_ads", ""); changed();
        }));
    }
    @PluginMethod public void purchaseRemoveAds(PluginCall call) { beginPurchase(call, "remove_banner_ads"); }
    @PluginMethod public void purchaseProduct(PluginCall call) { beginPurchase(call, call.getString("productId", "")); }
    private void beginPurchase(PluginCall call, String id) {
        getActivity().runOnUiThread(() -> {
            if (!PRODUCTS.contains(id) || !eligible() || billing == null || !billing.isReady() || purchaseBusy || !verifyingTokens.isEmpty() || delivering || pendingPurchases().length() > 0 || (permanent(id) && (productOwned(id) || (id.equals("remove_banner_ads") && owned())))) { call.reject("Purchase is not available. Finish restoring pending purchases first."); return; }
            purchaseBusy = true; changed();
            network.execute(() -> {
                boolean available = false;
                try { JSONObject readiness = requestStore(null); available = readiness.optBoolean("available", false) && readiness.optInt("catalogVersion", 0) == 1; }
                catch (Exception ignored) { /* Fail closed before payment when verification is unavailable. */ }
                final boolean ready = available;
                main.post(() -> {
                    if (!ready) { purchaseBusy = false; changed(); call.reject("Purchases are not ready yet. Please try again later."); return; }
                    billing.queryProductDetailsAsync(productQuery(Collections.singletonList(id)), (result, details) -> main.post(() -> {
                        if (result.getResponseCode() != BillingClient.BillingResponseCode.OK || details.getProductDetailsList().isEmpty()) { purchaseBusy = false; changed(); call.reject("This product is not available in Google Play yet."); return; }
                        ProductDetails product = details.getProductDetailsList().get(0);
                        BillingFlowParams.ProductDetailsParams.Builder item = BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(product);
                        ProductDetails.OneTimePurchaseOfferDetails offer = purchaseOffer(product);
                        if (offer == null) { purchaseBusy = false; changed(); call.reject("No purchase option is available in your region."); return; }
                        if (offer.getOfferToken() != null) item.setOfferToken(offer.getOfferToken());
                        BillingResult launched = billing.launchBillingFlow(getActivity(), BillingFlowParams.newBuilder().setObfuscatedAccountId(installationId).setProductDetailsParamsList(Collections.singletonList(item.build())).build());
                        if (launched.getResponseCode() == BillingClient.BillingResponseCode.OK) call.resolve();
                        else { purchaseBusy = false; changed(); call.reject("Google Play could not start the purchase."); }
                    }));
                });
            });
        });
    }
    @PluginMethod public void restorePurchases(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (billing == null || !billing.isReady()) { call.reject("Connect to Google Play and try again."); return; }
            message = "Checking Google Play purchases…"; queryPrice(); restore(); call.resolve();
        });
    }
    private void restore() {
        if (restoreBusy || billing == null || !billing.isReady()) return;
        restoreBusy = true;
        billing.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build(), (result, purchases) -> main.post(() -> {
            restoreBusy = false;
            if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) processPurchases(purchases, true);
            else { message = "Could not check purchases. Please try again when connected."; changed(); }
        }));
    }
    private void processPurchases(List<Purchase> purchases, boolean fullList) {
        Set<String> found = new HashSet<>();
        for (Purchase purchase : purchases) for (String id : purchase.getProducts()) if (PRODUCTS.contains(id)) {
            found.add(id);
            if (purchase.getPurchaseState() == Purchase.PurchaseState.PENDING) message = "Payment pending. Your items arrive after Google Play confirms payment.";
            if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) verifyPurchase(purchase, id);
        }
        if (fullList) {
            SharedPreferences.Editor edit = prefs.edit().remove("owned").remove("verifiedAt");
            for (String id : Arrays.asList("remove_banner_ads", "complete_pack")) if (!found.contains(id)) edit.putBoolean("owned-" + id, false);
            edit.apply();
        }
        updateBanner(); changed();
    }
    private void verifyPurchase(Purchase purchase, String id) {
        String token = purchase.getPurchaseToken();
        if (!verifyingTokens.add(token)) return;
        message = "Verifying your purchase…"; changed();
        network.execute(() -> {
            try {
                JSONObject response = requestStore(new JSONObject().put("purchaseToken", token).put("productId", id).put("installationId", installationId).put("action", "verify"));
                main.post(() -> {
                    verifyingTokens.remove(token);
                    if (permanent(id)) prefs.edit().putBoolean("owned-" + id, response.optBoolean("owned", false)).putLong("verified-" + id, System.currentTimeMillis()).commit();
                    JSONObject receipt = response.optJSONObject("receipt");
                    if (receipt != null) {
                        JSONObject pending = pendingPurchases();
                        try { pending.put(receipt.getString("claimId"), new JSONObject().put("receipt", receipt).put("token", token)); }
                        catch (Exception ignored) { message = "Restore purchases to recover your items."; changed(); return; }
                        if (!prefs.edit().putString("pendingPurchases", pending.toString()).commit()) { message = "Free up device storage and restore purchases."; changed(); return; }
                        message = "Delivering your items…";
                    } else message = response.optBoolean("owned") ? "Banners and automatic ads removed. Reward ads remain optional." : response.optBoolean("invalid") ? "This purchase is no longer active." : "Purchases checked.";
                    if (owned()) { interstitial = null; destroyBanner(); } else { updateBanner(); loadInterstitial(); }
                    changed();
                });
            } catch (Exception ignored) { main.post(() -> { verifyingTokens.remove(token); message = "Verification pending. Use Restore purchases when connected."; changed(); }); }
        });
    }
    @PluginMethod public void acknowledgePurchaseDelivery(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            String claim = call.getString("claimId", "");
            JSONObject entry = pendingPurchases().optJSONObject(claim);
            if (entry == null) { call.resolve(status()); return; }
            if (delivering) { call.reject("Delivery already in progress."); return; }
            delivering = true;
            network.execute(() -> {
                try {
                    JSONObject receipt = entry.getJSONObject("receipt");
                    JSONObject result = requestStore(new JSONObject().put("purchaseToken", entry.getString("token")).put("productId", receipt.getString("productId")).put("installationId", installationId).put("action", "deliver"));
                    if (!result.optBoolean("delivered", false)) throw new IllegalStateException("Delivery pending");
                    main.post(() -> {
                        JSONObject pending = pendingPurchases(); pending.remove(claim);
                        boolean saved = prefs.edit().putString("pendingPurchases", pending.toString()).commit();
                        delivering = false; message = saved ? "Your pack is in your wallet and lifeline inventory." : "Free up storage, then restore purchases.";
                        changed(); if (saved) call.resolve(status()); else call.reject(message);
                    });
                } catch (Exception ignored) { main.post(() -> { delivering = false; message = "Items saved. Connect and restore to finish your purchase."; changed(); call.reject(message); }); }
            });
        });
    }
    @Override protected void handleOnResume() { foreground = true; if (banner != null) banner.resume(); if (initialized) { restore(); loadInterstitial(); } }
    @Override protected void handleOnConfigurationChanged(android.content.res.Configuration config) {
        // Wait for the new WebView width before choosing an adaptive ad size.
        getBridge().getWebView().post(() -> { destroyBanner(); updateBanner(); });
    }
    @Override protected void handleOnPause() { foreground = false; if (banner != null) banner.pause(); }
    @Override protected void handleOnDestroy() {
        if (banner != null) banner.destroy();
        if (billing != null) billing.endConnection();
        network.shutdown();
    }
}
