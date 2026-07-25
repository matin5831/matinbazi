import { Campaign, PlayerLead, StoreSettings } from '../types';
import { INITIAL_CAMPAIGNS, INITIAL_LEADS, INITIAL_STORE_SETTINGS } from '../data/mockData';

const CAMPAIGNS_KEY = 'boostagram_campaigns_v1';
const LEADS_KEY = 'boostagram_leads_v1';
const SETTINGS_KEY = 'boostagram_settings_v1';
const ADMIN_PASS_KEY = 'matinbazi_admin_pass_v1';

export function getAdminPassword(): string | null {
  try {
    return localStorage.getItem(ADMIN_PASS_KEY);
  } catch (e) {
    return null;
  }
}

export function setAdminPassword(password: string): void {
  try {
    localStorage.setItem(ADMIN_PASS_KEY, password);
  } catch (e) {
    console.error('Failed to save admin password', e);
  }
}

export function verifyAdminPassword(password: string): boolean {
  const saved = getAdminPassword();
  if (!saved) return false;
  return saved === password;
}

export function getStoredCampaigns(): Campaign[] {
  try {
    const data = localStorage.getItem(CAMPAIGNS_KEY);
    if (!data) {
      localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(INITIAL_CAMPAIGNS));
      return INITIAL_CAMPAIGNS;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse stored campaigns', e);
    return INITIAL_CAMPAIGNS;
  }
}

export function saveCampaigns(campaigns: Campaign[]): void {
  try {
    localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns));
  } catch (e) {
    console.error('Failed to save campaigns', e);
  }
}

export function getStoredLeads(): PlayerLead[] {
  try {
    const data = localStorage.getItem(LEADS_KEY);
    if (!data) {
      localStorage.setItem(LEADS_KEY, JSON.stringify(INITIAL_LEADS));
      return INITIAL_LEADS;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse stored leads', e);
    return INITIAL_LEADS;
  }
}

export function saveLeads(leads: PlayerLead[]): void {
  try {
    localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
  } catch (e) {
    console.error('Failed to save leads', e);
  }
}

export function addLead(lead: Omit<PlayerLead, 'id' | 'wonAt' | 'isRedeemed'>): PlayerLead {
  const leads = getStoredLeads();
  const now = new Date();
  const persianDate = new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(now);

  const newLead: PlayerLead = {
    ...lead,
    id: 'lead-' + Date.now(),
    wonAt: persianDate,
    isRedeemed: false
  };

  const updatedLeads = [newLead, ...leads];
  saveLeads(updatedLeads);

  // Update campaign play counter
  const campaigns = getStoredCampaigns();
  const campaignIdx = campaigns.findIndex(c => c.id === lead.campaignId);
  if (campaignIdx !== -1) {
    campaigns[campaignIdx].totalPlays += 1;
    if (lead.prizeWon && lead.couponCode) {
      campaigns[campaignIdx].totalWinners += 1;
    }
    saveCampaigns(campaigns);
  }

  return newLead;
}

export function toggleRedeemStatus(leadId: string): PlayerLead[] {
  const leads = getStoredLeads();
  const updated = leads.map(l => l.id === leadId ? { ...l, isRedeemed: !l.isRedeemed } : l);
  saveLeads(updated);
  return updated;
}

export function getStoredSettings(): StoreSettings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (!data) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(INITIAL_STORE_SETTINGS));
      return INITIAL_STORE_SETTINGS;
    }
    return JSON.parse(data);
  } catch (e) {
    return INITIAL_STORE_SETTINGS;
  }
}

export function saveSettings(settings: StoreSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

export function exportDataAsJSON(): string {
  const data = {
    settings: getStoredSettings(),
    campaigns: getStoredCampaigns(),
    leads: getStoredLeads(),
    exportedAt: new Date().toISOString()
  };
  return JSON.stringify(data, null, 2);
}

export function importDataFromJSON(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.campaigns) saveCampaigns(parsed.campaigns);
    if (parsed.leads) saveLeads(parsed.leads);
    if (parsed.settings) saveSettings(parsed.settings);
    return true;
  } catch (e) {
    console.error('Invalid JSON data', e);
    return false;
  }
}
