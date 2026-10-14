package com.sensei.sixthsense;

/** UTC Daily deadlines; independent of locale and DST. */
final class StreakReminderPolicy {
    static final long HOUR = 3_600_000L;
    static final long DAY = 24 * HOUR;
    static final int[] HOURS = {12, 6, 3};

    static boolean valid(long deadline, int count, long now) {
        long today = Math.floorDiv(now, DAY) * DAY;
        return count > 0 && (deadline == today + DAY || deadline == today + 2 * DAY);
    }

    static int dueStage(long deadline, long now) {
        if (now >= deadline) return -1;
        for (int i = HOURS.length - 1; i >= 0; i--) {
            if (now >= deadline - HOURS[i] * HOUR) return i;
        }
        return -1;
    }
}
