# iOS TestFlight Setup Guide

This guide walks through the one-time setup needed before the GitHub Actions workflow can build and deploy your iOS app to TestFlight.

## Prerequisites

- Apple Developer Program membership ($99/year) — [developer.apple.com](https://developer.apple.com)
- Access to App Store Connect — [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
- A Mac (for generating certificates) — can be done once, then CI handles the rest

---

## Step 1: Create the App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com) → **Apps** → **+** → **New App**
2. Fill in:
   - **Platform**: iOS
   - **Name**: 2028.ai
   - **Primary Language**: English (U.S.)
   - **Bundle ID**: Register `com.easierbycode.game2028.ai` first (see Step 2)
   - **SKU**: `game-2028-ai` (any unique string)
3. Click **Create**

## Step 2: Register the Bundle ID

1. Go to [Apple Developer → Identifiers](https://developer.apple.com/account/resources/identifiers/list)
2. Click **+** → **App IDs** → **App**
3. Enter:
   - **Description**: 2028.ai
   - **Bundle ID** (Explicit): `com.easierbycode.game2028.ai`
4. No special capabilities needed (it's a WebView game)
5. Click **Continue** → **Register**

## Step 3: Create a Distribution Certificate

On your Mac:

```bash
# Generate a certificate signing request (CSR)
openssl req -nodes -newkey rsa:2048 \
  -keyout ios_distribution.key \
  -out CertificateSigningRequest.certSigningRequest \
  -subj "/emailAddress=daniel@easierbycode.com/CN=Daniel Johnson/C=US"
```

Then:
1. Go to [Apple Developer → Certificates](https://developer.apple.com/account/resources/certificates/list)
2. Click **+** → **Apple Distribution**
3. Upload the CSR file
4. Download the `.cer` file
5. Convert to `.p12`:

```bash
# Convert .cer to .pem
openssl x509 -inform DER -in distribution.cer -out distribution.pem

# Create .p12 (you'll set a password — save it for the GitHub secret)
openssl pkcs12 -export \
  -inkey ios_distribution.key \
  -in distribution.pem \
  -out distribution.p12
```

## Step 4: Create a Provisioning Profile

1. Go to [Apple Developer → Profiles](https://developer.apple.com/account/resources/profiles/list)
2. Click **+** → **App Store Connect** (under Distribution)
3. Select your App ID: `com.easierbycode.game2028.ai`
4. Select your Distribution certificate
5. Name it: `2028ai AppStore`
6. Download the `.mobileprovision` file

## Step 5: Create an App Store Connect API Key

1. Go to [App Store Connect → Users and Access → Integrations → App Store Connect API](https://appstoreconnect.apple.com/access/integrations/api)
2. Click **+** to generate a new key
3. **Name**: `GitHub Actions CI`
4. **Access**: `App Manager` (minimum needed for TestFlight uploads)
5. Download the `.p8` file — **you can only download this once!**
6. Note the **Key ID** and **Issuer ID** shown on the page

## Step 6: Add GitHub Repository Secrets

Go to your repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

| Secret Name | Value | How to get it |
|---|---|---|
| `BUILD_CERTIFICATE_BASE64` | Base64-encoded `.p12` file | `base64 -i distribution.p12 \| pbcopy` |
| `P12_PASSWORD` | Password you set when creating the `.p12` | From Step 3 |
| `BUILD_PROVISION_PROFILE_BASE64` | Base64-encoded provisioning profile | `base64 -i 2028ai_AppStore.mobileprovision \| pbcopy` |
| `KEYCHAIN_PASSWORD` | Any random string | Generate one: `openssl rand -hex 16` |
| `APPLE_TEAM_ID` | Your 10-character Team ID | [developer.apple.com/account](https://developer.apple.com/account) → Membership details |
| `PROVISIONING_PROFILE_NAME` | Profile name exactly as created | e.g. `2028ai AppStore` |
| `CODE_SIGN_IDENTITY` | Certificate identity | Usually `Apple Distribution: Daniel Johnson (TEAM_ID)` |
| `ASC_KEY_ID` | App Store Connect API Key ID | From Step 5 |
| `ASC_ISSUER_ID` | App Store Connect Issuer ID | From Step 5 |
| `ASC_API_KEY` | Contents of the `.p8` file | `cat AuthKey_XXXXXXXX.p8 \| pbcopy` |

## Step 7: Push and Watch It Build

```bash
git add .
git commit -m "Add iOS TestFlight CI workflow"
git push origin main
```

The workflow triggers on push to `main` or via manual dispatch (Actions tab → "Run workflow").

## Monitoring

- **Build progress**: GitHub repo → Actions tab → "iOS Build & TestFlight Deploy"
- **TestFlight**: After a successful upload, the build appears in App Store Connect → TestFlight within ~15 minutes (Apple processes the build)
- **Add testers**: In App Store Connect → TestFlight → Internal Testing / External Testing → add testers by email

## Troubleshooting

### "No signing certificate found"
- Verify `BUILD_CERTIFICATE_BASE64` is correct: `echo $SECRET | base64 --decode > test.p12` should produce a valid file
- Check `CODE_SIGN_IDENTITY` matches exactly (run `security find-identity -v -p codesigning` on your Mac)

### "Provisioning profile doesn't match"
- The profile must be for bundle ID `com.easierbycode.game2028.ai`
- The profile must include your distribution certificate
- Re-download and re-encode if you regenerated the cert

### Build succeeds but TestFlight upload fails
- Check `ASC_KEY_ID`, `ASC_ISSUER_ID`, and `ASC_API_KEY` are all correct
- The API key must have at least `App Manager` role
- The app must exist in App Store Connect with the matching bundle ID
