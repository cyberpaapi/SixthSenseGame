package com.sensei.sixthsense;

import java.util.HashSet;
import java.util.Set;

/** Counts completed transitions, never guesses, lost levels, or reconnect renders. */
final class AdBreakPolicy {
    final Set<String> seen;
    int adventureCount;
    AdBreakPolicy(Set<String> saved, int count) {
        seen = new HashSet<>(saved);
        adventureCount = Math.floorMod(count, 3);
    }
    boolean alreadyRecorded(String placement, String id) { return seen.contains(placement + ":" + id); }
    boolean record(String placement, String id) {
        if (!placement.equals("adventure") && !placement.equals("multiplayer")) return false;
        if (!seen.add(placement + ":" + id)) return false;
        if (placement.equals("multiplayer")) return true;
        adventureCount = (adventureCount + 1) % 3;
        return adventureCount == 0;
    }
}
