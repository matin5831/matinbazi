import { PlayerLead, GameType } from '../types';
import { getStoredLeads, saveLeads, addLead as addLeadLocal, toggleRedeemStatus as toggleLocal, resetAllLeads as resetAllLocal, resetCampaignLeads as resetCampaignLocal, getAdminPassword } from './storage';

/**
 * Server-side API layer for leads (Render Key Value / Redis backend).
 * Falls back to localStorage when the API is unreachable (local dev / offline).
 * The server performs the authoritative duplicate check — clearing browser
 * storage cannot bypass the "play once per campaign" rule when deployed.
 */

const API_BASE = '/api';
const API_TIMEOUT_MS = 8000;

async function fetchJson(path: string, options?: RequestInit): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...options,
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, data };
  } catch (e) {
    return { status: 0, ok: false, data: {}, error: e };
  } finally {
    clearTimeout(timer);
  }
}

/** Fetch all leads from server (admin dashboard) */
export async function fetchLeadsFromServer(): Promise<PlayerLead[] | null> {
  const adminPassword = getAdminPassword() || '';
  const res = await fetchJson('/leads', {
    headers: { 'Content-Type': 'application/json', ...(adminPassword ? { 'x-admin-password': adminPassword } : {}) },
  });
  if (res.ok && res.data?.leads) return res.data.leads as PlayerLead[];
  if (res.status === 403) return null; // unauthorized — don't fall back to stale local list for admin view
  return null;
}

/**
 * Add a lead server-side. Returns:
 *  - { success: true, lead } on success
 *  - { success: false, error: 'already_played' } when duplicate (server-authoritative)
 *  - { success: false, error: 'offline' } when API unreachable (falls back to local)
 */
export async function addLeadToServer(payload: {
  campaignId: string;
  campaignTitle: string;
  instagramHandle: string;
  phoneNumber: string;
  prizeWon: string;
  couponCode: string;
  gameType: GameType;
}): Promise<{ success: boolean; error?: string; lead?: PlayerLead; message?: string }> {
  const res = await fetchJson('/leads', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (res.ok) return { success: true, lead: res.data.lead };
  if (res.status === 409) return { success: false, error: 'already_played', message: res.data.message };
  // Server unreachable or error → local fallback (dev mode)
  const localLead = addLeadLocal(payload);
  return { success: true, lead: localLead, error: 'offline_fallback' };
}

/** Toggle redeem status server-side, fallback to local */
export async function toggleLeadOnServer(leadId: string): Promise<PlayerLead[] | null> {
  const res = await fetchJson('/leads/toggle', {
    method: 'POST',
    body: JSON.stringify({ id: leadId }),
  });
  if (res.ok && res.data?.leads) return res.data.leads as PlayerLead[];
  return toggleLocal(leadId);
}

/** Reset ALL leads server-side (admin only). Returns true on success. */
export async function resetAllOnServer(password: string): Promise<{ success: boolean; error?: string }> {
  const res = await fetchJson('/admin/reset-all', {
    method: 'POST',
    body: JSON.stringify({ password }),
    headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
  });
  if (res.ok) return { success: true };
  if (res.status === 403) return { success: false, error: res.data?.error || 'wrong_password' };
  // Offline → local reset fallback
  resetAllLocal();
  return { success: true, error: 'offline_fallback' };
}

/** Reset ONE campaign's leads server-side (admin only) — re-opens that campaign. */
export async function resetCampaignOnServer(campaignId: string, password: string): Promise<{ success: boolean; error?: string }> {
  const res = await fetchJson('/admin/reset-campaign', {
    method: 'POST',
    body: JSON.stringify({ campaignId, password }),
    headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
  });
  if (res.ok) return { success: true };
  if (res.status === 403) return { success: false, error: res.data?.error || 'wrong_password' };
  // Offline → local reset fallback
  resetCampaignLocal(campaignId);
  return { success: true, error: 'offline_fallback' };
}

/** Set admin password server-side (first time only) */
export async function setAdminPasswordOnServer(password: string): Promise<boolean> {
  const res = await fetchJson('/admin/set-password', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
  return res.ok;
}

/** Verify admin password against server (authoritative when reachable) */
export async function verifyAdminPasswordOnServer(password: string): Promise<{ ok: boolean; set: boolean } | null> {
  const res = await fetchJson('/admin/verify', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
  if (res.ok && typeof res.data?.success === 'boolean') {
    return { ok: res.data.success, set: !!res.data.set };
  }
  return null; // unreachable → caller falls back to local verification
}

/** Convenience: get leads for the customer duplicate check (server-first) */
export async function checkAndGetLeads(): Promise<PlayerLead[]> {
  const serverLeads = await fetchLeadsFromServer();
  if (serverLeads) return serverLeads;
  return getStoredLeads();
}

/**
 * Server-authoritative duplicate check BEFORE the user plays.
 * Rule: ONE play per campaign per user (any game). Returns:
 *  - { duplicate: true }  → already played (block)
 *  - { duplicate: false } → OK to play
 *  - { offline: true }    → server unreachable (fall back to local check)
 */
export async function checkDuplicateOnServer(payload: {
  campaignId: string;
  instagramHandle: string;
  phoneNumber: string;
}): Promise<{ duplicate: boolean; offline?: boolean }> {
  const res = await fetchJson('/leads/check', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (res.ok && typeof res.data?.duplicate === 'boolean') {
    return { duplicate: res.data.duplicate };
  }
  return { duplicate: false, offline: true };
}
