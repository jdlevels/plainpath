import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override the WKWebView user-agent to remove the "Capacitor/X.Y" identifier.
        //
        // Clerk uses Cloudflare Turnstile for bot protection during sign-up (and
        // optionally sign-in).  Turnstile inspects the UA string and rejects embedded
        // webviews whose UA contains non-browser tokens such as "Capacitor", returning:
        //   "Authentication unsuccessful due to failed security validations.
        //    Please try using a different browser or disabling browser extensions."
        //
        // Setting the "UserAgent" key in UserDefaults.standard BEFORE the first
        // WKWebView is created propagates the custom UA to every WKWebView in this
        // process (documented Apple behaviour since iOS 9 / WKWebView introduction).
        // Capacitor reads this key when it initialises its bridge view, so the override
        // takes effect on the very first page load.
        let safariUA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"
        UserDefaults.standard.set(safariUA, forKey: "UserAgent")
        // CI binary guard: NSLog embeds "PlainPath native shell" as a format-string literal
        // in the compiled binary. Unlike unused constants, NSLog calls survive Swift Release
        // optimization because they have observable I/O side effects. The `Binary string check`
        // CI step verifies this string via /usr/bin/strings to confirm the correct AppDelegate
        // was compiled (not the stock Capacitor scaffold).
        NSLog("[PlainPath native shell] UA override applied, build %@",
              Bundle.main.object(forInfoDictionaryKey: kCFBundleVersionKey as String) as? String ?? "?")
        return true
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
