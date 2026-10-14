package com.sensei.sixthsense;

import org.junit.Test;
import static org.junit.Assert.*;

public class StreakReminderPolicyTest {
    private final long midnight = 20000 * StreakReminderPolicy.DAY;
    private final long hour = StreakReminderPolicy.HOUR;
    @Test public void onlyLiveDailyDeadlinesAreAccepted() {
        assertTrue(StreakReminderPolicy.valid(midnight + 24 * hour, 8, midnight));
        assertTrue(StreakReminderPolicy.valid(midnight + 48 * hour, 800, midnight));
        assertFalse(StreakReminderPolicy.valid(midnight, 8, midnight));
        assertFalse(StreakReminderPolicy.valid(midnight + 72 * hour, 8, midnight));
        assertFalse(StreakReminderPolicy.valid(midnight + 24 * hour, 0, midnight));
        assertFalse(StreakReminderPolicy.valid(midnight + 25 * hour, 8, midnight));
    }
    @Test public void delaySelectsOnlyTheLatestEmotionAndNeverAnExpiredStreak() {
        assertEquals(-1, StreakReminderPolicy.dueStage(midnight, midnight - 13 * hour));
        assertEquals(0, StreakReminderPolicy.dueStage(midnight, midnight - 12 * hour));
        assertEquals(1, StreakReminderPolicy.dueStage(midnight, midnight - 6 * hour));
        assertEquals(2, StreakReminderPolicy.dueStage(midnight, midnight - 3 * hour));
        assertEquals(2, StreakReminderPolicy.dueStage(midnight, midnight - 1));
        assertEquals(-1, StreakReminderPolicy.dueStage(midnight, midnight));
    }
}
