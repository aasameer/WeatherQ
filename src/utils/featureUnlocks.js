/**
 * Persistent unlock flags for growth-loop features.
 * Currently controls Motion Card access — unlocked after the user
 * invites at least one friend via the share sheet.
 *
 * Uses AsyncStorage via our cache helper. Sticky: once unlocked,
 * a feature stays unlocked forever (no re-unlock required).
 */

import { saveToCache, loadFromCache } from './cache';

const CACHE_KEY = 'weatherq_unlocks';

const DEFAULT_STATE = {
  motionCard:       false,   // unlocks after first "Invite Friends" tap
  friendsInvited:   0,
};

export const loadUnlockState = async () => ({
  ...DEFAULT_STATE,
  ...(await loadFromCache(CACHE_KEY)),
});

/**
 * Called after the user successfully invokes the invite share sheet.
 * Sticky true — increments the invite counter.
 */
export const registerFriendInvite = async () => {
  const state = await loadUnlockState();
  state.friendsInvited += 1;
  state.motionCard = true;
  await saveToCache(CACHE_KEY, state);
  return state;
};

export const isMotionCardUnlocked = async () => {
  const state = await loadUnlockState();
  return !!state.motionCard;
};

/** Debug-only reset (used by dev tools) */
export const resetUnlocks = () => saveToCache(CACHE_KEY, DEFAULT_STATE);
