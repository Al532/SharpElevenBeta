package io.github.al532.sharpelevenapp;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

final class PendingIrealHtmlStore {
    static final class PendingHtml {
        final String html;
        final String baseUrl;

        PendingHtml(@NonNull String html, @NonNull String baseUrl) {
            this.html = html;
            this.baseUrl = baseUrl;
        }
    }

    private static final ConcurrentHashMap<String, PendingHtml> pendingHtmlByKey = new ConcurrentHashMap<>();

    private PendingIrealHtmlStore() {
    }

    @NonNull
    static String put(@NonNull String html, @NonNull String baseUrl) {
        String key = UUID.randomUUID().toString();
        pendingHtmlByKey.put(key, new PendingHtml(html, baseUrl));
        return key;
    }

    @Nullable
    static PendingHtml consume(@Nullable String key) {
        if (key == null || key.isBlank()) {
            return null;
        }
        return pendingHtmlByKey.remove(key);
    }
}
