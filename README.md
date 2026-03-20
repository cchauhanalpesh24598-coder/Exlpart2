# OCR Excel App

WhatsApp se messages aur photos share karke automatically data extract karo aur Excel me export karo.

## Features

- WhatsApp se share intent receive karo
- Messages se Bank Name, Applicant Name, Reason extract karo (Regex)
- Photos se GPS coordinates extract karo (OCR)
- Table me data dikhao (auto-filled fields highlighted)
- Excel (.xlsx) me export karo

## Logic

```
Message 1 → SIRF Photo 1 ka OCR → Row 1
Message 2 → SIRF Photo 1 ka OCR → Row 2
Message 3 → SIRF Photo 1 ka OCR → Row 3
...
(Har message ke baaki 9 photos SKIP)
```

## Setup Instructions

### Step 1: Prerequisites

1. [Node.js](https://nodejs.org/) install karo (v18+)
2. [Expo account](https://expo.dev/) banao
3. EAS CLI install karo:
   ```bash
   npm install -g eas-cli
   ```

### Step 2: Project Setup

```bash
# Clone ya download karo
cd ocr-excel-app

# Dependencies install karo
npm install

# Expo account me login karo
eas login
```

### Step 3: EAS Build Configure

```bash
# EAS project configure karo
eas build:configure
```

### Step 4: Local Testing

```bash
# Expo dev server start karo
npx expo start

# Android emulator me test karo
npx expo start --android
```

### Step 5: APK Build

```bash
# APK build karo
eas build --platform android --profile preview
```

## GitHub Actions se APK Build

### Step 1: GitHub Repository Create

1. GitHub pe new repository banao
2. Saara code push karo:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

### Step 2: Expo Token Add

1. [Expo Tokens](https://expo.dev/accounts/[username]/settings/access-tokens) pe jao
2. New token create karo
3. GitHub repo settings me jao → Secrets → Actions
4. New secret add karo:
   - Name: `EXPO_TOKEN`
   - Value: Apna Expo token paste karo

### Step 3: Assets Add

`assets/` folder me ye images add karo:
- `icon.png` (1024x1024) - App icon
- `splash.png` (1284x2778) - Splash screen
- `adaptive-icon.png` (1024x1024) - Android adaptive icon

### Step 4: Build Trigger

1. Code push karo `main` branch pe
2. GitHub Actions automatically APK build karega
3. Releases section me APK download hoga

## Manual APK Download

Har push ke baad:
1. GitHub repo pe jao
2. "Releases" tab click karo
3. Latest release ka APK download karo
4. Phone pe install karo

## App Columns

| Column | Auto-filled | Source |
|--------|-------------|--------|
| Bank Name | Yes | Regex (parentheses) |
| Applicant Name | Yes | Regex (applicant:-) |
| Status | No | Manual |
| Reason of CNV | Yes | Regex (first line) |
| Latlong From | No | Manual |
| Latlong To | Yes | OCR (GPS watermark) |
| Area | No | Manual |
| KM | No | Manual |

## Regex Patterns

```javascript
// Bank Name - last parentheses
// "Report done(HDFC Bank)" → "HDFC Bank"
/\(([^)]+)\)\s*$/

// Applicant Name
// "applicant:- Ramesh Kumar" → "Ramesh Kumar"
/applicant\s*[:\-]+\s*(.+?)(?:\n|$)/i

// Reason - first line
// "Property Visit Report\n..." → "Property Visit Report"
/^([^\n(]+)/
```

## GPS Patterns

```javascript
// Standard: 22.12345N 77.12345E
/(\d+\.?\d*)[°\s]*([NS])\s*[,\s]*(\d+\.?\d*)[°\s]*([EW])/gi

// Decimal: 22.12345, 77.12345
/(\d{1,3}\.\d{4,})\s*[,\s]\s*(\d{1,3}\.\d{4,})/g
```

## Troubleshooting

### OCR not working
- Photo quality check karo
- GPS watermark clearly visible hona chahiye
- ML Kit install check karo

### Share intent not working
- App permissions check karo
- AndroidManifest intent filters verify karo

### Build failed
- `expo-cli` aur `eas-cli` latest version use karo
- Dependencies conflicts resolve karo

## Tech Stack

- React Native + Expo
- Expo Router (navigation)
- ML Kit Text Recognition (OCR)
- SheetJS (Excel export)
- AsyncStorage (local storage)

## Support

Issues ho toh GitHub Issues me report karo.
