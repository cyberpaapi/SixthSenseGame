package com.sensei.sixthsense;

import android.Manifest;
import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

final class StreakReminderScheduler {
    static final String CHANNEL = "daily_streak";
    static final String OPEN_DAILY = "sixthsense.open_daily";
    static final int NOTIFICATION = 6100;
    private static final String PREFS = "sixthsense_streak_reminders";

    static SharedPreferences prefs(Context c) { return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }

    static void channel(Context c) {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel channel = new NotificationChannel(CHANNEL, "Daily streak reminders", NotificationManager.IMPORTANCE_DEFAULT);
            channel.setDescription("Save your streak before the Daily puzzle resets, including overnight reminders.");
            c.getSystemService(NotificationManager.class).createNotificationChannel(channel);
        }
    }

    static boolean allowed(Context c) {
        if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(c, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return false;
        if (!NotificationManagerCompat.from(c).areNotificationsEnabled()) return false;
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel channel = c.getSystemService(NotificationManager.class).getNotificationChannel(CHANNEL);
            if (channel != null && channel.getImportance() == NotificationManager.IMPORTANCE_NONE) return false;
        }
        return true;
    }

    private static PendingIntent alarm(Context c, int stage) {
        return PendingIntent.getBroadcast(c, NOTIFICATION + stage,
            new Intent(c, StreakReminderReceiver.class).setAction(CHANNEL + stage),
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static synchronized void sync(Context c, long deadline, int count) {
        if (!StreakReminderPolicy.valid(deadline, count, System.currentTimeMillis())) { deadline = 0; count = 0; }
        SharedPreferences p = prefs(c);
        boolean changed = p.getLong("deadline", 0) != deadline || p.getInt("count", 0) != count;
        SharedPreferences.Editor edit = p.edit().putLong("deadline", deadline).putInt("count", count);
        if (changed) {
            edit.putInt("delivered", -1);
            NotificationManagerCompat.from(c).cancel(NOTIFICATION);
        }
        edit.apply();
        schedule(c);
    }

    static synchronized void setEnabled(Context c, boolean enabled) {
        prefs(c).edit().putBoolean("enabled", enabled).apply();
        schedule(c);
    }

    static synchronized void schedule(Context c) {
        channel(c);
        SharedPreferences p = prefs(c);
        AlarmManager manager = c.getSystemService(AlarmManager.class);
        for (int stage = 0; stage < 3; stage++) manager.cancel(alarm(c, stage));
        long now = System.currentTimeMillis(), deadline = p.getLong("deadline", 0);
        if (!p.getBoolean("enabled", false) || !allowed(c) || !StreakReminderPolicy.valid(deadline, p.getInt("count", 0), now)) {
            NotificationManagerCompat.from(c).cancel(NOTIFICATION);
            return;
        }
        for (int stage = 0; stage < 3; stage++) {
            long when = deadline - StreakReminderPolicy.HOURS[stage] * StreakReminderPolicy.HOUR;
            if (when > now && stage > p.getInt("delivered", -1)) {
                // Inexact delivery avoids restricted exact-alarm access. Doze/OEM settings can delay it.
                manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, when, alarm(c, stage));
            }
        }
    }

    static synchronized void deliver(Context c) {
        deliverAt(c, System.currentTimeMillis());
    }

    // Package-private clock seam for emulator tests; receivers always use the device clock.
    static synchronized void deliverAt(Context c, long now) {
        SharedPreferences p = prefs(c);
        long deadline = p.getLong("deadline", 0);
        int count = p.getInt("count", 0);
        if (!p.getBoolean("enabled", false) || !allowed(c) || !StreakReminderPolicy.valid(deadline, count, now)) {
            schedule(c);
            return;
        }
        int stage = StreakReminderPolicy.dueStage(deadline, now);
        if (stage < 0 || stage <= p.getInt("delivered", -1)) return;
        int[] images = {R.drawable.streak_fox_sad, R.drawable.streak_fox_sadder, R.drawable.streak_fox_crying};
        String[] titles = {"😟 Your fox misses you", "🥺 Don’t let your streak slip away", "😭 Save your streak!"};
        long hours = Math.max(1, (long) Math.ceil((deadline - now) / (double) StreakReminderPolicy.HOUR));
        String time = hours == 1 ? "Less than an hour left" : "About " + hours + " hours left";
        String[] requests = {"Your fox is waiting. Solve today’s Daily to keep it going!", "Your fox is getting worried. Come solve today’s Daily!", "Your fox is in tears. One Daily solve keeps it alive!"};
        String message = time + " to save your " + count + "-day streak. " + requests[stage];
        Intent open = new Intent(c, MainActivity.class).putExtra(OPEN_DAILY, true)
            .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent tap = PendingIntent.getActivity(c, NOTIFICATION, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        BitmapFactory.Options options = new BitmapFactory.Options();
        options.inSampleSize = 4;
        Bitmap fox = BitmapFactory.decodeResource(c.getResources(), images[stage], options);
        NotificationCompat.Builder builder = new NotificationCompat.Builder(c, CHANNEL)
            .setSmallIcon(R.drawable.ic_streak_fox).setLargeIcon(fox)
            .setContentTitle(titles[stage]).setContentText(message)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(message))
            .setContentIntent(tap).setAutoCancel(true).setTimeoutAfter(deadline - now)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setVisibility(NotificationCompat.VISIBILITY_PRIVATE).setColor(0xFF8D50E8);
        try {
            NotificationManagerCompat.from(c).notify(NOTIFICATION, builder.build());
            p.edit().putInt("delivered", stage).apply();
        } catch (SecurityException ignored) { /* Permission may be revoked between check and delivery. */ }
    }
}
