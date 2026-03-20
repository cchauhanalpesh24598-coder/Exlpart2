# Floating Bubble Overlay Setup Guide

Ye guide app me system-wide floating bubble setup karne ke liye hai.

## Problem Solved

1. **Bubble disappearing outside app** - Ab bubble har app ke upar visible rahega (WhatsApp, Home screen, etc.)
2. **Ring alignment issue** - Ab ring aur bubble perfectly aligned hai

## Setup Steps

### Step 1: Prebuild the project

```bash
npx expo prebuild --clean
```

### Step 2: Add OverlayPackage to MainApplication.java

File: `android/app/src/main/java/com/ocrexcel/app/MainApplication.java`

`getPackages()` method me ye line add karo:

```java
import com.ocrexcel.app.overlay.OverlayPackage;

// Inside getPackages() method, add:
packages.add(new OverlayPackage());
```

### Step 3: Build the app

```bash
cd android
./gradlew assembleRelease
```

Ya debug build ke liye:

```bash
npx expo run:android
```

## How It Works

### Foreground Service
- `OverlayService.java` - Background service jo bubble ko screen par dikhata hai
- Foreground notification show karta hai (Android requirement)
- Service tab tak active rehta hai jab tak user manually disable na kare

### WindowManager + TYPE_APPLICATION_OVERLAY
- Ye Android ka system-level overlay hai
- `SYSTEM_ALERT_WINDOW` permission chahiye
- Bubble ko har app ke upar draw kar sakta hai

### Permission Flow
1. User "Enable Bubble" dabata hai
2. App check karta hai ki permission hai ya nahi
3. Agar nahi hai, to Settings page open hota hai
4. User permission ON karta hai
5. Bubble start ho jata hai

## Files Created/Modified

### New Files:
- `android/app/src/main/java/com/ocrexcel/app/overlay/OverlayService.java`
- `android/app/src/main/java/com/ocrexcel/app/overlay/NativeBubbleView.java`
- `android/app/src/main/java/com/ocrexcel/app/overlay/OverlayModule.java`
- `android/app/src/main/java/com/ocrexcel/app/overlay/OverlayPackage.java`
- `src/native/OverlayModule.ts`
- `plugins/withOverlayService.js`

### Modified Files:
- `src/components/FloatingBubble.tsx` - Ring alignment fix (SVG based)
- `src/components/BubbleControls.tsx` - Native overlay integration
- `app.config.js` - Permissions added
- `package.json` - react-native-svg added

## Troubleshooting

### Bubble not showing?
1. Check "Draw over other apps" permission in Settings > Apps > OCR Excel App > Special permissions
2. Make sure service is running (check notification)

### Permission dialog not appearing?
- Manually go to Settings > Apps > OCR Excel App > Special app access > Display over other apps

### Ring not aligned?
- Make sure `react-native-svg` is installed
- Run `npm install` and rebuild

## UI Preview

```
    ┌─────────────┐
    │  Progress   │  <- Ring exactly on bubble edge
    │    Ring     │
    │   ┌─────┐   │
    │   │  1  │   │  <- Row number
    │   │ Row │   │
    │   └─────┘   │
    │        [Scan]│  <- Scan button
    └─────────────┘
         │
    ┌────┴────┐
    │22.1234, │  <- GPS Box
    │71.1234  │
    └─────────┘
```
