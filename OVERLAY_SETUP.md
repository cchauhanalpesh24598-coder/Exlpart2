# Floating Bubble Overlay Setup Guide

Ye guide app me system-wide floating bubble setup karne ke liye hai.

## Problems Solved

1. **Bubble disappearing outside app** - Ab bubble har app ke upar visible rahega (WhatsApp, Home screen, etc.)
2. **Ring alignment issue** - Ab ring aur bubble perfectly aligned hai
3. **Data visibility issue** - Ab collected data app me clearly visible hai

## Quick Setup (One-time)

### Step 1: Prebuild the project

```bash
npx expo prebuild --clean
```

Ye automatically:
- AndroidManifest.xml me permissions add karega
- OverlayService register karega
- OverlayPackage ko MainApplication me add karega

### Step 2: Build the app

```bash
npx expo run:android
```

Ya release build ke liye:
```bash
cd android && ./gradlew assembleRelease
```

## How Overlay Works

### System-Wide Bubble (Main Feature)
- **Foreground Service**: `OverlayService.java` bubble ko background me run karta hai
- **WindowManager + TYPE_APPLICATION_OVERLAY**: Bubble ko sabhi apps ke upar draw karta hai
- **Notification**: Android requirement ke hisaab se notification show hota hai

### Permission Flow
1. User "Enable Bubble" press karta hai
2. App check karta hai `SYSTEM_ALERT_WINDOW` permission
3. Agar permission nahi hai:
   - Settings page open hota hai automatically
   - User "Allow display over other apps" ON karta hai
4. App me wapas aao aur bubble start ho jayega

## Data Visibility

### Home Screen me Data View
- Bubble enable hone ke baad "Collected Data" section dikhega
- Har row ka status (Complete/Pending) dikhega
- Applicant name, Bank, GPS sab visible
- Raw message bhi dekh sakte ho

### Table View me Bubble Panel
- Table ke upar Bubble collection panel dikhega
- Complete aur pending rows ka count
- Tap karke details dekh sakte ho

## Files Structure

```
android/app/src/main/java/com/ocrexcel/app/overlay/
├── OverlayService.java      # Foreground service for bubble
├── OverlayModule.java       # React Native bridge
├── OverlayPackage.java      # Package registration
└── NativeBubbleView.java    # Native bubble UI with aligned ring

src/
├── native/
│   └── OverlayModule.ts     # TypeScript wrapper
├── components/
│   ├── FloatingBubble.tsx   # In-app bubble (aligned ring)
│   └── BubbleControls.tsx   # Enable/disable controls
└── context/
    └── BubbleContext.tsx    # Bubble state management

plugins/
└── withOverlayService.js    # Expo config plugin
```

## Troubleshooting

### Problem: Bubble not showing outside app

**Solution 1**: Permission check karo
- Settings > Apps > OCR Excel App > Special app access > Display over other apps > ON

**Solution 2**: Service running hai check karo
- Notification bar me "OCR Bubble Active" dikhna chahiye

**Solution 3**: App rebuild karo
```bash
npx expo prebuild --clean
npx expo run:android
```

### Problem: Data table me data nahi dikh raha

**Solution**: 
- Home screen pe "Collected Data" section dekho
- "Process X Rows" button dabao to table me jayega
- Table view me "Bubble Collection" panel check karo

### Problem: Ring alignment off hai

**Solution**: 
- `react-native-svg` installed hona chahiye
- Ring ka new formula: `radius = (BUBBLE_SIZE / 2) + RING_PADDING + (RING_STROKE / 2)`

### Problem: Permission dialog nahi aa raha

**Solution**: Manually Settings open karo
- Settings > Apps > OCR Excel App > Special app access > Display over other apps

## Workflow Example

```
1. App open karo
2. "Enable Bubble" dabao
3. Permission do (first time only)
4. WhatsApp open karo
5. Message copy karo → Bubble half filled
6. Photo open karo
7. Bubble ka Scan button dabao → GPS extract
8. Ring full ho gaya → Row complete
9. App me wapas aao → "Collected Data" dekho
10. "Process Rows" dabao → Table me export
```

## Visual Guide

### Bubble States:

```
[Empty]        [Half Ring]       [Full Ring]
   ○              ◐                  ●
No data     Message copied    GPS + Message
```

### Progress Ring Alignment:

```
     ╭────────────╮
     │  ●●●●●●●●  │ ← Ring (4dp stroke)
     │ ╭────────╮ │
     │ │        │ │ ← 3dp padding
     │ │   1    │ │ ← Bubble (56dp)
     │ │  Row   │ │
     │ ╰────────╯ │
     │      [Scan]│ ← Scan button
     ╰────────────╯
```
