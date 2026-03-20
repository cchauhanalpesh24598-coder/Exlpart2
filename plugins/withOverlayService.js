/**
 * Expo Config Plugin for Overlay Service
 * 
 * Ye plugin:
 * 1. AndroidManifest.xml me overlay service aur permissions add karta hai
 * 2. MainApplication.java me OverlayPackage register karta hai
 * 
 * Run: expo prebuild --clean
 */

const { withAndroidManifest, withMainApplication, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function addOverlayServiceToManifest(androidManifest) {
  const { manifest } = androidManifest;

  // Add uses-permission for SYSTEM_ALERT_WINDOW if not present
  if (!manifest['uses-permission']) {
    manifest['uses-permission'] = [];
  }

  const permissions = manifest['uses-permission'];
  const requiredPermissions = [
    'android.permission.SYSTEM_ALERT_WINDOW',
    'android.permission.FOREGROUND_SERVICE',
    'android.permission.FOREGROUND_SERVICE_SPECIAL_USE',
    'android.permission.POST_NOTIFICATIONS',
  ];

  requiredPermissions.forEach(permission => {
    if (!permissions.some(p => p.$['android:name'] === permission)) {
      permissions.push({
        $: { 'android:name': permission },
      });
    }
  });

  // Add service to application
  const application = manifest.application[0];
  
  if (!application.service) {
    application.service = [];
  }

  // Check if service already exists
  const serviceExists = application.service.some(
    s => s.$['android:name'] === '.overlay.OverlayService'
  );

  if (!serviceExists) {
    application.service.push({
      $: {
        'android:name': '.overlay.OverlayService',
        'android:enabled': 'true',
        'android:exported': 'false',
        'android:foregroundServiceType': 'specialUse',
      },
      'property': [
        {
          $: {
            'android:name': 'android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE',
            'android:value': 'overlay',
          },
        },
      ],
    });
  }

  return androidManifest;
}

function withOverlayMainApplication(config) {
  return withMainApplication(config, async (config) => {
    const contents = config.modResults.contents;
    
    // Add import for OverlayPackage
    const importStatement = 'import com.ocrexcel.app.overlay.OverlayPackage;';
    
    if (!contents.includes(importStatement)) {
      // Find the last import statement and add after it
      const importRegex = /(import .*;\n)(?!import)/;
      const match = contents.match(importRegex);
      
      if (match) {
        config.modResults.contents = contents.replace(
          importRegex,
          `$1${importStatement}\n`
        );
      }
    }
    
    // Add OverlayPackage to getPackages()
    const packageStatement = 'packages.add(new OverlayPackage());';
    
    if (!config.modResults.contents.includes(packageStatement)) {
      // Find getPackages method and add package
      const getPackagesRegex = /(protected List<ReactPackage> getPackages\(\) \{[\s\S]*?List<ReactPackage> packages = new PackageList\(this\)\.getPackages\(\);)/;
      
      if (getPackagesRegex.test(config.modResults.contents)) {
        config.modResults.contents = config.modResults.contents.replace(
          getPackagesRegex,
          `$1\n        // Add Overlay Package for system-wide bubble\n        ${packageStatement}`
        );
      }
    }
    
    return config;
  });
}

function withOverlayNativeFiles(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const packagePath = 'app/src/main/java/com/ocrexcel/app/overlay';
      const androidPath = path.join(projectRoot, 'android', packagePath);
      
      // Ensure directory exists
      if (!fs.existsSync(androidPath)) {
        fs.mkdirSync(androidPath, { recursive: true });
      }
      
      // Copy native files from project to android folder
      const nativeFilesSource = path.join(projectRoot, 'android', packagePath);
      
      // Files will be copied during prebuild
      // The actual Java files should exist in android/app/src/main/java/com/ocrexcel/app/overlay/
      
      return config;
    },
  ]);
}

module.exports = function withOverlayService(config) {
  // Step 1: Add permissions and service to AndroidManifest.xml
  config = withAndroidManifest(config, async (config) => {
    config.modResults = addOverlayServiceToManifest(config.modResults);
    return config;
  });
  
  // Step 2: Register OverlayPackage in MainApplication
  config = withOverlayMainApplication(config);
  
  // Step 3: Ensure native files directory exists
  config = withOverlayNativeFiles(config);
  
  return config;
};
