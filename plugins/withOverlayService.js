/**
 * Expo Config Plugin for Overlay Service
 * 
 * Ye plugin AndroidManifest.xml me overlay service aur permissions add karta hai.
 * Run: expo prebuild --clean
 */

const { withAndroidManifest } = require('@expo/config-plugins');

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

module.exports = function withOverlayService(config) {
  return withAndroidManifest(config, async (config) => {
    config.modResults = addOverlayServiceToManifest(config.modResults);
    return config;
  });
};
