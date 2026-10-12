import Foundation

@main struct NativeStateChecks {
    static func expect(_ value: Bool) { precondition(value) }
    static func main() throws {
        let root = FileManager.default.temporaryDirectory.appendingPathComponent("sixthsense-test-" + UUID().uuidString)
        defer { try? FileManager.default.removeItem(at: root) }
        let state = try NativeState(directory: root)
        let installation = state.installation
        expect(try state.recordBreak(placement: "adventure", id: "level-1") == false)
        expect(try state.recordBreak(placement: "adventure", id: "level-2") == false)
        let restored = try NativeState(directory: root)
        expect(restored.installation == installation)
        expect(try restored.recordBreak(placement: "adventure", id: "level-3") == true)
        expect(try restored.recordBreak(placement: "adventure", id: "level-3") == false)
        expect(try restored.recordBreak(placement: "multiplayer", id: "room:player") == true)
        expect(try restored.recordBreak(placement: "multiplayer", id: "room:player") == false)
        expect(try restored.recordBreak(placement: "daily", id: "today") == false)
        try restored.update { $0["pendingReward"] = ["claimId": "earned-reward", "coins": 240, "kind": "coins"] }
        let reward = try NativeState(directory: root)
        expect(reward.reward["coins"] as? Int == 240)
        expect(reward.installation == installation)
        // Failed serialization must leave both disk and in-memory receipt untouched.
        do { try reward.update { $0["invalid"] = URL(string: "https://example.invalid")! }; fatalError("Invalid JSON was accepted") }
        catch { expect(reward.values["invalid"] == nil) }
        expect(try NativeState(directory: root).reward["claimId"] as? String == "earned-reward")
        print("Native state passed: persistent cadence, deduplication, installation identity, reward recovery and failed-write atomicity.")
    }
}
