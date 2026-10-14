package com.sensei.sixthsense;

import android.Manifest;
import android.content.Intent;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(name = "StreakReminders", permissions = {
    @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS })
})
public class StreakRemindersPlugin extends Plugin {
    private JSObject state() {
        JSObject result = new JSObject();
        result.put("enabled", StreakReminderScheduler.prefs(getContext()).getBoolean("enabled", false));
        result.put("allowed", StreakReminderScheduler.allowed(getContext()));
        return result;
    }

    @PluginMethod public void sync(PluginCall call) {
        Long deadline = call.getLong("deadline", 0L);
        Integer count = call.getInt("count", 0);
        StreakReminderScheduler.sync(getContext(), deadline, count);
        call.resolve(state());
    }

    @PluginMethod public void setEnabled(PluginCall call) {
        boolean enabled = Boolean.TRUE.equals(call.getBoolean("enabled", false));
        StreakReminderScheduler.setEnabled(getContext(), enabled);
        if (enabled && Build.VERSION.SDK_INT >= 33 && getPermissionState("notifications") != PermissionState.GRANTED) {
            requestPermissionForAlias("notifications", call, "notificationPermissionResult");
        } else call.resolve(state());
    }

    @PermissionCallback private void notificationPermissionResult(PluginCall call) {
        StreakReminderScheduler.schedule(getContext());
        call.resolve(state());
    }

    @PluginMethod public void consumeLaunch(PluginCall call) {
        Intent intent = getActivity().getIntent();
        boolean open = intent != null && intent.getBooleanExtra(StreakReminderScheduler.OPEN_DAILY, false);
        if (open) intent.removeExtra(StreakReminderScheduler.OPEN_DAILY);
        JSObject result = new JSObject();
        result.put("openDaily", open);
        call.resolve(result);
    }

    @Override protected void handleOnNewIntent(Intent intent) {
        if (intent.getBooleanExtra(StreakReminderScheduler.OPEN_DAILY, false)) {
            getActivity().setIntent(intent);
            notifyListeners("openDaily", new JSObject(), true);
        }
    }
}
