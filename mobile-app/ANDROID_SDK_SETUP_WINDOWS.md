# Android SDK & Emulator Setup (Windows) for Expo

The error `adb executable doesn't seem to work` / `spawn adb ENOENT` means the Android SDK is not installed or not on your PATH. Follow these steps on Windows.

---

## Step 1: Install Android Studio

1. **Download Android Studio**  
   https://developer.android.com/studio  

2. **Run the installer** and go through the wizard.  
   - Ensure these are selected:
     - **Android SDK**
     - **Android SDK Platform**
     - **Android Virtual Device** (emulator)

3. **Finish the setup.** When prompted, install the default SDK packages.

---

## Step 2: Find your SDK path

After installation, the SDK is usually at:

- **Default:** `C:\Users\<YourUsername>\AppData\Local\Android\Sdk`

To confirm in Android Studio:

- **File → Settings** (or **Android Studio → Settings** on Mac)
- **Languages & Frameworks → Android SDK**
- Note the **Android SDK Location** (e.g. `C:\Users\Tushar\AppData\Local\Android\Sdk`)

---

## Step 3: Set environment variables

Expo/React Native need `ANDROID_HOME` (or `ANDROID_SDK_ROOT`) and `adb` on PATH.

### Option A: Set via Windows GUI

1. Press **Win + R**, type `sysdm.cpl`, Enter.
2. **Advanced** tab → **Environment Variables**.
3. Under **User variables** (or **System variables**):

   **Create or edit:**

   | Variable           | Value (use your actual path) |
   |-------------------|------------------------------|
   | `ANDROID_HOME`    | `C:\Users\<You>\AppData\Local\Android\Sdk` |

4. Edit **Path** (User or System):
   - **New** → `%ANDROID_HOME%\platform-tools`
   - **New** → `%ANDROID_HOME%\emulator`
   - **New** → `%ANDROID_HOME%\tools`  
   (Add `tools\bin` if you use `sdkmanager` from the command line.)

5. Click **OK** on all dialogs.

### Option B: Set in PowerShell (current session only)

Run in PowerShell (replace the path if yours is different):

```powershell
$sdkPath = "$env:LOCALAPPDATA\Android\Sdk"
[Environment]::SetEnvironmentVariable("ANDROID_HOME", $sdkPath, "User")
$path = [Environment]::GetEnvironmentVariable("Path", "User")
$add = "$sdkPath\platform-tools;$sdkPath\emulator;$sdkPath\tools"
if ($path -notlike "*$sdkPath*") { [Environment]::SetEnvironmentVariable("Path", "$path;$add", "User") }
```

Then **close and reopen** your terminal (and Cursor) so the new variables are picked up.

---

## Step 4: Create an Android Virtual Device (AVD)

1. Open **Android Studio**.
2. **More Actions** → **Virtual Device Manager** (or **Tools → Device Manager**).
3. **Create Device**:
   - Pick a phone (e.g. **Pixel 6**).
   - **Next**.
4. **System Image**:
   - Select a **Release** (e.g. **Tiramisu** API 33 or **UpsideDownCake** API 34).
   - Click **Download** if needed, then **Next**.
5. Name the AVD → **Finish**.

---

## Step 5: Verify

1. **Close all terminals and Cursor**, then open a **new** PowerShell.

2. Check `adb` and env:

   ```powershell
   adb version
   echo $env:ANDROID_HOME
   ```

   You should see ADB version info and your SDK path.

3. Start the emulator from Android Studio (**Device Manager → Play** on your AVD**)**, then in the project folder:

   ```powershell
   cd T:\INOLIFE HEALTHCARE\mobile-app
   npx expo start --android
   ```

   Or run `npx expo start` and press **a** for Android.

---

## If it still says "adb ENOENT"

- Confirm **ANDROID_HOME** points to the folder that contains `platform-tools` and `emulator`.
- Ensure `platform-tools` is on **Path** (`%ANDROID_HOME%\platform-tools`).
- Restart Cursor/terminal after changing environment variables.
- Run `adb version` in a **new** PowerShell; if it fails, PATH or ANDROID_HOME is still wrong.

---

## Optional: Use a physical Android device

1. On the phone: **Settings → Developer options** → enable **USB debugging**.
2. Connect via USB.
3. Run `adb devices` to confirm the device is listed.
4. Run `npx expo start --android`; the app can open on the device.
