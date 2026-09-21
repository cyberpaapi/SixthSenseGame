package com.sensei.sixthsense;

import org.junit.Test;
import static org.junit.Assert.*;
import java.util.Collections;

public class AdBreakPolicyTest {
    @Test public void countsThreeNewLevelsAndSurvivesRestart() {
        AdBreakPolicy policy = new AdBreakPolicy(Collections.emptySet(), 0);
        assertFalse(policy.record("adventure", "seed:0"));
        assertFalse(policy.record("adventure", "seed:0"));
        assertFalse(policy.record("adventure", "seed:1"));
        policy = new AdBreakPolicy(policy.seen, policy.adventureCount);
        assertTrue(policy.record("adventure", "seed:2"));
        assertFalse(policy.record("adventure", "seed:2"));
        assertFalse(policy.record("adventure", "seed:3"));
        assertFalse(policy.record("adventure", "seed:4"));
        assertTrue(policy.record("adventure", "seed:5"));
    }
    @Test public void matchesDeduplicateAndDoNotAdvanceAdventure() {
        AdBreakPolicy policy = new AdBreakPolicy(Collections.emptySet(), 2);
        assertTrue(policy.record("multiplayer", "room:player"));
        assertFalse(policy.record("multiplayer", "room:player"));
        assertEquals(2, policy.adventureCount);
        assertTrue(policy.record("adventure", "seed:2"));
        assertFalse(policy.record("guess", "letter"));
        assertEquals(0, policy.adventureCount);
    }
}
