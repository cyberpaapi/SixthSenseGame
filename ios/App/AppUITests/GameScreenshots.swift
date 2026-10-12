import XCTest

final class GameScreenshots: XCTestCase {
    override func tearDown() {
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        attachment.name = "final-ui-state"; attachment.lifetime = .keepAlways; add(attachment)
        let hierarchy = XCTAttachment(string: XCUIApplication(bundleIdentifier: "com.sensei.sixthsense").debugDescription)
        hierarchy.name = "accessibility-hierarchy"; hierarchy.lifetime = .keepAlways; add(hierarchy)
        super.tearDown()
    }
    func testNativeGameAndCapture() {
        continueAfterFailure = false
        let app = XCUIApplication(bundleIdentifier: "com.sensei.sixthsense")
        app.launch()
        let age = app.buttons["Under 13"]
        XCTAssertTrue(age.waitForExistence(timeout: 30), "Native bridge must present age onboarding")
        tap(age) // Actual eligibility path keeps screenshots free of ad creative.
        let guest = app.buttons["Play solo as a guest"]
        XCTAssertTrue(guest.waitForExistence(timeout: 15)); tap(guest)
        let close = app.buttons["Close how to play"]
        if close.waitForExistence(timeout: 5) { tap(close) }
        capture("01-home")
        let adventure = app.buttons["Continue adventure"]
        if !adventure.isHittable { app.swipeUp() }
        XCTAssertTrue(adventure.waitForExistence(timeout: 10)); tap(adventure)
        let play = app.buttons["Play"]
        XCTAssertTrue(play.waitForExistence(timeout: 10)); capture("02-adventure")
        tap(play)
        let sense = app.buttons.matching(NSPredicate(format: "label CONTAINS[c] %@", "Sense")).matching(NSPredicate(format: "label CONTAINS %@", "30")).firstMatch
        XCTAssertTrue(sense.waitForExistence(timeout: 10)); capture("03-puzzle")
        tap(sense)
        let ok = app.buttons["OK"]
        XCTAssertTrue(ok.waitForExistence(timeout: 10)); capture("04-clue")
        tap(ok)
        XCUIDevice.shared.orientation = .landscapeLeft
        capture("05-landscape")
        XCUIDevice.shared.orientation = .portrait
        app.terminate(); app.launch()
        XCTAssertFalse(app.buttons["Under 13"].waitForExistence(timeout: 3), "Native age choice persists across restart")
    }
    private func tap(_ element: XCUIElement) {
        // WebKit accessibility exposes controls before CSS entry motion completes.
        // Tap the visible center once, after settling; never retry/double-tap a failed action.
        RunLoop.current.run(until: Date().addingTimeInterval(1.2))
        XCTAssertTrue(element.isHittable)
        element.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
    }
    private func capture(_ name: String) {
        // Wait for finite entry animation, then capture actual simulator pixels.
        RunLoop.current.run(until: Date().addingTimeInterval(1.5))
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        attachment.name = name; attachment.lifetime = .keepAlways; add(attachment)
    }
}
