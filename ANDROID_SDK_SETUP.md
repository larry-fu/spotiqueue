# Android SDK Setup on Ubuntu

Steps to set up the Android SDK for Expo/React Native development.

## 1. Install Java (JDK 17 recommended)
```bash
sudo apt update
sudo apt install openjdk-17-jdk
```

## 2. Download Android Studio (easiest path — includes SDK manager)
Grab the current link from https://developer.android.com/studio, then:
```bash
cd ~/Downloads
wget <android-studio-download-url>
tar -xzf android-studio-*-linux.tar.gz -C ~/
~/android-studio/bin/studio.sh
```
Run through the setup wizard — it installs the SDK, platform tools, and an emulator image for you.

## 3. (Alternative) Command-line tools only, no Android Studio GUI
```bash
mkdir -p ~/Android/Sdk/cmdline-tools
cd ~/Android/Sdk/cmdline-tools
wget https://dl.google.com/android/repository/commandlinetools-linux-<version>_latest.zip
unzip commandlinetools-linux-*.zip
mv cmdline-tools latest
```

## 4. Set environment variables
Add to `~/.bashrc` (or `~/.zshrc`):
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/emulator
```
Then:
```bash
source ~/.bashrc
```

## 5. Install SDK packages
```bash
sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0" "emulator" "system-images;android-34;google_apis;x86_64"
```

## 6. Create an emulator (optional, for testing without a physical device)
```bash
avdmanager create avd -n Pixel_7 -k "system-images;android-34;google_apis;x86_64" -d pixel_7
emulator -avd Pixel_7
```

## 7. Verify
```bash
adb devices
```

## Run the Expo app
```bash
npx expo run:android
# or
npx expo start   # then press `a`
```

Note: check https://docs.expo.dev/versions/v57.0.0/get-started/set-up-your-environment/ for anything version-specific, since Expo has changed significantly in recent versions.
