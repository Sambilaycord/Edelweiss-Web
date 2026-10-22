import { useCallback, useSyncExternalStore } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

/**
 * App-wide online presence.
 *
 * This module owns the single 'global_presence' realtime channel. It is created lazily on first
 * use and is never removed, so pages can watch presence freely without affecting each other or
 * the logged-in user's own tracked presence. Logged-out visitors join the channel to *watch*
 * presence but never track themselves.
 */

const PRESENCE_TOPIC = 'global_presence';

type PresencePayload = { user_id?: string; online_at?: string };

let channel: RealtimeChannel | null = null;
let joined = false;
/** The user that should be tracked (null = watch only). */
let desiredUserId: string | null = null;
/** The user currently tracked on the channel (null = not tracking). */
let trackedUserId: string | null = null;

let onlineIds: ReadonlySet<string> = new Set();
const listeners = new Set<(ids: ReadonlySet<string>) => void>();

const setsEqual = (a: ReadonlySet<string>, b: ReadonlySet<string>) => {
  if (a.size !== b.size) return false;
  for (const id of a) if (!b.has(id)) return false;
  return true;
};

const recompute = () => {
  if (!channel) return;
  const next = new Set<string>();
  for (const presences of Object.values(channel.presenceState<PresencePayload>())) {
    for (const p of presences) if (p.user_id) next.add(p.user_id);
  }
  if (setsEqual(next, onlineIds)) return;
  onlineIds = next;
  listeners.forEach((cb) => cb(onlineIds));
};

/** Bring the tracked state on the channel in line with `desiredUserId`. */
const syncTracking = () => {
  if (!channel || !joined) return;
  if (desiredUserId === trackedUserId) return;

  const target = desiredUserId;
  trackedUserId = target;
  const op = target
    ? channel.track({ user_id: target, online_at: new Date().toISOString() } satisfies PresencePayload)
    : channel.untrack();
  op.catch((err: unknown) => {
    console.error('Presence update failed:', err);
    // Allow the next sync to retry
    if (trackedUserId === target) trackedUserId = null;
  });
};

const ensureChannel = () => {
  if (channel) return channel;

  const ch = supabase.channel(PRESENCE_TOPIC);
  channel = ch;
  ch
    .on('presence', { event: 'sync' }, recompute)
    .on('presence', { event: 'join' }, () => queueMicrotask(recompute))
    .on('presence', { event: 'leave' }, () => queueMicrotask(recompute))
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        joined = true;
        // A (re)join starts with no tracked presence for this client, so track again.
        trackedUserId = null;
        syncTracking();
      } else {
        // CHANNEL_ERROR / TIMED_OUT are retried by supabase-js; CLOSED never happens because
        // nobody removes this channel.
        joined = false;
      }
    });
  return ch;
};

/**
 * Start (or update) presence. Pass the logged-in user's id to track them as online, or null for
 * logged-out visitors (watch only). Idempotent, so it is safe under StrictMode double effects.
 */
export const startPresence = (userId: string | null) => {
  desiredUserId = userId;
  ensureChannel();
  syncTracking();
};

/** Stop tracking the current user. The channel stays open so presence can still be watched. */
export const stopPresence = () => {
  desiredUserId = null;
  syncTracking();
};

/**
 * Subscribe to the set of online user ids. The callback is invoked immediately with the current
 * set and again whenever it changes. Returns an unsubscribe function.
 */
export const subscribeOnlineUsers = (cb: (ids: ReadonlySet<string>) => void): (() => void) => {
  ensureChannel();
  listeners.add(cb);
  cb(onlineIds);
  return () => {
    listeners.delete(cb);
  };
};

const subscribeStore = (onStoreChange: () => void) => {
  ensureChannel();
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
};

/** Whether `userId` is currently online. */
export const useIsOnline = (userId: string | null | undefined): boolean => {
  const getSnapshot = useCallback(() => (userId ? onlineIds.has(userId) : false), [userId]);
  return useSyncExternalStore(subscribeStore, getSnapshot, () => false);
};
