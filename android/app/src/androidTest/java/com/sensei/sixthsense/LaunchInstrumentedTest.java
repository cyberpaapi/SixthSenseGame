package com.sensei.sixthsense;

import android.graphics.Bitmap;
import android.os.SystemClock;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.io.File;
import java.io.FileOutputStream;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class LaunchInstrumentedTest {
    private void awaitGame(ActivityScenario<MainActivity> scenario) throws Exception {
        long deadline = SystemClock.uptimeMillis() + 12000;
        String state = "";
        while (SystemClock.uptimeMillis() < deadline) {
            CountDownLatch reply = new CountDownLatch(1);
            AtomicReference<String> result = new AtomicReference<>("");
            scenario.onActivity(activity -> {
                assertNotNull(activity.getBridge());
                activity.getBridge().getWebView().evaluateJavascript(
                    "document.readyState === 'complete' && document.body.classList.contains('is-native-app') && !!document.querySelector('#age-band-modal [data-open-privacy]')",
                    value -> { result.set(value); reply.countDown(); });
            });
            assertTrue(reply.await(2, TimeUnit.SECONDS));
            state = result.get();
            if ("true".equals(state)) return;
            SystemClock.sleep(100);
        }
        fail("Native startup did not reach the bundled game: " + state);
    }

    @Test public void launchesAndRecreatesWithBundledPrivacy() throws Exception {
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            awaitGame(scenario);
            scenario.recreate();
            awaitGame(scenario);
            // Allow the platform splash exit to finish before retaining visual QA evidence.
            SystemClock.sleep(700);
            Bitmap capture = InstrumentationRegistry.getInstrumentation().getUiAutomation().takeScreenshot();
            assertNotNull(capture);
            File out = new File(InstrumentationRegistry.getInstrumentation().getTargetContext().getExternalCacheDir(), "launch-privacy-qa.png");
            try (FileOutputStream stream = new FileOutputStream(out)) { capture.compress(Bitmap.CompressFormat.PNG, 100, stream); }
            capture.recycle();
        }
    }
}
