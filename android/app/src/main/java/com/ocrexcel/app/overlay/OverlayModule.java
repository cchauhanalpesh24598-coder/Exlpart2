package com.ocrexcel.app.overlay;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.module.annotations.ReactModule;

/**
 * OverlayModule - React Native Bridge for Overlay Service
 * 
 * Ye module React Native se native overlay service ko control karta hai.
 */
@ReactModule(name = OverlayModule.NAME)
public class OverlayModule extends ReactContextBaseJavaModule {
    
    public static final String NAME = "OverlayModule";
    
    public OverlayModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }
    
    @Override
    public String getName() {
        return NAME;
    }
    
    /**
     * Check if overlay permission is granted
     */
    @ReactMethod
    public void checkOverlayPermission(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                boolean canDraw = Settings.canDrawOverlays(getReactApplicationContext());
                promise.resolve(canDraw);
            } else {
                promise.resolve(true);
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
    
    /**
     * Request overlay permission - opens system settings
     */
    @ReactMethod
    public void requestOverlayPermission(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (!Settings.canDrawOverlays(getReactApplicationContext())) {
                    Intent intent = new Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:" + getReactApplicationContext().getPackageName())
                    );
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getReactApplicationContext().startActivity(intent);
                    promise.resolve(false); // User needs to grant permission
                } else {
                    promise.resolve(true); // Already granted
                }
            } else {
                promise.resolve(true); // Not needed for older versions
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
    
    /**
     * Start the overlay service
     */
    @ReactMethod
    public void startOverlay(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (!Settings.canDrawOverlays(getReactApplicationContext())) {
                    promise.reject("PERMISSION_DENIED", "Overlay permission not granted");
                    return;
                }
            }
            
            Intent serviceIntent = new Intent(getReactApplicationContext(), OverlayService.class);
            serviceIntent.setAction("START_OVERLAY");
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getReactApplicationContext().startForegroundService(serviceIntent);
            } else {
                getReactApplicationContext().startService(serviceIntent);
            }
            
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
    
    /**
     * Stop the overlay service
     */
    @ReactMethod
    public void stopOverlay(Promise promise) {
        try {
            Intent serviceIntent = new Intent(getReactApplicationContext(), OverlayService.class);
            serviceIntent.setAction("STOP_OVERLAY");
            getReactApplicationContext().startService(serviceIntent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
    
    /**
     * Update bubble state
     */
    @ReactMethod
    public void updateBubbleState(ReadableMap state, Promise promise) {
        try {
            Intent serviceIntent = new Intent(getReactApplicationContext(), OverlayService.class);
            serviceIntent.setAction("UPDATE_STATE");
            
            if (state.hasKey("rowNumber")) {
                serviceIntent.putExtra("rowNumber", state.getInt("rowNumber"));
            }
            if (state.hasKey("progress")) {
                serviceIntent.putExtra("progress", (float) state.getDouble("progress"));
            }
            if (state.hasKey("gps")) {
                serviceIntent.putExtra("gps", state.getString("gps"));
            }
            if (state.hasKey("hasError")) {
                serviceIntent.putExtra("hasError", state.getBoolean("hasError"));
            }
            
            getReactApplicationContext().startService(serviceIntent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
    
    /**
     * Check if service is running
     */
    @ReactMethod
    public void isOverlayRunning(Promise promise) {
        // This is a simplified check
        // In production, you'd use ActivityManager to check service state
        promise.resolve(true);
    }
}
