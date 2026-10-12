import Foundation

// Atomic file replacement makes receipts durable before JS can acknowledge them.
// Nothing sensitive from this file is exposed to JS; only sanitized receipt fields.
final class NativeState {
    private let url: URL
    private(set) var values: [String: Any]
    init() throws {
        var directory = try FileManager.default.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
            .appendingPathComponent("SixthSense", isDirectory: true)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        var resource = URLResourceValues(); resource.isExcludedFromBackup = true
        try directory.setResourceValues(resource)
        url = directory.appendingPathComponent("native-state.json")
        if FileManager.default.fileExists(atPath: url.path) {
            values = try JSONSerialization.jsonObject(with: Data(contentsOf: url)) as? [String: Any] ?? [:]
        } else { values = [:] }
        if values["installation"] == nil { try update { $0["installation"] = UUID().uuidString.lowercased() } }
    }
    func update(_ mutation: (inout [String: Any]) -> Void) throws {
        var next = values; mutation(&next)
        try JSONSerialization.data(withJSONObject: next).write(to: url, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
        values = next
    }
    var age: String { values["ageBand"] as? String ?? "" }
    var installation: UUID { UUID(uuidString: values["installation"] as? String ?? "")! }
    var reward: [String: Any] { values["pendingReward"] as? [String: Any] ?? [:] }
    var purchases: [String: [String: Any]] { values["purchases"] as? [String: [String: Any]] ?? [:] }
    func recordBreak(placement: String, id: String) throws -> Bool {
        guard ["adventure", "multiplayer"].contains(placement), !id.isEmpty, id.count <= 180 else { return false }
        let key = placement + ":" + id
        var seen = values["breaks"] as? [String] ?? []
        guard !seen.contains(key) else { return false }
        seen.append(key)
        let count = placement == "adventure" ? ((values["adventureCount"] as? Int ?? 0) + 1) % 3 : (values["adventureCount"] as? Int ?? 0)
        try update { $0["breaks"] = seen; $0["adventureCount"] = count }
        return placement == "multiplayer" || count == 0
    }
}
