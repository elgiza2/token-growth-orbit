- Keep applicationId stable after the first Play upload and increment versionCode for every subsequent upload. Why: Play identifies updates by the package and version.
- Keep upload keys/passwords outside source and source archives; when the owner requests signing here, use a secure-form password and deliver a password-protected upload keystore for owner backup. Why: release ownership must not rely on temporary sandbox keys.
- The Capacitor shell loads the configured HTTPS origin; never expose private keys or enable arbitrary-origin JS interfaces. Why: only the trusted app should reach native capabilities.
- Native Billing returns purchase tokens to the authenticated server for verification; do not grant access or mark orders paid in native code. Why: store UI success is not entitlement verification.
- Select offers by configured basePlanId/offerId and validated phase terms, with regular-plan fallback for ineligible users. Why: Play offer array order is not a promotion contract.
- Android uses the Capacitor shell and trusted native Play Billing plugin; the server verifies purchases before granting plans. Why: no web payment inside the store app and no client-side entitlement grants.
- Android Google uses system-browser PKCE and /auth/native-return → ceyo://auth/callback. Why: no Google WebView or session tokens in links.
- Assistant features live in si.ceyo.app.assistant and talk to the web only through `MegsyBridge` (`window.MegsyAndroid`), whose HTTPS host must match capacitor.config.ts; phone→web hand-offs are relative paths with `ceyoPrompt`/`ceyoSend`. Why: no arbitrary-origin native access and one bridge contract (docs/android-bridge.md).
- Notification reading for bills/scam links runs on-device in `Sentinel` and never uploads messages; it only works after the user enables the listener. Why: privacy and Play policy.

- Android trial artifacts are selected through CEYO_ANDROID_TRY with a distinct package and build-generated label; google-services.json carries a separate Firebase client for each package. Why: test installs must coexist with production and still receive pushes.

- The Android app ships only the notification reader, push and reminders; voice assistant, wake word and call screening are unregistered from the manifest. Why: owner chose a stable notifications-only phone app.