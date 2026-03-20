package com.ocrexcel.app.overlay;

import android.animation.ValueAnimator;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.util.AttributeSet;
import android.view.View;
import android.view.animation.AccelerateDecelerateInterpolator;

/**
 * NativeBubbleView - Native Android Floating Bubble with Progress Ring
 * 
 * Ye view Messenger bubble jaisa dikhta hai with:
 * - Circular bubble with row number
 * - Perfectly aligned progress ring
 * - Smooth animations
 */
public class NativeBubbleView extends View {
    
    // Dimensions (in dp, will be converted to px)
    private static final int BUBBLE_SIZE_DP = 56;
    private static final int RING_STROKE_DP = 3;
    private static final int SCAN_BUTTON_SIZE_DP = 28;
    private static final int GPS_BOX_HEIGHT_DP = 24;
    
    // Colors
    private static final int COLOR_PRIMARY = Color.parseColor("#1a73e8");
    private static final int COLOR_SECONDARY = Color.parseColor("#34A853");
    private static final int COLOR_WARNING = Color.parseColor("#FF9800");
    private static final int COLOR_ERROR = Color.parseColor("#EA4335");
    private static final int COLOR_BORDER = Color.parseColor("#E0E0E0");
    private static final int COLOR_SURFACE = Color.parseColor("#FFFFFF");
    
    // Paints
    private Paint bubblePaint;
    private Paint ringBackgroundPaint;
    private Paint ringProgressPaint;
    private Paint textPaint;
    private Paint labelPaint;
    private Paint scanButtonPaint;
    private Paint gpsPaint;
    private Paint gpsTextPaint;
    private Paint shadowPaint;
    
    // Dimensions in pixels
    private int bubbleSize;
    private int ringStroke;
    private int ringSize;
    private int scanButtonSize;
    
    // State
    private int rowNumber = 1;
    private float progress = 0f; // 0 to 1
    private String gpsText = "";
    private boolean hasError = false;
    private boolean isScanning = false;
    
    // Animation
    private ValueAnimator progressAnimator;
    private float animatedProgress = 0f;
    
    // RectF for drawing arcs
    private RectF ringRect;
    
    public NativeBubbleView(Context context) {
        super(context);
        init();
    }
    
    public NativeBubbleView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }
    
    private void init() {
        // Convert dp to px
        float density = getResources().getDisplayMetrics().density;
        bubbleSize = (int) (BUBBLE_SIZE_DP * density);
        ringStroke = (int) (RING_STROKE_DP * density);
        ringSize = bubbleSize + (ringStroke * 2);
        scanButtonSize = (int) (SCAN_BUTTON_SIZE_DP * density);
        
        // Initialize paints
        bubblePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        bubblePaint.setColor(COLOR_PRIMARY);
        bubblePaint.setStyle(Paint.Style.FILL);
        
        // Shadow for bubble
        shadowPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        shadowPaint.setColor(Color.argb(60, 0, 0, 0));
        shadowPaint.setStyle(Paint.Style.FILL);
        
        ringBackgroundPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        ringBackgroundPaint.setColor(COLOR_BORDER);
        ringBackgroundPaint.setStyle(Paint.Style.STROKE);
        ringBackgroundPaint.setStrokeWidth(ringStroke);
        
        ringProgressPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        ringProgressPaint.setColor(COLOR_WARNING);
        ringProgressPaint.setStyle(Paint.Style.STROKE);
        ringProgressPaint.setStrokeWidth(ringStroke);
        ringProgressPaint.setStrokeCap(Paint.Cap.ROUND);
        
        textPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        textPaint.setColor(Color.WHITE);
        textPaint.setTextSize(20 * density);
        textPaint.setTextAlign(Paint.Align.CENTER);
        textPaint.setTypeface(Typeface.DEFAULT_BOLD);
        
        labelPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        labelPaint.setColor(Color.argb(200, 255, 255, 255));
        labelPaint.setTextSize(10 * density);
        labelPaint.setTextAlign(Paint.Align.CENTER);
        
        scanButtonPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        scanButtonPaint.setColor(COLOR_SECONDARY);
        scanButtonPaint.setStyle(Paint.Style.FILL);
        
        gpsPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        gpsPaint.setColor(COLOR_SURFACE);
        gpsPaint.setStyle(Paint.Style.FILL);
        
        gpsTextPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        gpsTextPaint.setColor(Color.parseColor("#212121"));
        gpsTextPaint.setTextSize(11 * density);
        
        // Ring rect
        ringRect = new RectF();
        
        // Set layer type for shadows
        setLayerType(LAYER_TYPE_SOFTWARE, null);
    }
    
    @Override
    protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
        // Calculate total height including GPS box
        int totalWidth = ringSize + scanButtonSize;
        int totalHeight = ringSize + (gpsText.isEmpty() ? 0 : (int)(GPS_BOX_HEIGHT_DP * getResources().getDisplayMetrics().density + 10));
        
        setMeasuredDimension(totalWidth, totalHeight);
    }
    
    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        
        float centerX = ringSize / 2f;
        float centerY = ringSize / 2f;
        float radius = (ringSize - ringStroke) / 2f;
        
        // Draw shadow
        canvas.drawCircle(centerX + 2, centerY + 4, bubbleSize / 2f, shadowPaint);
        
        // Draw ring background
        ringRect.set(
            ringStroke / 2f,
            ringStroke / 2f,
            ringSize - ringStroke / 2f,
            ringSize - ringStroke / 2f
        );
        canvas.drawArc(ringRect, 0, 360, false, ringBackgroundPaint);
        
        // Draw progress arc
        if (animatedProgress > 0) {
            // Update ring color based on progress
            if (animatedProgress >= 1f) {
                ringProgressPaint.setColor(COLOR_SECONDARY);
            } else if (animatedProgress >= 0.5f) {
                ringProgressPaint.setColor(COLOR_WARNING);
            } else {
                ringProgressPaint.setColor(COLOR_WARNING);
            }
            
            float sweepAngle = 360 * animatedProgress;
            canvas.drawArc(ringRect, -90, sweepAngle, false, ringProgressPaint);
        }
        
        // Draw main bubble
        canvas.drawCircle(centerX, centerY, bubbleSize / 2f, bubblePaint);
        
        // Draw row number
        float textY = centerY - ((textPaint.descent() + textPaint.ascent()) / 2);
        canvas.drawText(String.valueOf(rowNumber), centerX, textY - 4, textPaint);
        
        // Draw "Row" label
        canvas.drawText("Row", centerX, textY + 14, labelPaint);
        
        // Draw scan button
        float scanX = ringSize - scanButtonSize / 4f;
        float scanY = ringSize - scanButtonSize / 4f;
        
        // Scan button background
        if (hasError) {
            scanButtonPaint.setColor(COLOR_ERROR);
        } else if (isScanning) {
            scanButtonPaint.setColor(COLOR_WARNING);
        } else {
            scanButtonPaint.setColor(COLOR_SECONDARY);
        }
        
        canvas.drawCircle(scanX, scanY, scanButtonSize / 2f, scanButtonPaint);
        
        // Scan button border
        Paint borderPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        borderPaint.setColor(Color.WHITE);
        borderPaint.setStyle(Paint.Style.STROKE);
        borderPaint.setStrokeWidth(2 * getResources().getDisplayMetrics().density);
        canvas.drawCircle(scanX, scanY, scanButtonSize / 2f, borderPaint);
        
        // Scan button text
        Paint scanTextPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        scanTextPaint.setColor(Color.WHITE);
        scanTextPaint.setTextSize(10 * getResources().getDisplayMetrics().density);
        scanTextPaint.setTextAlign(Paint.Align.CENTER);
        scanTextPaint.setTypeface(Typeface.DEFAULT_BOLD);
        
        String scanLabel = isScanning ? "..." : (hasError ? "!" : "Scan");
        float scanTextY = scanY - ((scanTextPaint.descent() + scanTextPaint.ascent()) / 2);
        canvas.drawText(scanLabel, scanX, scanTextY, scanTextPaint);
        
        // Draw GPS box if text exists
        if (!gpsText.isEmpty()) {
            float gpsY = ringSize + 8;
            float gpsWidth = Math.min(ringSize, 100 * getResources().getDisplayMetrics().density);
            float gpsHeight = GPS_BOX_HEIGHT_DP * getResources().getDisplayMetrics().density;
            
            RectF gpsRect = new RectF(
                centerX - gpsWidth / 2,
                gpsY,
                centerX + gpsWidth / 2,
                gpsY + gpsHeight
            );
            
            // GPS box background
            if (hasError) {
                gpsPaint.setColor(Color.parseColor("#FFEBEE"));
                gpsTextPaint.setColor(COLOR_ERROR);
            } else {
                gpsPaint.setColor(COLOR_SURFACE);
                gpsTextPaint.setColor(Color.parseColor("#212121"));
            }
            
            canvas.drawRoundRect(gpsRect, 8, 8, gpsPaint);
            
            // GPS box border
            Paint gpsBorderPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            gpsBorderPaint.setColor(COLOR_BORDER);
            gpsBorderPaint.setStyle(Paint.Style.STROKE);
            gpsBorderPaint.setStrokeWidth(1);
            canvas.drawRoundRect(gpsRect, 8, 8, gpsBorderPaint);
            
            // GPS text
            float gpsTextY = gpsRect.centerY() - ((gpsTextPaint.descent() + gpsTextPaint.ascent()) / 2);
            
            // Truncate text if too long
            String displayText = gpsText;
            if (gpsTextPaint.measureText(displayText) > gpsWidth - 16) {
                while (gpsTextPaint.measureText(displayText + "...") > gpsWidth - 16 && displayText.length() > 0) {
                    displayText = displayText.substring(0, displayText.length() - 1);
                }
                displayText += "...";
            }
            
            canvas.drawText(displayText, gpsRect.left + 8, gpsTextY, gpsTextPaint);
        }
    }
    
    // Setters with animation
    
    public void setRowNumber(int rowNumber) {
        this.rowNumber = rowNumber;
        invalidate();
    }
    
    public void setProgress(float progress) {
        if (progressAnimator != null && progressAnimator.isRunning()) {
            progressAnimator.cancel();
        }
        
        progressAnimator = ValueAnimator.ofFloat(animatedProgress, progress);
        progressAnimator.setDuration(300);
        progressAnimator.setInterpolator(new AccelerateDecelerateInterpolator());
        progressAnimator.addUpdateListener(animation -> {
            animatedProgress = (float) animation.getAnimatedValue();
            invalidate();
        });
        progressAnimator.start();
        
        this.progress = progress;
    }
    
    public void setGPSText(String gpsText) {
        this.gpsText = gpsText != null ? gpsText : "";
        requestLayout();
        invalidate();
    }
    
    public void setHasError(boolean hasError) {
        this.hasError = hasError;
        invalidate();
    }
    
    public void setScanning(boolean scanning) {
        this.isScanning = scanning;
        invalidate();
    }
}
