/**
 * Expo Config Plugin for Overlay Service
 * 
 * Ye plugin:
 * 1. AndroidManifest.xml me overlay service aur permissions add karta hai
 * 2. MainApplication.java me OverlayPackage register karta hai
 * 3. Native Java files copy karta hai
 * 
 * Run: npx expo prebuild --clean
 */

const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Native Java files content
const OVERLAY_PACKAGE_JAVA = `package com.ocrexcel.app.overlay;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class OverlayPackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new OverlayModule(reactContext));
        return modules;
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
`;

const OVERLAY_MODULE_JAVA = `package com.ocrexcel.app.overlay;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.app.ActivityManager;
import android.content.Context;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = OverlayModule.NAME)
public class OverlayModule extends ReactContextBaseJavaModule {
    
    public static final String NAME = "OverlayModule";
    private static boolean isServiceRunning = false;
    
    public OverlayModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }
    
    @Override
    public String getName() {
        return NAME;
    }
    
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
                    promise.resolve(false);
                } else {
                    promise.resolve(true);
                }
            } else {
                promise.resolve(true);
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
    
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
            
            isServiceRunning = true;
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
    
    @ReactMethod
    public void stopOverlay(Promise promise) {
        try {
            Intent serviceIntent = new Intent(getReactApplicationContext(), OverlayService.class);
            serviceIntent.setAction("STOP_OVERLAY");
            getReactApplicationContext().startService(serviceIntent);
            isServiceRunning = false;
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
    
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
    
    @ReactMethod
    public void isOverlayRunning(Promise promise) {
        promise.resolve(isServiceRunning);
    }
}
`;

const OVERLAY_SERVICE_JAVA = `package com.ocrexcel.app.overlay;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.ClipboardManager;
import android.content.ClipData;
import android.content.Context;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.IBinder;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class OverlayService extends Service {
    
    private static final String CHANNEL_ID = "OCR_OVERLAY_CHANNEL";
    private static final int NOTIFICATION_ID = 1001;
    
    private WindowManager windowManager;
    private NativeBubbleView bubbleView;
    private WindowManager.LayoutParams params;
    private boolean isOverlayVisible = false;
    
    private int currentRowNumber = 1;
    private float progressValue = 0f;
    private String lastGPS = "";
    private boolean hasError = false;
    
    // Clipboard monitoring
    private ClipboardManager clipboardManager;
    private ClipboardManager.OnPrimaryClipChangedListener clipboardListener;
    
    @Override
    public void onCreate() {
        super.onCreate();
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        createNotificationChannel();
        setupClipboardListener();
    }
    
    private void setupClipboardListener() {
        clipboardManager = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
        clipboardListener = new ClipboardManager.OnPrimaryClipChangedListener() {
            @Override
            public void onPrimaryClipChanged() {
                ClipData clip = clipboardManager.getPrimaryClip();
                if (clip != null && clip.getItemCount() > 0) {
                    CharSequence text = clip.getItemAt(0).getText();
                    if (text != null) {
                        String clipText = text.toString();
                        // Check if it looks like a WhatsApp message
                        if (clipText.contains("Applicant") || clipText.contains("applicant") ||
                            clipText.contains("Bank") || clipText.contains("Name")) {
                            onMessageCopied(clipText);
                        }
                    }
                }
            }
        };
        clipboardManager.addPrimaryClipChangedListener(clipboardListener);
    }
    
    private void onMessageCopied(String message) {
        // Update bubble to show half progress
        progressValue = 0.5f;
        if (bubbleView != null) {
            bubbleView.setProgress(progressValue);
            bubbleView.showCopiedFeedback();
        }
        
        // Send broadcast to React Native
        Intent intent = new Intent("com.ocrexcel.CLIPBOARD_CHANGE");
        intent.putExtra("text", message);
        sendBroadcast(intent);
        
        Toast.makeText(this, "Message captured - Row " + currentRowNumber, Toast.LENGTH_SHORT).show();
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String action = intent.getAction();
            
            if ("START_OVERLAY".equals(action)) {
                startForeground(NOTIFICATION_ID, createNotification());
                showOverlay();
            } else if ("STOP_OVERLAY".equals(action)) {
                hideOverlay();
                stopForeground(true);
                stopSelf();
            } else if ("UPDATE_STATE".equals(action)) {
                currentRowNumber = intent.getIntExtra("rowNumber", 1);
                progressValue = intent.getFloatExtra("progress", 0f);
                lastGPS = intent.getStringExtra("gps");
                hasError = intent.getBooleanExtra("hasError", false);
                updateOverlayState();
            }
        }
        
        return START_STICKY;
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "OCR Bubble Overlay",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Shows floating bubble for data capture");
            channel.setShowBadge(false);
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }
    
    private Notification createNotification() {
        Intent notificationIntent = getPackageManager()
            .getLaunchIntentForPackage(getPackageName());
        
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("OCR Bubble Active")
            .setContentText("Row: " + currentRowNumber + " | Tap to open app")
            .setSmallIcon(android.R.drawable.ic_menu_camera)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build();
    }
    
    private void showOverlay() {
        if (isOverlayVisible) return;
        
        int layoutType;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            layoutType = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
        } else {
            layoutType = WindowManager.LayoutParams.TYPE_PHONE;
        }
        
        params = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            layoutType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE |
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN |
            WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        );
        
        params.gravity = Gravity.TOP | Gravity.START;
        params.x = getResources().getDisplayMetrics().widthPixels - 100;
        params.y = getResources().getDisplayMetrics().heightPixels / 3;
        
        bubbleView = new NativeBubbleView(this);
        bubbleView.setRowNumber(currentRowNumber);
        bubbleView.setProgress(progressValue);
        
        bubbleView.setOnScanClickListener(new NativeBubbleView.OnScanClickListener() {
            @Override
            public void onScanClick() {
                // Send broadcast to trigger screen capture
                Intent intent = new Intent("com.ocrexcel.SCAN_REQUESTED");
                sendBroadcast(intent);
                Toast.makeText(OverlayService.this, "Scanning...", Toast.LENGTH_SHORT).show();
            }
        });
        
        setupTouchListener(bubbleView);
        
        windowManager.addView(bubbleView, params);
        isOverlayVisible = true;
        
        Toast.makeText(this, "Bubble started - Ready to capture", Toast.LENGTH_SHORT).show();
    }
    
    private void setupTouchListener(View view) {
        view.setOnTouchListener(new View.OnTouchListener() {
            private int initialX, initialY;
            private float initialTouchX, initialTouchY;
            private long touchStartTime;
            private boolean isDragging = false;
            
            @Override
            public boolean onTouch(View v, MotionEvent event) {
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        initialX = params.x;
                        initialY = params.y;
                        initialTouchX = event.getRawX();
                        initialTouchY = event.getRawY();
                        touchStartTime = System.currentTimeMillis();
                        isDragging = false;
                        return true;
                        
                    case MotionEvent.ACTION_MOVE:
                        float dx = event.getRawX() - initialTouchX;
                        float dy = event.getRawY() - initialTouchY;
                        
                        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                            isDragging = true;
                        }
                        
                        params.x = initialX + (int) dx;
                        params.y = initialY + (int) dy;
                        
                        int screenWidth = getResources().getDisplayMetrics().widthPixels;
                        int screenHeight = getResources().getDisplayMetrics().heightPixels;
                        
                        params.x = Math.max(0, Math.min(params.x, screenWidth - 100));
                        params.y = Math.max(50, Math.min(params.y, screenHeight - 200));
                        
                        windowManager.updateViewLayout(view, params);
                        return true;
                        
                    case MotionEvent.ACTION_UP:
                        long duration = System.currentTimeMillis() - touchStartTime;
                        
                        if (!isDragging && duration < 300) {
                            openApp();
                        } else if (!isDragging && duration > 1000) {
                            // Long press - close bubble
                            Toast.makeText(OverlayService.this, "Long press - stopping bubble", Toast.LENGTH_SHORT).show();
                            hideOverlay();
                            stopForeground(true);
                            stopSelf();
                        } else {
                            snapToEdge(view);
                        }
                        return true;
                }
                return false;
            }
        });
    }
    
    private void snapToEdge(View view) {
        int screenWidth = getResources().getDisplayMetrics().widthPixels;
        int targetX = params.x > screenWidth / 2 ? screenWidth - 100 : 10;
        
        params.x = targetX;
        windowManager.updateViewLayout(view, params);
    }
    
    private void openApp() {
        Intent intent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        if (intent != null) {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(intent);
        }
    }
    
    private void hideOverlay() {
        if (bubbleView != null && isOverlayVisible) {
            windowManager.removeView(bubbleView);
            bubbleView = null;
            isOverlayVisible = false;
        }
    }
    
    private void updateOverlayState() {
        if (bubbleView != null) {
            bubbleView.setRowNumber(currentRowNumber);
            bubbleView.setProgress(progressValue);
            bubbleView.setGPSText(lastGPS);
            bubbleView.setHasError(hasError);
        }
        
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.notify(NOTIFICATION_ID, createNotification());
        }
    }
    
    @Override
    public void onDestroy() {
        if (clipboardManager != null && clipboardListener != null) {
            clipboardManager.removePrimaryClipChangedListener(clipboardListener);
        }
        hideOverlay();
        super.onDestroy();
    }
    
    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
`;

const NATIVE_BUBBLE_VIEW_JAVA = `package com.ocrexcel.app.overlay;

import android.animation.ValueAnimator;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.view.View;
import android.view.animation.AccelerateDecelerateInterpolator;

public class NativeBubbleView extends View {
    
    private static final int BUBBLE_SIZE_DP = 56;
    private static final int RING_STROKE_DP = 4;
    private static final int RING_PADDING_DP = 3;
    private static final int SCAN_BUTTON_SIZE_DP = 24;
    
    private int bubbleSize;
    private int ringStroke;
    private int ringPadding;
    private int ringSize;
    private int scanButtonSize;
    
    private Paint bubblePaint;
    private Paint ringBackgroundPaint;
    private Paint ringProgressPaint;
    private Paint textPaint;
    private Paint scanButtonPaint;
    private Paint scanIconPaint;
    private Paint shadowPaint;
    private Paint gpsPaint;
    private Paint gpsTextPaint;
    
    private RectF ringRect;
    
    private int rowNumber = 1;
    private float progress = 0f;
    private String gpsText = "";
    private boolean hasError = false;
    private boolean showCopiedAnimation = false;
    
    private OnScanClickListener scanClickListener;
    
    public interface OnScanClickListener {
        void onScanClick();
    }
    
    public NativeBubbleView(Context context) {
        super(context);
        init();
    }
    
    private void init() {
        float density = getResources().getDisplayMetrics().density;
        bubbleSize = (int) (BUBBLE_SIZE_DP * density);
        ringStroke = (int) (RING_STROKE_DP * density);
        ringPadding = (int) (RING_PADDING_DP * density);
        ringSize = bubbleSize + (ringPadding * 2) + (ringStroke * 2);
        scanButtonSize = (int) (SCAN_BUTTON_SIZE_DP * density);
        
        // Bubble paint (main circle)
        bubblePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        bubblePaint.setColor(Color.parseColor("#1976D2"));
        bubblePaint.setStyle(Paint.Style.FILL);
        
        // Shadow
        shadowPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        shadowPaint.setColor(Color.parseColor("#40000000"));
        shadowPaint.setStyle(Paint.Style.FILL);
        
        // Ring background
        ringBackgroundPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        ringBackgroundPaint.setColor(Color.parseColor("#E0E0E0"));
        ringBackgroundPaint.setStyle(Paint.Style.STROKE);
        ringBackgroundPaint.setStrokeWidth(ringStroke);
        ringBackgroundPaint.setStrokeCap(Paint.Cap.ROUND);
        
        // Ring progress
        ringProgressPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        ringProgressPaint.setColor(Color.parseColor("#4CAF50"));
        ringProgressPaint.setStyle(Paint.Style.STROKE);
        ringProgressPaint.setStrokeWidth(ringStroke);
        ringProgressPaint.setStrokeCap(Paint.Cap.ROUND);
        
        // Row number text
        textPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        textPaint.setColor(Color.WHITE);
        textPaint.setTextSize(bubbleSize * 0.4f);
        textPaint.setTextAlign(Paint.Align.CENTER);
        textPaint.setTypeface(Typeface.DEFAULT_BOLD);
        
        // Scan button
        scanButtonPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        scanButtonPaint.setColor(Color.parseColor("#FF9800"));
        scanButtonPaint.setStyle(Paint.Style.FILL);
        
        // Scan icon
        scanIconPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        scanIconPaint.setColor(Color.WHITE);
        scanIconPaint.setTextSize(scanButtonSize * 0.6f);
        scanIconPaint.setTextAlign(Paint.Align.CENTER);
        scanIconPaint.setTypeface(Typeface.DEFAULT_BOLD);
        
        // GPS box
        gpsPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        gpsPaint.setColor(Color.parseColor("#E8F5E9"));
        gpsPaint.setStyle(Paint.Style.FILL);
        
        gpsTextPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        gpsTextPaint.setColor(Color.parseColor("#2E7D32"));
        gpsTextPaint.setTextSize(scanButtonSize * 0.5f);
        gpsTextPaint.setTextAlign(Paint.Align.CENTER);
        
        ringRect = new RectF();
    }
    
    @Override
    protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
        int totalWidth = ringSize + scanButtonSize + 10;
        int totalHeight = ringSize + 40;
        setMeasuredDimension(totalWidth, totalHeight);
    }
    
    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        
        float centerX = ringSize / 2f;
        float centerY = ringSize / 2f;
        float ringRadius = (bubbleSize / 2f) + ringPadding + (ringStroke / 2f);
        
        // Shadow
        canvas.drawCircle(centerX + 2, centerY + 4, bubbleSize / 2f, shadowPaint);
        
        // Ring background
        ringRect.set(
            centerX - ringRadius,
            centerY - ringRadius,
            centerX + ringRadius,
            centerY + ringRadius
        );
        canvas.drawArc(ringRect, 0, 360, false, ringBackgroundPaint);
        
        // Ring progress
        if (progress > 0) {
            float sweepAngle = 360 * progress;
            if (progress == 0.5f) {
                ringProgressPaint.setColor(Color.parseColor("#FF9800")); // Orange for half
            } else if (progress >= 1.0f) {
                ringProgressPaint.setColor(Color.parseColor("#4CAF50")); // Green for full
            }
            canvas.drawArc(ringRect, -90, sweepAngle, false, ringProgressPaint);
        }
        
        // Main bubble
        if (showCopiedAnimation) {
            bubblePaint.setColor(Color.parseColor("#4CAF50"));
        } else {
            bubblePaint.setColor(Color.parseColor("#1976D2"));
        }
        canvas.drawCircle(centerX, centerY, bubbleSize / 2f, bubblePaint);
        
        // Row number
        float textY = centerY - ((textPaint.descent() + textPaint.ascent()) / 2);
        canvas.drawText(String.valueOf(rowNumber), centerX, textY, textPaint);
        
        // Scan button (right side)
        float scanX = ringSize + 5;
        float scanY = centerY;
        canvas.drawCircle(scanX + scanButtonSize / 2f, scanY, scanButtonSize / 2f, scanButtonPaint);
        float scanTextY = scanY - ((scanIconPaint.descent() + scanIconPaint.ascent()) / 2);
        canvas.drawText("S", scanX + scanButtonSize / 2f, scanTextY, scanIconPaint);
        
        // GPS box (below bubble if GPS exists)
        if (gpsText != null && !gpsText.isEmpty()) {
            float gpsY = ringSize + 5;
            float gpsWidth = ringSize;
            float gpsHeight = 30;
            
            RectF gpsRect = new RectF(0, gpsY, gpsWidth, gpsY + gpsHeight);
            canvas.drawRoundRect(gpsRect, 8, 8, gpsPaint);
            
            float gpsTextY = gpsY + gpsHeight / 2 - ((gpsTextPaint.descent() + gpsTextPaint.ascent()) / 2);
            canvas.drawText(gpsText.length() > 15 ? gpsText.substring(0, 15) + ".." : gpsText, 
                gpsWidth / 2, gpsTextY, gpsTextPaint);
        }
        
        // Error indicator
        if (hasError) {
            Paint errorPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            errorPaint.setColor(Color.parseColor("#F44336"));
            errorPaint.setStyle(Paint.Style.STROKE);
            errorPaint.setStrokeWidth(3);
            canvas.drawCircle(centerX, centerY, bubbleSize / 2f + 5, errorPaint);
        }
    }
    
    @Override
    public boolean performClick() {
        super.performClick();
        return true;
    }
    
    public void setOnScanClickListener(OnScanClickListener listener) {
        this.scanClickListener = listener;
    }
    
    public void setRowNumber(int number) {
        this.rowNumber = number;
        invalidate();
    }
    
    public void setProgress(float progress) {
        this.progress = progress;
        invalidate();
    }
    
    public void setGPSText(String gps) {
        this.gpsText = gps != null ? gps : "";
        invalidate();
    }
    
    public void setHasError(boolean error) {
        this.hasError = error;
        invalidate();
    }
    
    public void showCopiedFeedback() {
        showCopiedAnimation = true;
        invalidate();
        
        postDelayed(new Runnable() {
            @Override
            public void run() {
                showCopiedAnimation = false;
                invalidate();
            }
        }, 500);
    }
    
    public boolean handleScanClick(float x, float y) {
        float scanX = ringSize + 5;
        float scanY = ringSize / 2f;
        float distance = (float) Math.sqrt(Math.pow(x - (scanX + scanButtonSize / 2f), 2) + 
                                           Math.pow(y - scanY, 2));
        
        if (distance <= scanButtonSize / 2f) {
            if (scanClickListener != null) {
                scanClickListener.onScanClick();
            }
            return true;
        }
        return false;
    }
}
`;

function addOverlayServiceToManifest(androidManifest) {
  const { manifest } = androidManifest;

  // Add uses-permission
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

function withOverlayNativeFiles(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const androidPath = path.join(
        projectRoot, 
        'android', 
        'app', 
        'src', 
        'main', 
        'java', 
        'com', 
        'ocrexcel', 
        'app', 
        'overlay'
      );
      
      // Create directory
      fs.mkdirSync(androidPath, { recursive: true });
      
      // Write all Java files
      fs.writeFileSync(path.join(androidPath, 'OverlayPackage.java'), OVERLAY_PACKAGE_JAVA);
      fs.writeFileSync(path.join(androidPath, 'OverlayModule.java'), OVERLAY_MODULE_JAVA);
      fs.writeFileSync(path.join(androidPath, 'OverlayService.java'), OVERLAY_SERVICE_JAVA);
      fs.writeFileSync(path.join(androidPath, 'NativeBubbleView.java'), NATIVE_BUBBLE_VIEW_JAVA);
      
      // Modify MainApplication to add OverlayPackage
      const mainAppPath = path.join(
        projectRoot, 
        'android', 
        'app', 
        'src', 
        'main', 
        'java', 
        'com', 
        'ocrexcel', 
        'app',
        'MainApplication.kt'
      );
      
      // Also try Java version
      const mainAppJavaPath = path.join(
        projectRoot, 
        'android', 
        'app', 
        'src', 
        'main', 
        'java', 
        'com', 
        'ocrexcel', 
        'app',
        'MainApplication.java'
      );
      
      // Modify Kotlin MainApplication
      if (fs.existsSync(mainAppPath)) {
        let content = fs.readFileSync(mainAppPath, 'utf8');
        
        // Add import
        if (!content.includes('import com.ocrexcel.app.overlay.OverlayPackage')) {
          content = content.replace(
            'import com.facebook.react.ReactApplication',
            'import com.facebook.react.ReactApplication\nimport com.ocrexcel.app.overlay.OverlayPackage'
          );
        }
        
        // Add to packages
        if (!content.includes('OverlayPackage()')) {
          content = content.replace(
            'override fun getPackages(): List<ReactPackage> {',
            'override fun getPackages(): List<ReactPackage> {\n          // Add Overlay Package\n          '
          );
          content = content.replace(
            'return PackageList(this).packages',
            'val packages = PackageList(this).packages.toMutableList()\n          packages.add(OverlayPackage())\n          return packages'
          );
        }
        
        fs.writeFileSync(mainAppPath, content);
      }
      
      // Modify Java MainApplication
      if (fs.existsSync(mainAppJavaPath)) {
        let content = fs.readFileSync(mainAppJavaPath, 'utf8');
        
        // Add import
        if (!content.includes('import com.ocrexcel.app.overlay.OverlayPackage')) {
          content = content.replace(
            'import com.facebook.react.ReactApplication;',
            'import com.facebook.react.ReactApplication;\nimport com.ocrexcel.app.overlay.OverlayPackage;'
          );
        }
        
        // Add to packages
        if (!content.includes('packages.add(new OverlayPackage())')) {
          content = content.replace(
            'List<ReactPackage> packages = new PackageList(this).getPackages();',
            'List<ReactPackage> packages = new PackageList(this).getPackages();\n        packages.add(new OverlayPackage()); // Overlay bubble'
          );
        }
        
        fs.writeFileSync(mainAppJavaPath, content);
      }
      
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
  
  // Step 2: Write native Java files and modify MainApplication
  config = withOverlayNativeFiles(config);
  
  return config;
};
