package io.github.al532.sharpelevenapp;

import android.annotation.SuppressLint;
import android.content.ContentResolver;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.OpenableColumns;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import android.widget.TextView;
import androidx.activity.OnBackPressedCallback;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

public class IrealBrowserActivity extends AppCompatActivity {

    public static final String EXTRA_TITLE = "browserTitle";
    public static final String EXTRA_URL = "browserUrl";
    public static final String EXTRA_PENDING_HTML_KEY = "pendingHtmlKey";

    private View bannerView;
    private ProgressBar progressBar;
    private TextView bannerTitleView;
    private WebView webView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_FULL_USER);
        super.onCreate(savedInstanceState);
        configureSystemWindowLayout();
        getWindow().setStatusBarColor(Color.parseColor("#F7F1E6"));
        getWindow().setNavigationBarColor(Color.parseColor("#F7F1E6"));
        applyLightSystemBars();
        setContentView(R.layout.activity_ireal_browser);

        progressBar = findViewById(R.id.ireal_browser_progress);
        bannerView = findViewById(R.id.ireal_browser_banner);
        bannerTitleView = findViewById(R.id.ireal_browser_banner_title);
        webView = findViewById(R.id.ireal_browser_webview);
        findViewById(R.id.ireal_browser_close_button).setOnClickListener(view -> finish());
        bannerTitleView.addOnLayoutChangeListener((view, left, top, right, bottom, oldLeft, oldTop, oldRight, oldBottom) -> updateBrowserBannerHeight());

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setSupportMultipleWindows(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                super.onProgressChanged(view, newProgress);
                progressBar.setProgress(newProgress);
                progressBar.setVisibility(newProgress >= 100 ? View.GONE : View.VISIBLE);
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return handleNavigation(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleNavigation(Uri.parse(url));
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                progressBar.setVisibility(View.VISIBLE);
            }
        });

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack();
                    return;
                }
                finish();
            }
        });

        if (!loadInitialContent(getIntent())) {
            finish();
        }
    }

    private boolean handleNavigation(@NonNull Uri uri) {
        String scheme = uri.getScheme();
        if (scheme == null) {
            return false;
        }
        if ("irealb".equalsIgnoreCase(scheme) || "irealbook".equalsIgnoreCase(scheme)) {
            try {
                String referrerUrl = webView == null || webView.getUrl() == null ? "" : webView.getUrl();
                PendingIrealImportStore.persist(this, uri.toString(), referrerUrl, resolveImportOrigin(referrerUrl));
            } catch (IOException error) {
                return false;
            }
            Intent intent = new Intent(
                Intent.ACTION_VIEW,
                Uri.parse(PendingIrealImportStore.PENDING_IREAL_LINK_MARKER),
                this,
                MainActivity.class
            );
            intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            startActivity(intent);
            finish();
            return true;
        }
        return false;
    }

    @NonNull
    private String resolveImportOrigin(String referrerUrl) {
        if (referrerUrl == null || referrerUrl.isBlank()) {
            return "unknown";
        }
        Uri referrer = Uri.parse(referrerUrl);
        String scheme = referrer.getScheme();
        String host = referrer.getHost();
        if (host != null) {
            String normalizedHost = host.toLowerCase();
            if ("irealpro.com".equals(normalizedHost) || normalizedHost.endsWith(".irealpro.com")) {
                return "ireal-forum";
            }
        }
        if ("content".equalsIgnoreCase(scheme) || "file".equalsIgnoreCase(scheme)) {
            return "ireal-backup";
        }
        if (referrerUrl.toLowerCase().contains("localhost/shared-import")) {
            return "ireal-backup";
        }
        return "ireal-backup";
    }

    private boolean loadInitialContent(Intent intent) {
        String explicitTitle = intent.getStringExtra(EXTRA_TITLE);
        String resolvedTitle = explicitTitle == null || explicitTitle.isBlank()
            ? getString(R.string.ireal_browser_title)
            : explicitTitle;
        bannerTitleView.setText(resolvedTitle);

        String pendingHtmlKey = intent.getStringExtra(EXTRA_PENDING_HTML_KEY);
        PendingIrealHtmlStore.PendingHtml pendingHtml = PendingIrealHtmlStore.consume(pendingHtmlKey);
        if (pendingHtml != null && !pendingHtml.html.isBlank()) {
            webView.loadDataWithBaseURL(
                pendingHtml.baseUrl,
                pendingHtml.html,
                "text/html",
                "utf-8",
                null
            );
            return true;
        }

        if (Intent.ACTION_SEND.equals(intent.getAction())) {
            Uri sharedUri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
            if (sharedUri != null) {
                bannerTitleView.setText(resolveSharedDocumentTitle(sharedUri, resolvedTitle));
                return loadSharedHtml(sharedUri);
            }

            CharSequence sharedText = intent.getCharSequenceExtra(Intent.EXTRA_TEXT);
            if (sharedText != null && !sharedText.toString().isBlank()) {
                webView.loadDataWithBaseURL(
                    "https://localhost/shared-import/",
                    sharedText.toString(),
                    "text/html",
                    "utf-8",
                    null
                );
                return true;
            }
        }

        if (Intent.ACTION_VIEW.equals(intent.getAction())) {
            Uri sharedUri = intent.getData();
            if (sharedUri != null) {
                bannerTitleView.setText(resolveSharedDocumentTitle(sharedUri, resolvedTitle));
                return loadSharedHtml(sharedUri);
            }
        }

        String initialUrl = intent.getStringExtra(EXTRA_URL);
        if (initialUrl == null || initialUrl.isBlank()) {
            return false;
        }
        webView.loadUrl(initialUrl);
        return true;
    }

    private boolean loadSharedHtml(@NonNull Uri sharedUri) {
        ContentResolver resolver = getContentResolver();
        try (InputStream stream = resolver.openInputStream(sharedUri)) {
            if (stream == null) {
                return false;
            }
            String html = readText(stream);
            webView.loadDataWithBaseURL(
                sharedUri.toString(),
                html,
                "text/html",
                "utf-8",
                null
            );
            return true;
        } catch (IOException error) {
            return false;
        }
    }

    @NonNull
    private String resolveSharedDocumentTitle(@NonNull Uri sharedUri, @NonNull String fallbackTitle) {
        try (android.database.Cursor cursor = getContentResolver().query(
            sharedUri,
            new String[] { OpenableColumns.DISPLAY_NAME },
            null,
            null,
            null
        )) {
            if (cursor != null && cursor.moveToFirst()) {
                int columnIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (columnIndex >= 0) {
                    String displayName = cursor.getString(columnIndex);
                    if (displayName != null && !displayName.isBlank()) {
                        return displayName;
                    }
                }
            }
        } catch (Exception ignored) {
        }
        return fallbackTitle;
    }

    private void updateBrowserBannerHeight() {
        if (bannerView == null || bannerTitleView == null) {
            return;
        }
        int extraLines = Math.max(0, bannerTitleView.getLineCount() - 1);
        int targetMinHeight = dpToPx(82 + (extraLines * 22));
        if (bannerView.getMinimumHeight() != targetMinHeight) {
            bannerView.setMinimumHeight(targetMinHeight);
        }
    }

    private int dpToPx(int dp) {
        return Math.round(dp * getResources().getDisplayMetrics().density);
    }

    @NonNull
    private String readText(@NonNull InputStream stream) throws IOException {
        StringBuilder builder = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
            char[] buffer = new char[4096];
            int count;
            while ((count = reader.read(buffer)) != -1) {
                builder.append(buffer, 0, count);
            }
        }
        return builder.toString();
    }

    private void applyLightSystemBars() {
        int flags = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
        }
        getWindow().getDecorView().setSystemUiVisibility(flags);
    }

    private void configureSystemWindowLayout() {
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            getWindow().setDecorFitsSystemWindows(true);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams params = getWindow().getAttributes();
            params.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_NEVER;
            getWindow().setAttributes(params);
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }
}
