# How to Run Rocket.Chat React Native and Test the Pin/Star Icon Fix

## Quick Start

### Prerequisites
Before running the project, ensure you have the following installed:

**For macOS (iOS):**
- Xcode 14.0+ (for iOS development)
- Node.js v16+
- Ruby (usually pre-installed on macOS)
- CocoaPods: `sudo gem install cocoapods`

**For Android:**
- Android Studio or Android SDK
- Node.js v16+
- Java JDK 11+

**For Both:**
- Git (to manage the repository)

## Installation Steps

### 1. Clean Previous Installation (Recommended)
```bash
cd /Users/dakshyadav/Rocket.Chat.ReactNative

# Remove old dependencies
rm -rf node_modules
rm yarn.lock
rm package-lock.json
```

### 2. Install Dependencies
```bash
# Using npm (recommended if yarn has cache issues)
npm install --legacy-peer-deps

# OR using yarn
yarn install --no-cache
```

This will install all required packages including React Native, Redux, WatermelonDB, etc.

### 3. For iOS Only - Install Pods
```bash
cd ios
pod install --repo-update
cd ..
```

## Running the Project

### Option A: iOS (macOS only)
```bash
# Run on iOS simulator
npm run ios

# Or run using Xcode directly
open ios/RocketChatRN.xcworkspace
# Then select a simulator and press the Run button
```

### Option B: Android
```bash
# Run on Android emulator (must be running first)
npm run android

# Or start the emulator manually in Android Studio first, then:
npx react-native run-android --mode=experimentalDebug --main-activity chat.rocket.reactnative.MainActivity
```

### Option C: Start Metro Bundler Only (for development)
```bash
# This starts the JavaScript bundler without building the app
npm start

# In another terminal, build and run iOS/Android separately
npm run ios
# or
npm run android
```

## Testing the Pin/Star Icon Fix

Once the app is running on your device/emulator:

### Step 1: Connect to a Rocket.Chat Server
1. Open the app
2. Enter your Rocket.Chat server URL
3. Login with your credentials

### Step 2: Navigate to a Room
1. Select any room with messages
2. Find a message to test with

### Step 3: Test Pin Functionality
1. **Long-press** on a message to open the action menu
2. Tap **"Pin"** 
3. **Expected Result:** The pin icon (📌) appears **immediately** on the message
4. Tap the message action menu again
5. Tap **"Unpin"**
6. **Expected Result:** The pin icon **disappears immediately**

### Step 4: Test Star Functionality
1. **Long-press** on a different message
2. Tap **"Star"**
3. **Expected Result:** The star icon (⭐) appears **immediately** on the message
4. Tap the message action menu again
5. Tap **"Unstar"**
6. **Expected Result:** The star icon **disappears immediately**

### Step 5: Test Multiple Actions
1. Try pinning several messages in quick succession
2. Try starring different messages
3. Mix pin and star actions
4. **Expected Result:** All icons update immediately without delay

## Key Changes to Observe

### Before the Fix (Old Behavior)
- Pin/star icon would NOT appear until server sent update via stream
- Users had to wait or perform another action to see the icon
- Icon change felt laggy/delayed

### After the Fix (New Behavior)
- Pin/star icon appears **IMMEDIATELY** after tapping
- Database update happens locally and triggers UI re-render
- Provides instant visual feedback
- Server stream update still syncs everything

## Verify the Fix is Working

### Check the Code Changes
View the file that was modified:
```bash
cd /Users/dakshyadav/Rocket.Chat.ReactNative
cat app/containers/MessageActions/index.tsx | grep -A 25 "const handleStar"
```

### Check the Git Branch
```bash
git log --oneline -5
# Should show: 968301570 Fix: Update pin and star icons immediately after action
```

### View Full Change
```bash
git show fix/pin-star-icons-immediate-update
```

## Troubleshooting

### Issue: Dependencies won't install
**Solution:** Clear npm cache and retry
```bash
npm cache clean --force
npm install --legacy-peer-deps
```

### Issue: iOS build fails
**Solution:** Clean and rebuild
```bash
cd ios
rm -rf Pods
rm Podfile.lock
pod install --repo-update
cd ..
npm run ios
```

### Issue: Android build fails
**Solution:** Clean gradle cache
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### Issue: Metro bundler won't start
**Solution:** Reset the cache
```bash
npm start -- --reset-cache
```

### Issue: App crashes on startup
**Solution:** Clear app data and rebuild
- iOS: Delete the app from simulator and rebuild
- Android: `adb uninstall chat.rocket.android && npm run android`

## Development Tips

### Hot Reload
Once the app is running with `npm start`, you can edit code and it will reload automatically (in most cases).

### Debug Mode
To enable debug menu:
- **iOS:** Cmd+D in simulator
- **Android:** Cmd+M (Mac) or Ctrl+M (Windows/Linux)

### View Logs
```bash
# iOS logs
log stream --predicate 'process == "RocketChatRN"'

# Android logs
npm run log-android
```

## Server Requirements

- **Minimum Server Version:** 0.70.0+
- **Recommended Version:** Latest stable release
- **Server URL:** http://localhost:3000 (for local testing) or your server URL

## Success Criteria

✅ App builds and runs without errors  
✅ Can login to Rocket.Chat server  
✅ Pin icon appears **immediately** after pinning  
✅ Star icon appears **immediately** after starring  
✅ Icons disappear **immediately** after unpinning/unstarring  
✅ Multiple quick actions work without issues  
✅ Icons stay in sync with server state  

## Additional Resources

- **Project Documentation:** https://developer.rocket.chat/docs/mobile-app
- **React Native Docs:** https://reactnative.dev/docs/getting-started
- **Contributing Guide:** CONTRIBUTING.md in the repository

---

**For questions or issues, visit:** https://github.com/RocketChat/Rocket.Chat.ReactNative/issues
