package io.github.al532.sharpelevenapp;

import android.os.Bundle;
import android.content.pm.ActivityInfo;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_FULL_USER);
        registerPlugin(IrealBrowserPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
