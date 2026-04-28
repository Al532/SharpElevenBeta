package io.github.al532.sharpelevenapp;

import android.content.Intent;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.JSObject;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.IOException;

@CapacitorPlugin(name = "IrealBrowser")
public class IrealBrowserPlugin extends Plugin {

    @PluginMethod
    public void open(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.trim().isEmpty()) {
            call.reject("A browser URL is required.");
            return;
        }

        Intent intent = new Intent(getActivity(), IrealBrowserActivity.class);
        intent.putExtra(IrealBrowserActivity.EXTRA_URL, url);
        intent.putExtra(IrealBrowserActivity.EXTRA_TITLE, call.getString("title", ""));
        getActivity().startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void openHtml(PluginCall call) {
        String html = call.getString("html");
        if (html == null || html.trim().isEmpty()) {
            call.reject("Browser HTML is required.");
            return;
        }

        String baseUrl = call.getString("baseUrl", "https://localhost/shared-import/");
        String pendingHtmlKey = PendingIrealHtmlStore.put(html, baseUrl);

        Intent intent = new Intent(getActivity(), IrealBrowserActivity.class);
        intent.putExtra(IrealBrowserActivity.EXTRA_PENDING_HTML_KEY, pendingHtmlKey);
        intent.putExtra(IrealBrowserActivity.EXTRA_TITLE, call.getString("title", ""));
        getActivity().startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void consumePendingIRealLink(PluginCall call) {
        try {
            PendingIrealImportStore.PendingIrealImport pendingImport = PendingIrealImportStore.consume(getContext());
            JSObject result = new JSObject();
            result.put("url", pendingImport.url);
            result.put("referrerUrl", pendingImport.referrerUrl);
            result.put("importOrigin", pendingImport.importOrigin);
            call.resolve(result);
        } catch (IOException error) {
            call.reject("Failed to load the pending iReal link.", error);
        }
    }
}
