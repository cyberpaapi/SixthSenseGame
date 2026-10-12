"""Ephemeral macOS runner signing; no secrets printed, committed or uploaded as artifacts."""
import base64
import os
from pathlib import Path
import plistlib
import secrets
import subprocess
import sys

temp = Path(os.environ["RUNNER_TEMP"]).resolve()
keychain = temp / "sixthsense-signing.keychain-db"
profile_dir = Path.home() / "Library/MobileDevice/Provisioning Profiles"
api_dir = Path.home() / ".appstoreconnect/private_keys"
marker = temp / "sixthsense-signing-files.txt"
def run(*args):
    result = subprocess.run(args, capture_output=True)
    if result.returncode:
        raise SystemExit("Signing tool failed: " + args[0] + ". Check the configured certificate/profile; secret output was suppressed.")
    return result.stdout

if sys.argv[1] == "cleanup":
    if keychain.exists():
        subprocess.run(["security", "delete-keychain", str(keychain)], capture_output=True)
    if marker.exists():
        for name in marker.read_text().splitlines():
            path = Path(name).resolve()
            if path.is_relative_to(temp) or path.parent == profile_dir.resolve() or path.parent == api_dir.resolve():
                path.unlink(missing_ok=True)
        marker.unlink()
    sys.exit()

required = ["APPLE_TEAM_ID", "APPLE_CERTIFICATE_BASE64", "APPLE_CERTIFICATE_PASSWORD", "APPLE_PROFILE_BASE64", "APP_STORE_CONNECT_KEY_ID", "APP_STORE_CONNECT_ISSUER_ID", "APP_STORE_CONNECT_PRIVATE_KEY"]
for key in required:
    if not os.environ.get(key):
        raise SystemExit("Missing GitHub ios-release configuration: " + key)
password = secrets.token_urlsafe(32)
certificate = temp / "distribution.p12"
profile = temp / "distribution.mobileprovision"
certificate.write_bytes(base64.b64decode(os.environ["APPLE_CERTIFICATE_BASE64"], validate=True))
profile.write_bytes(base64.b64decode(os.environ["APPLE_PROFILE_BASE64"], validate=True))
marker.write_text(str(certificate) + "\n" + str(profile) + "\n")
metadata = plistlib.loads(run("security", "cms", "-D", "-i", str(profile)))
team = os.environ["APPLE_TEAM_ID"]
if metadata["Entitlements"].get("application-identifier") != team + ".com.sensei.sixthsense" or metadata["Entitlements"].get("get-task-allow", False) or "ProvisionedDevices" in metadata:
    raise SystemExit("An App Store distribution profile for the matching team and bundle ID is required.")
profile_dir.mkdir(parents=True, exist_ok=True)
installed = profile_dir / (metadata["UUID"] + ".mobileprovision")
installed.write_bytes(profile.read_bytes())
api_dir.mkdir(parents=True, exist_ok=True)
key = api_dir / ("AuthKey_" + os.environ["APP_STORE_CONNECT_KEY_ID"] + ".p8")
key.write_text(os.environ["APP_STORE_CONNECT_PRIVATE_KEY"]); key.chmod(0o600)
with marker.open("a") as f:
    f.write(str(installed)+"\n"+str(key)+"\n")
run("security", "create-keychain", "-p", password, str(keychain))
run("security", "set-keychain-settings", "-lut", "21600", str(keychain))
run("security", "unlock-keychain", "-p", password, str(keychain))
run("security", "import", str(certificate), "-P", os.environ["APPLE_CERTIFICATE_PASSWORD"], "-A", "-t", "cert", "-f", "pkcs12", "-k", str(keychain))
run("security", "set-key-partition-list", "-S", "apple-tool:,apple:", "-k", password, str(keychain))
run("security", "list-keychains", "-d", "user", "-s", str(keychain))
with (temp / "ExportOptions.plist").open("wb") as f:
    plistlib.dump({"method": "app-store-connect", "teamID": team, "signingStyle": "manual", "signingCertificate": "Apple Distribution", "provisioningProfiles": {"com.sensei.sixthsense": metadata["Name"]}, "manageAppVersionAndBuildNumber": False}, f)
with open(os.environ["GITHUB_ENV"], "a") as f:
    f.write("IOS_PROFILE_NAME=" + metadata["Name"].replace("\n", "") + "\n")
print("Signing material installed in the ephemeral runner.")
