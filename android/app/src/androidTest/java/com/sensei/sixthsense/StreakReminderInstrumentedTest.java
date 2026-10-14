package com.sensei.sixthsense;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;
import android.service.notification.StatusBarNotification;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class StreakReminderInstrumentedTest {
    @Test public void rendersThreeMoodsDeduplicatesAndCancelsOnWinOrOptOut() {
        Context c = InstrumentationRegistry.getInstrumentation().getTargetContext();
        if (Build.VERSION.SDK_INT >= 33) InstrumentationRegistry.getInstrumentation().getUiAutomation()
            .grantRuntimePermission(c.getPackageName(), Manifest.permission.POST_NOTIFICATIONS);
        long day = StreakReminderPolicy.DAY, hour = StreakReminderPolicy.HOUR;
        long deadline = Math.floorDiv(System.currentTimeMillis(), day) * day + day;
        NotificationManager manager = c.getSystemService(NotificationManager.class);
        try {
            StreakReminderScheduler.prefs(c).edit().clear().commit();
            StreakReminderScheduler.sync(c, deadline, 38);
            StreakReminderScheduler.setEnabled(c, true);
            assertTrue(StreakReminderScheduler.allowed(c));
            String[] titles = {"Your fox misses you", "Don’t let your streak slip away", "Save your streak!"};
            for (int stage = 0; stage < 3; stage++) {
                long time = deadline - StreakReminderPolicy.HOURS[stage] * hour;
                StreakReminderScheduler.deliverAt(c, time);
                StatusBarNotification[] active = manager.getActiveNotifications();
                assertEquals(1, active.length);
                Notification n = active[0].getNotification();
                assertTrue(n.extras.getCharSequence(Notification.EXTRA_TITLE).toString().contains(titles[stage]));
                assertTrue(n.extras.getCharSequence(Notification.EXTRA_TEXT).toString().contains("38-day streak"));
                assertNotNull(n.getLargeIcon());
                assertNotNull(n.getSmallIcon());
                assertNotNull(n.contentIntent);
                assertEquals(stage, StreakReminderScheduler.prefs(c).getInt("delivered", -1));
                StreakReminderScheduler.deliverAt(c, time + 1);
                assertEquals(1, manager.getActiveNotifications().length);
            }
            // A successful Daily advances the deadline and clears today's visible reminder.
            StreakReminderScheduler.sync(c, deadline + day, 39);
            assertEquals(0, manager.getActiveNotifications().length);
            assertEquals(-1, StreakReminderScheduler.prefs(c).getInt("delivered", -2));
            StreakReminderScheduler.setEnabled(c, false);
            StreakReminderScheduler.deliverAt(c, deadline + day - 3 * hour);
            assertEquals(0, manager.getActiveNotifications().length);
            // A loss clears all future notifications, even with permission enabled.
            StreakReminderScheduler.setEnabled(c, true);
            StreakReminderScheduler.sync(c, 0, 0);
            StreakReminderScheduler.deliverAt(c, deadline - hour);
            assertEquals(0, manager.getActiveNotifications().length);
        } finally {
            StreakReminderScheduler.setEnabled(c, false);
            StreakReminderScheduler.prefs(c).edit().clear().commit();
        }
    }
}
