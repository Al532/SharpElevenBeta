package io.github.al532.sharpelevenapp;

import android.annotation.SuppressLint;
import android.content.ContentResolver;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.provider.OpenableColumns;
import android.view.View;
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

    private ProgressBar progressBar;
    private TextView bannerTitleView;
    private WebView webView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_ireal_browser);

        progressBar = findViewById(R.id.ireal_browser_progress);
        bannerTitleView = findViewById(R.id.ireal_browser_banner_title);
        webView = findViewById(R.id.ireal_browser_webview);
        findViewById(R.id.ireal_browser_close_button).setOnClickListener(view -> finish());

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
        if ("irealb".equalsIgnoreCase(scheme)) {
            try {
                PendingIrealImportStore.persist(this, uri.toString());
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

    private boolean loadInitialContent(Intent intent) {
        String explicitTitle = intent.getStringExtra(EXTRA_TITLE);
        String resolvedTitle = explicitTitle == null || explicitTitle.isBlank()
            ? getString(R.string.ireal_browser_title)
            : explicitTitle;
        bannerTitleView.setText(resolvedTitle);

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

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }
}
