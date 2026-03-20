package com.ocrexcel.app.overlay;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.IBinder;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.FrameLayout;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactRootView;
import com.facebook.react.bridge.ReactContext;

/**
 * OverlayService - Foreground Service for System-Wide Floating Bubble
 * 
 * Ye service bubble ko har app ke upar dikhata hai using WindowManager
 * with TYPE_APPLICATION_OVERLAY permission.
 */
public class OverlayService extends Service {
    
    private static final String CHANNEL_ID = "OCR_OVERLAY_CHANNEL";
    private static final int NOTIFICATION_ID = 1001;
    
    private WindowManager windowManager;
    private View overlayView;
    private ReactRootView reactRootView;
    private boolean isOverlayVisible = false;
    
    // Bubble state - synced from React Native
    private int currentRowNumber = 1;
    private float progressValue = 0f;
    private String lastGPS = "";
    private boolean hasError = false;
    
    @Override
    public void onCreate() {
        super.onCreate();
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        createNotificationChannel();
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
                // Update bubble state from React Native
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
            .setContentText("Tap to open app • Row: " + currentRowNumber)
            .setSmallIcon(android.R.drawable.ic_menu_camera)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build();
    }
    
    private void showOverlay() {
        if (isOverlayVisible) return;
        
        // Create overlay layout params
        int layoutType;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            layoutType = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
        } else {
            layoutType = WindowManager.LayoutParams.TYPE_PHONE;
        }
        
        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
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
        params.y = getResources().getDisplayMetrics().heightPixels / 2;
        
        // Create React Native view for bubble
        try {
            ReactApplication application = (ReactApplication) getApplication();
            ReactInstanceManager reactInstanceManager = application
                .getReactNativeHost()
                .getReactInstanceManager();
            
            reactRootView = new ReactRootView(this);
            reactRootView.startReactApplication(
                reactInstanceManager,
                "OverlayBubble",
                null
            );
            
            // Wrap in a FrameLayout for touch handling
            FrameLayout container = new FrameLayout(this);
            container.addView(reactRootView);
            
            setupTouchListener(container, params);
            
            windowManager.addView(container, params);
            overlayView = container;
            isOverlayVisible = true;
            
        } catch (Exception e) {
            e.printStackTrace();
            // Fallback to native bubble if React view fails
            showNativeBubble(params);
        }
    }
    
    private void showNativeBubble(WindowManager.LayoutParams params) {
        // Native Android bubble as fallback
        NativeBubbleView bubbleView = new NativeBubbleView(this);
        bubbleView.setRowNumber(currentRowNumber);
        bubbleView.setProgress(progressValue);
        
        setupTouchListener(bubbleView, params);
        
        windowManager.addView(bubbleView, params);
        overlayView = bubbleView;
        isOverlayVisible = true;
    }
    
    private void setupTouchListener(View view, WindowManager.LayoutParams params) {
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
                        
                        // Keep within screen bounds
                        int screenWidth = getResources().getDisplayMetrics().widthPixels;
                        int screenHeight = getResources().getDisplayMetrics().heightPixels;
                        
                        params.x = Math.max(0, Math.min(params.x, screenWidth - 80));
                        params.y = Math.max(50, Math.min(params.y, screenHeight - 150));
                        
                        windowManager.updateViewLayout(view, params);
                        return true;
                        
                    case MotionEvent.ACTION_UP:
                        long duration = System.currentTimeMillis() - touchStartTime;
                        
                        if (!isDragging && duration < 300) {
                            // Single tap - open app
                            openApp();
                        } else if (!isDragging && duration > 800) {
                            // Long press - show options
                            showOptionsMenu();
                        } else {
                            // Snap to edge
                            snapToEdge(view, params);
                        }
                        return true;
                }
                return false;
            }
        });
    }
    
    private void snapToEdge(View view, WindowManager.LayoutParams params) {
        int screenWidth = getResources().getDisplayMetrics().widthPixels;
        int targetX = params.x > screenWidth / 2 ? screenWidth - 80 : 10;
        
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
    
    private void showOptionsMenu() {
        // Send broadcast to React Native to show options
        Intent intent = new Intent("com.ocrexcel.BUBBLE_LONG_PRESS");
        sendBroadcast(intent);
    }
    
    private void hideOverlay() {
        if (overlayView != null && isOverlayVisible) {
            windowManager.removeView(overlayView);
            overlayView = null;
            isOverlayVisible = false;
        }
        
        if (reactRootView != null) {
            reactRootView.unmountReactApplication();
            reactRootView = null;
        }
    }
    
    private void updateOverlayState() {
        if (overlayView instanceof NativeBubbleView) {
            NativeBubbleView bubbleView = (NativeBubbleView) overlayView;
            bubbleView.setRowNumber(currentRowNumber);
            bubbleView.setProgress(progressValue);
            bubbleView.setGPSText(lastGPS);
            bubbleView.setHasError(hasError);
        }
        
        // Update notification
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.notify(NOTIFICATION_ID, createNotification());
        }
    }
    
    @Override
    public void onDestroy() {
        hideOverlay();
        super.onDestroy();
    }
    
    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
