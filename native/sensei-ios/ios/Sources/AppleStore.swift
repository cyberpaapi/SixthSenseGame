import Foundation
import StoreKit

@MainActor
final class AppleStore {
    static let ids = ["remove_banner_ads", "coins_500", "coins_1500", "coins_3500", "lifeline_kit", "complete_pack"]
    static let permanent: Set<String> = ["remove_banner_ads", "complete_pack"]
    private let state: NativeState
    private let changed: () -> Void
    private var updates: Task<Void, Never>?
    private var processing: Set<UInt64> = []
    private var transactions: [String: StoreKit.Transaction] = [:]
    private var products: [String: Product] = [:]
    private var ownedIds: Set<String> = []
    private(set) var busy = false
    private(set) var ready = false
    private(set) var message = ""
    private var endpoint: URL? {
        guard let value = Bundle.main.object(forInfoDictionaryKey: "SenseiAppleVerificationURL") as? String,
              let url = URL(string: value), url.scheme == "https", url.host != nil else { return nil }
        return url
    }
    init(state: NativeState, changed: @escaping () -> Void) { self.state = state; self.changed = changed }
    deinit { updates?.cancel() }
    var owned: Bool { !ownedIds.isEmpty }
    var offers: [String: Any] {
        Dictionary(uniqueKeysWithValues: Self.ids.map { id in
            (id, ["price": ready ? products[id]?.displayPrice ?? "" : "", "owned": ownedIds.contains(id)] as [String: Any])
        })
    }
    var receipts: [[String: Any]] { state.purchases.values.compactMap { $0["receipt"] as? [String: Any] } }

    func start() async {
        if updates == nil {
            updates = Task { [weak self] in
                for await result in StoreKit.Transaction.updates {
                    guard let self else { return }
                    do { try await self.accept(result) }
                    catch { self.message = "Purchase saved by Apple. Reconnect and use Restore purchases." }
                    self.changed()
                }
            }
        }
        await refresh()
    }
    private func checkReady() async {
        ready = false
        guard let endpoint else { return }
        do {
            var request = URLRequest(url: endpoint); request.timeoutInterval = 15; request.cachePolicy = .reloadIgnoringLocalCacheData
            let (data, response) = try await URLSession.shared.data(for: request)
            let body = try JSONSerialization.jsonObject(with: data) as? [String: Any]
            ready = (response as? HTTPURLResponse)?.statusCode == 200 && body?["available"] as? Bool == true && body?["catalogVersion"] as? Int == 1
        } catch { message = "Store connection unavailable. You can keep playing." }
    }
    func refresh() async {
        guard !busy else { return }
        busy = true; changed()
        defer { busy = false; changed() }
        await checkReady()
        do {
            products = Dictionary(uniqueKeysWithValues: try await Product.products(for: Self.ids).map { ($0.id, $0) })
            // StoreKit verifies Apple's current entitlements, including revocations.
            // No JS or user-default ownership flag can grant ad removal.
            var current: Set<String> = []
            for await result in StoreKit.Transaction.currentEntitlements {
                if case .verified(let transaction) = result, transaction.revocationDate == nil,
                   Self.permanent.contains(transaction.productID) { current.insert(transaction.productID) }
                try await accept(result)
            }
            ownedIds = current
            for await result in StoreKit.Transaction.unfinished { try await accept(result) }
        } catch { message = "Some purchases need a connection. Use Restore purchases to retry." }
    }
    func restore() async throws {
        guard !busy else { throw storeError("A purchase is already in progress.") }
        try await AppStore.sync()
        await refresh()
    }
    func purchase(_ id: String) async throws {
        guard ready, !busy, state.purchases.isEmpty, let product = products[id],
              !ownedIds.contains(id), !(id == "remove_banner_ads" && owned) else {
            throw storeError("Purchase unavailable. Restore pending purchases first.")
        }
        busy = true; message = ""; changed()
        defer { busy = false; changed() }
        switch try await product.purchase(options: [.appAccountToken(state.installation)]) {
        case .success(let result): try await accept(result)
        case .pending: message = "Waiting for Apple purchase approval. No supplies granted yet."
        case .userCancelled: message = "Purchase cancelled."
        @unknown default: message = "Purchase is not complete. Use Restore purchases to check."
        }
    }
    private func accept(_ result: VerificationResult<StoreKit.Transaction>) async throws {
        guard case .verified(let transaction) = result, Self.ids.contains(transaction.productID) else {
            throw storeError("Apple could not verify this purchase.")
        }
        if transaction.revocationDate != nil {
            ownedIds.remove(transaction.productID)
            let revoked = state.purchases.filter { $0.value["transactionId"] as? String == String(transaction.id) }.map(\.key)
            try state.update { values in
                var pending = values["purchases"] as? [String: [String: Any]] ?? [:]
                revoked.forEach { pending.removeValue(forKey: $0) }; values["purchases"] = pending
            }
            await transaction.finish(); return
        }
        if Self.permanent.contains(transaction.productID) { ownedIds.insert(transaction.productID) }
        guard !processing.contains(transaction.id) else { return }
        processing.insert(transaction.id); defer { processing.remove(transaction.id) }
        // Supplies always require a fresh Apple-server check and durable grant ledger.
        let response = try await verify(jws: result.jwsRepresentation, action: "verify")
        if response["invalid"] as? Bool == true {
            ownedIds.remove(transaction.productID); await transaction.finish(); return
        }
        if let receipt = response["receipt"] as? [String: Any], let claim = receipt["claimId"] as? String {
            try state.update { values in
                var pending = values["purchases"] as? [String: [String: Any]] ?? [:]
                pending[claim] = ["receipt": receipt, "jws": result.jwsRepresentation, "transactionId": String(transaction.id)]
                values["purchases"] = pending
            }
            transactions[claim] = transaction
        } else { await transaction.finish() }
        changed()
    }
    func acknowledge(_ claim: String) async throws {
        guard let pending = state.purchases[claim], let jws = pending["jws"] as? String else { return }
        // JS has atomically written wallet+claim before this call. Uncertain replies retry safely.
        let response = try await verify(jws: jws, action: "deliver")
        guard response["delivered"] as? Bool == true else { throw storeError("Purchase delivery needs a retry.") }
        if let transaction = transactions[claim] { await transaction.finish() }
        try state.update { values in
            var all = values["purchases"] as? [String: [String: Any]] ?? [:]
            all.removeValue(forKey: claim); values["purchases"] = all
        }
        transactions.removeValue(forKey: claim); changed()
    }
    private func verify(jws: String, action: String) async throws -> [String: Any] {
        guard let endpoint else { throw storeError("Store verification is not configured.") }
        var request = URLRequest(url: endpoint); request.httpMethod = "POST"; request.timeoutInterval = 25
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: ["signedTransaction": jws, "installationId": state.installation.uuidString.lowercased(), "action": action])
        let (data, response) = try await URLSession.shared.data(for: request)
        guard (response as? HTTPURLResponse)?.statusCode == 200, let body = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw storeError("Purchase verification unavailable. Reconnect and restore purchases.")
        }
        return body
    }
    private func storeError(_ message: String) -> NSError { NSError(domain: "SixthSenseStore", code: 1, userInfo: [NSLocalizedDescriptionKey: message]) }
}
