import Capacitor
import UIKit

// A real native banner sits outside the WebView, never over a keyboard or lifeline.
public final class GameViewController: CAPBridgeViewController {
    private var webBottom: NSLayoutConstraint?
    private weak var banner: UIView?
    var onLayout: (() -> Void)?
    public override var prefersStatusBarHidden: Bool { true }

    public override func capacitorDidLoad() {
        guard let web = webView else { return }
        let container = UIView()
        container.backgroundColor = UIColor(red: 0.08, green: 0.05, blue: 0.14, alpha: 1)
        view = container
        container.addSubview(web)
        web.translatesAutoresizingMaskIntoConstraints = false
        web.scrollView.contentInsetAdjustmentBehavior = .never
        webBottom = web.bottomAnchor.constraint(equalTo: container.bottomAnchor)
        NSLayoutConstraint.activate([
            web.topAnchor.constraint(equalTo: container.topAnchor),
            web.leadingAnchor.constraint(equalTo: container.safeAreaLayoutGuide.leadingAnchor),
            web.trailingAnchor.constraint(equalTo: container.safeAreaLayoutGuide.trailingAnchor), webBottom!
        ])
        // Keep a direct linker reference, but never instantiate a second registered plugin.
        if bridge?.plugin(withName: "SenseiMonetization") == nil {
            bridge?.registerPluginInstance(SenseiMonetizationPlugin())
        }
    }

    func showBanner(_ next: UIView?) {
        if banner !== next { banner?.removeFromSuperview(); banner = next }
        if let next, next.superview == nil { view.addSubview(next) }
        layoutBanner()
    }
    private func layoutBanner() {
        let height = banner?.bounds.height ?? 0
        let reserve = banner == nil ? 0 : height + 8 + view.safeAreaInsets.bottom
        webBottom?.constant = -reserve
        if let banner {
            banner.center = CGPoint(x: view.bounds.midX, y: view.bounds.height - view.safeAreaInsets.bottom - height / 2)
        }
    }
    public override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        layoutBanner()
        onLayout?()
    }
}
