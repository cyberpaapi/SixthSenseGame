package com.sensei.sixthsense;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class StreakReminderReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (action != null && action.startsWith(StreakReminderScheduler.CHANNEL)) StreakReminderScheduler.deliver(context);
        else StreakReminderScheduler.schedule(context);
    }
}
