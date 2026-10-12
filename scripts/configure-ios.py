"""Configure public build inputs. Signing material never enters the app bundle."""
import os
import plistlib
from pathlib import Path
import re

root = Path(__file__).resolve().parent.parent
channel = os.environ.get("IOS_RELEASE_CHANNEL", "testing")
if channel not in ("testing", "production"):
    raise SystemExit("IOS_RELEASE_CHANNEL must be testing or production.")
production = channel == "production"
samples = {
    "GADApplicationIdentifier": "ca-app-pub-3940256099942544~1458002511",
    "SenseiBannerAdID": "ca-app-pub-3940256099942544/2934735716",
    "SenseiRewardedAdID": "ca-app-pub-3940256099942544/1712485313",
    "SenseiInterstitialAdID": "ca-app-pub-3940256099942544/4411468910",
}
envs = ["IOS_ADMOB_APP_ID", "IOS_BANNER_AD_ID", "IOS_REWARDED_AD_ID", "IOS_INTERSTITIAL_AD_ID"]
if production and os.environ.get("IOS_RELEASE_APPROVED") != "true":
    raise SystemExit("Complete IOS_RELEASE.md acceptance before approving a production build.")
values = dict(samples)
testing_app_id = os.environ.get("IOS_ADMOB_APP_ID", "")
if not production and testing_app_id:
    if not re.fullmatch(r"ca-app-pub-\d{16}~\d{10}", testing_app_id):
        raise SystemExit("IOS_ADMOB_APP_ID must be an AdMob app ID.")
    # UMP privacy messages belong to the real iOS app; ad units remain Google's samples.
    values["GADApplicationIdentifier"] = testing_app_id
for (key, sample), env in zip(samples.items(), envs):
    if production:
        value = os.environ.get(env, "")
        separator = "~" if key == "GADApplicationIdentifier" else "/"
        if not re.fullmatch(r"ca-app-pub-\d{16}" + re.escape(separator) + r"\d{10}", value) or "3940256099942544" in value:
            raise SystemExit(f"Missing real iOS configuration: {env}")
        values[key] = value
path = root / "ios/App/App/Info.plist"
with path.open("rb") as f:
    info = plistlib.load(f)
info.update(values)
info.update({
    "SenseiAppleVerificationURL": "https://sixth-sense-game.vercel.app/api/apple-store",
    "SenseiReleaseChannel": "production" if production else "testing",
    "ITSAppUsesNonExemptEncryption": False,
    "UIStatusBarHidden": True,
    "GADDelayAppMeasurementInit": True,
    "SKAdNetworkItems": [{"SKAdNetworkIdentifier": "cstr6suwn9.skadnetwork"}],
})
# iPhone first; avoid claiming iPad acceptance/screenshots before testing it.
info.pop("UISupportedInterfaceOrientations~ipad", None)
info.pop("UIMainStoryboardFile", None)
for scene in info.get("UIApplicationSceneManifest", {}).get("UISceneConfigurations", {}).get("UIWindowSceneSessionRoleApplication", []):
    scene.pop("UISceneStoryboardFile", None)
with path.open("wb") as f:
    plistlib.dump(info, f, sort_keys=False)
story = root / "ios/App/App/Base.lproj/Main.storyboard"
story.write_text(story.read_text().replace('customClass="CAPBridgeViewController" customModule="Capacitor"', 'customClass="GameViewController" customModule="SenseiMonetization"'))
project = root / "ios/App/App.xcodeproj/project.pbxproj"
text = project.read_text().replace('TARGETED_DEVICE_FAMILY = "1,2";', 'TARGETED_DEVICE_FAMILY = 1;').replace('MARKETING_VERSION = 1.0;', 'MARKETING_VERSION = 1.0.3;')
project.write_text(text)
config_path = root / "ios/App/App/capacitor.config.json"
if config_path.exists():
    import json
    config = json.loads(config_path.read_text())
    config.setdefault("plugins", {})["SystemBars"] = {"hidden": True}
    config_path.write_text(json.dumps(config, indent=2))
print("Configured iOS", info["SenseiReleaseChannel"], "channel; signing credentials excluded.")
