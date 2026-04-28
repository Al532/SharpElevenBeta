package io.github.al532.sharpelevenapp;

import android.content.Context;
import androidx.annotation.NonNull;
import java.io.BufferedReader;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import org.json.JSONException;
import org.json.JSONObject;

final class PendingIrealImportStore {

    static final String PENDING_IREAL_LINK_MARKER = "irealb://native-pending-import";

    private static final String FILE_NAME = "pending-ireal-import.txt";

    private PendingIrealImportStore() {
    }

    static final class PendingIrealImport {
        final String url;
        final String referrerUrl;
        final String importOrigin;

        PendingIrealImport(@NonNull String url, @NonNull String referrerUrl, @NonNull String importOrigin) {
            this.url = url;
            this.referrerUrl = referrerUrl;
            this.importOrigin = importOrigin;
        }
    }

    static void persist(@NonNull Context context, @NonNull String rawText, @NonNull String referrerUrl, @NonNull String importOrigin) throws IOException {
        JSONObject payload = new JSONObject();
        try {
            payload.put("url", rawText);
            payload.put("referrerUrl", referrerUrl);
            payload.put("importOrigin", importOrigin);
        } catch (JSONException error) {
            throw new IOException("Failed to encode pending iReal import.", error);
        }
        try (FileOutputStream stream = context.openFileOutput(FILE_NAME, Context.MODE_PRIVATE)) {
            stream.write(payload.toString().getBytes(StandardCharsets.UTF_8));
        }
    }

    @NonNull
    static PendingIrealImport consume(@NonNull Context context) throws IOException {
        String value;
        try (
            java.io.FileInputStream stream = context.openFileInput(FILE_NAME);
            BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))
        ) {
            StringBuilder builder = new StringBuilder();
            char[] buffer = new char[4096];
            int count;
            while ((count = reader.read(buffer)) != -1) {
                builder.append(buffer, 0, count);
            }
            value = builder.toString();
        } catch (FileNotFoundException missingFile) {
            return new PendingIrealImport("", "", "");
        }

        context.deleteFile(FILE_NAME);
        try {
            JSONObject payload = new JSONObject(value);
            return new PendingIrealImport(
                payload.optString("url", ""),
                payload.optString("referrerUrl", ""),
                payload.optString("importOrigin", "")
            );
        } catch (JSONException ignored) {
            return new PendingIrealImport(value, "", "");
        }
    }
}
