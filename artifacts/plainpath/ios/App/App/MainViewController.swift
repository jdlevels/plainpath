import UIKit
import Capacitor

/// PlainPath native shell — Gate 2 containment.
///
/// Subclasses CAPBridgeViewController to disable WKWebView rubber-band bounce at
/// the native UIKit layer.  CSS overflow/overscroll rules can only suppress
/// web-content scroll; the underlying WKScrollView bounces independently until
/// silenced here.
///
/// Rules:
///   - bounces = false             → no rubber-band on any axis
///   - alwaysBounceVertical = false → no vertical drift when content < viewport
///   - alwaysBounceHorizontal = false → no horizontal drift
///
/// Deliberately NOT setting contentInsetAdjustmentBehavior — Capacitor manages
/// safe-area insets via its own bridge; overriding that breaks status-bar and
/// home-indicator clearance.
class MainViewController: CAPBridgeViewController {

    override func viewDidLoad() {
        super.viewDidLoad()
        disableWebViewBounce()
    }

    private func disableWebViewBounce() {
        guard let scrollView = webView?.scrollView else { return }
        scrollView.bounces = false
        scrollView.alwaysBounceVertical = false
        scrollView.alwaysBounceHorizontal = false
        NSLog("[PlainPath native shell] WKScrollView bounce disabled")
    }
}
