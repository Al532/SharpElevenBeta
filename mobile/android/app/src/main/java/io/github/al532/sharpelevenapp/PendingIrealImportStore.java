package io.github.al532.sharpelevenapp;

import android.content.Context;
import androidx.annotation.NonNull;
import java.io.BufferedReader;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

final class PendingIrealImportStore {

    static final String PENDING_IREAL_LINK_MARKER = "irealb://native-pending-import";

    private static final String FILE_NAME = "pending-ireal-import.txt";

    private PendingIrealImportStore() {
    }

    static void persist(@NonNull Context context, @NonNull String rawText) throws IOException {
        try (FileOutputStream stream = context.openFileOutput(FILE_NAME, Context.MODE_PRIVATE)) {
            stream.write(rawText.getBytes(StandardCharsets.UTF_8));
        }
    }

    @NonNull
    static String consume(@NonNull Context context) throws IOException {
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
            return "";
        }

        context.deleteFile(FILE_NAME);
        return value;
    }
}
