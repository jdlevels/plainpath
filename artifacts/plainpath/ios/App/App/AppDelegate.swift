import UIKit
import Capacitor

// ── CI binary presence anchor ──────────────────────────────────────────────────
// StaticString is stored as a direct UTF-8 pointer in __TEXT,__cstring.
// It survives all Swift optimizations (WMO, -Osize) and is detectable by
// both `grep -a` and `strings` in CI's binary string check step.
// The @_used attribute prevents dead-code elimination.
@_used private let _ppNativeDiagAnchor: StaticString = "pp-native-diag-v1"

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        return true
    }

    // ── Native startup diagnostic ──────────────────────────────────────────────
    // Shows a PlainPath-blue overlay for 5 s when the app first becomes active.
    // Purpose: prove that the native layer (UIKit / Capacitor bridge) is alive
    //          independently of whether WKWebView loads index.html.
    //
    // Diagnostic guide:
    //   Blue overlay visible  → native shell is alive; blank = WebView problem
    //   Nothing visible       → native shell itself is not rendering (UIKit issue)
    //
    // Remove this block once the blank screen is confirmed resolved.
    func applicationDidBecomeActive(_ application: UIApplication) {
        guard let window = window else { return }
        guard window.viewWithTag(9_998) == nil else { return }

        let buildNum = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "?"

        let overlay = UIView(frame: window.bounds)
        overlay.tag = 9_998
        overlay.backgroundColor = UIColor(red: 0.31, green: 0.49, blue: 0.67, alpha: 1.0)
        overlay.autoresizingMask = [.flexibleWidth, .flexibleHeight]

        let label = UILabel()
        label.translatesAutoresizingMaskIntoConstraints = false
        label.numberOfLines = 0
        label.textAlignment = .center
        label.textColor = .white
        label.font = UIFont.boldSystemFont(ofSize: 20)
        label.text = "PlainPath native shell ✓\nBuild \(buildNum)\nNative layer alive\nWebView loading…"

        overlay.addSubview(label)
        NSLayoutConstraint.activate([
            label.leadingAnchor.constraint(equalTo: overlay.leadingAnchor, constant: 24),
            label.trailingAnchor.constraint(equalTo: overlay.trailingAnchor, constant: -24),
            label.centerYAnchor.constraint(equalTo: overlay.centerYAnchor),
        ])

        window.addSubview(overlay)

        DispatchQueue.main.asyncAfter(deadline: .now() + 5.0) {
            UIView.animate(withDuration: 0.4, animations: {
                overlay.alpha = 0
            }, completion: { _ in
                overlay.removeFromSuperview()
            })
        }
    }

    func applicationWillResignActive(_ application: UIApplication) {
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
    }

    func applicationWillTerminate(_ application: UIApplication) {
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}
