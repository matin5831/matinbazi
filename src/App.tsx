import React, { useState, useEffect } from 'react';
import { Campaign, PlayerLead, StoreSettings, APP_VERSION } from './types';
import {
  getStoredCampaigns,
  saveCampaigns,
  getStoredLeads,
  getStoredSettings,
  saveSettings,
  resetCampaignLeads,
  getAdminPassword
} from './utils/storage';
import { fetchLeadsFromServer, fetchSettingsFromServer, fetchCampaignsFromServer, saveSettingsToServer, saveCampaignsToServer } from './utils/api';
import { Navbar } from './components/Navbar';
import { CampaignsList } from './components/CampaignsList';
import { CampaignBuilder } from './components/CampaignBuilder';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { StoreSettingsView } from './components/StoreSettingsView';
import { CustomerGamePage } from './components/CustomerGamePage';
import { LandingPage } from './components/LandingPage';
import { RenderDeployModal } from './components/RenderDeployModal';
import { AdminAuthModal } from './components/AdminAuthModal';

/** ادغام کمپین‌های (محلی + سرور): برای هر آی‌دی، جدیدترین نسخه (بر اساس updatedAt) برنده می‌شود. */
function mergeCampaigns(local: Campaign[], server: Campaign[]): Campaign[] {
  const map = new Map<string, Campaign>();
  for (const c of local) map.set(c.id, c);
  for (const s of server) {
    const l = map.get(s.id);
    if (!l) {
      map.set(s.id, s);
    } else {
      map.set(s.id, (l.updatedAt ?? 0) >= (s.updatedAt ?? 0) ? l : s);
    }
  }
  return Array.from(map.values());
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'CAMPAIGNS' | 'ANALYTICS' | 'SETTINGS'>('CAMPAIGNS');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [leads, setLeads] = useState<PlayerLead[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    storeName: 'فروشگاه شیک‌پوشان',
    instagramUsername: 'shikpooshan_shop',
    websiteUrl: 'https://shikpooshan.ir',
    logoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    primaryColor: '#8b5cf6',
    phonePrefix: '09'
  });

  const [editingCampaign, setEditingCampaign] = useState<Campaign | null | 'NEW'>(null);
  const [customerCampaign, setCustomerCampaign] = useState<Campaign | null>(null);
  const [showLanding, setShowLanding] = useState(false); // plain site URL → game descriptions page
  const [routeResolved, setRouteResolved] = useState(false); // blank until the landing/customer/admin route is decided
  const [showNetlifyModal, setShowNetlifyModal] = useState(false);
  const [isAdminAuthed, setIsAdminAuthed] = useState(false);
  const [isAdminRequested, setIsAdminRequested] = useState(false); // ?admin=1 → admin panel (locked)

  // Load Initial Storage Data & Check URL Parameters
  useEffect(() => {
    const loadedCampaigns = getStoredCampaigns();
    const loadedLeads = getStoredLeads();
    const loadedSettings = getStoredSettings();

    // ?admin=1 (or ?panel=1) opens the ADMIN panel (password required).
    // Without it, the site is a pure customer page (no admin lock screen).
    const params = new URLSearchParams(window.location.search);
    const adminParam = params.get('admin') || params.get('panel');
    setIsAdminRequested(adminParam === '1' || adminParam === 'true');

    setCampaigns(loadedCampaigns);
    setLeads(loadedLeads);
    setStoreSettings(loadedSettings);

    // Pull authoritative leads from server (admin view — requires admin password header)
    fetchLeadsFromServer().then(serverLeads => {
      if (serverLeads) setLeads(serverLeads);
    });

    // Pull store settings from server (public) — so ALL browsers/devices see the same brand.
    // Fallback to local when server has none yet (first deploy bootstrap).
    fetchSettingsFromServer().then(serverSettings => {
      if (serverSettings) {
        setStoreSettings(serverSettings);
        saveSettings(serverSettings); // sync local copy
      } else if (loadedSettings.storeName) {
        // Server has no settings yet (fresh Redis) — push local settings up once (bootstrap)
        const pw = getAdminPassword();
        if (pw) saveSettingsToServer(loadedSettings, pw);
      }
    });

    // Pull campaigns from server (public) — same list for every browser/device.
    fetchCampaignsFromServer().then(serverCampaigns => {
      // جدیدترین نسخه هر کمپین (محلی یا سرور) با updatedAt مشخص می‌شود —
      // اینطوری حتی اگر سرور لحظه‌ای عقب باشد، بازی همان ویرایشِ تازه می‌ماند.
      const merged = mergeCampaigns(loadedCampaigns, serverCampaigns || []);
      const effective = merged.length > 0 ? merged : loadedCampaigns;
      if (merged.length > 0) {
        setCampaigns(merged);
        saveCampaigns(merged); // sync local copy
        // اگر سرور خالی بود، لیست محلی را یک‌بار بالا بفرست
        const pw = getAdminPassword();
        if (pw && (!serverCampaigns || serverCampaigns.length === 0)) {
          saveCampaignsToServer(merged, pw);
        }
      }

      // Direct campaign URL query check (e.g. ?campaign=cmp-wheel-01 or ?play=cmp-wheel-01)
      // Special value "random" picks a random ACTIVE campaign (floating button on store site)
      // With NO query param at all (and not admin), show the FIRST active campaign as the landing page.
      const campParam = params.get('campaign') || params.get('play') || params.get('c');

      if (campParam) {
        let targetCamp: Campaign | undefined;
        if (campParam.toLowerCase() === 'random') {
          const activeCamps = effective.filter(c => c.isActive);
          const pool = activeCamps.length > 0 ? activeCamps : effective;
          targetCamp = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : undefined;
        } else {
          targetCamp = effective.find(c => c.id === campParam);
        }
        if (targetCamp) {
          setCustomerCampaign(targetCamp);
        } else if (effective.length > 0) {
          setCustomerCampaign(effective[0]);
        }
      } else if (!(adminParam === '1' || adminParam === 'true')) {
        // Plain site URL → landing page with game descriptions (not a game directly)
        if (effective.length > 0) {
          setShowLanding(true);
        }
      }

      // Route decided — stop showing the blank loading screen
      setRouteResolved(true);
    }).catch(() => {
      // Server unreachable — still reveal the route based on local data
      if (!(adminParam === '1' || adminParam === 'true') && loadedCampaigns.length > 0) {
        setShowLanding(true);
      }
      setRouteResolved(true);
    });
  }, []);

  const handleSaveCampaign = (campaign: Campaign) => {
    let updated: Campaign[];
    const exists = campaigns.some(c => c.id === campaign.id);

    if (exists) {
      updated = campaigns.map(c => c.id === campaign.id ? campaign : c);
    } else {
      updated = [campaign, ...campaigns];
    }

    setCampaigns(updated);
    saveCampaigns(updated);
    // Sync to server so every browser/device sees the same campaigns
    const pw = getAdminPassword();
    if (pw) saveCampaignsToServer(updated, pw);
    setEditingCampaign(null);
  };

  const handleToggleActiveCampaign = (id: string) => {
    const updated = campaigns.map(c => c.id === id ? { ...c, isActive: !c.isActive, updatedAt: Date.now() } : c);
    setCampaigns(updated);
    saveCampaigns(updated);
    const pw = getAdminPassword();
    if (pw) saveCampaignsToServer(updated, pw);
  };

  const handleDeleteCampaign = (id: string) => {
    if (confirm('آیا از حذف این کمپین اطمینان دارید؟')) {
      const updated = campaigns.filter(c => c.id !== id);
      setCampaigns(updated);
      saveCampaigns(updated);
      const pw = getAdminPassword();
      if (pw) saveCampaignsToServer(updated, pw);
    }
  };

  const handleResetCampaign = (id: string) => {
    if (confirm('آیا از شروع مجدد این کمپین اطمینان دارید؟ با این کار تمام آمار، لیدها و شرکت‌کنندگان قبلی این کمپین پاک می‌شوند و همه کاربران دوباره می‌توانند در کمپین شرکت کنند.')) {
      resetCampaignLeads(id);
      setCampaigns(getStoredCampaigns());
      setLeads(getStoredLeads());
    }
  };

  const handleSaveSettings = (newSettings: StoreSettings) => {
    setStoreSettings(newSettings);
    saveSettings(newSettings);
    // Sync to server so every browser/device sees the same store brand
    const pw = getAdminPassword();
    if (pw) saveSettingsToServer(newSettings, pw);
  };

  const handleReloadAllData = () => {
    setCampaigns(getStoredCampaigns());
    setLeads(getStoredLeads());
    setStoreSettings(getStoredSettings());
  };

  // ── Route guards (all decided inside useEffect) ──

  // Blank loading screen while the route is being decided — prevents the admin
  // login flash on the public (landing/customer) URLs.
  if (!routeResolved) {
    return <div className="min-h-screen ambient-canvas" />;
  }

  // Customer view: shown when a campaign is selected AND admin was NOT requested.
  // ?play=ID / ?play=random → game directly; plain URL → landing page; ?admin=1 → admin panel.
  if (customerCampaign && !isAdminRequested) {
    return (
      <CustomerGamePage
        campaign={customerCampaign}
        onGoToAdmin={() => {
          // Hidden path back to the admin panel (customer page has no visible button)
          window.location.href = window.location.pathname + '?admin=1';
        }}
      />
    );
  }

  // Landing page: plain site URL — game descriptions + start button
  if (showLanding && !isAdminRequested) {
    return (
      <LandingPage
        campaigns={campaigns}
        onStart={(camp) => {
          setShowLanding(false);
          setCustomerCampaign(camp);
        }}
      />
    );
  }

  return (
    <div className="min-h-dvh ambient-canvas text-slate-100 font-['Vazirmatn',sans-serif] selection:bg-amber-500 selection:text-slate-950">
      
      {/* Admin Authentication Lock Screen */}
      {!isAdminAuthed && (
        <AdminAuthModal onSuccess={() => setIsAdminAuthed(true)} />
      )}

      {/* Header Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        storeSettings={storeSettings}
        onOpenNetlifyModal={() => setShowNetlifyModal(true)}
        onLockPanel={() => setIsAdminAuthed(false)}
      />

      {/* Main Container View */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {editingCampaign !== null ? (
          <CampaignBuilder
            initialCampaign={editingCampaign === 'NEW' ? null : editingCampaign}
            onSave={handleSaveCampaign}
            onCancel={() => setEditingCampaign(null)}
          />
        ) : (
          <>
            {activeTab === 'CAMPAIGNS' && (
              <CampaignsList
                campaigns={campaigns}
                onCreateNew={() => setEditingCampaign('NEW')}
                onEdit={(camp) => setEditingCampaign(camp)}
                onPlayDemo={(camp) => setCustomerCampaign(camp)}
                onToggleActive={handleToggleActiveCampaign}
                onDelete={handleDeleteCampaign}
                onResetCampaign={handleResetCampaign}
              />
            )}

            {activeTab === 'ANALYTICS' && (
              <AnalyticsDashboard
                leads={leads}
                campaigns={campaigns}
                onLeadsUpdated={(newLeads) => setLeads(newLeads)}
              />
            )}

            {activeTab === 'SETTINGS' && (
              <StoreSettingsView
                settings={storeSettings}
                onSaveSettings={handleSaveSettings}
                onReloadAllData={handleReloadAllData}
              />
            )}
          </>
        )}
      </main>

      {/* Render Deploy Guide Modal */}
      {showNetlifyModal && (
        <RenderDeployModal onClose={() => setShowNetlifyModal(false)} />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900/80 py-6 text-xs text-slate-500 dir-rtl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>پلتفرم بازاریابی و گیمیفیکیشن متین بازی (Matin Bazi) مخصوص فروشگاه‌های آنلاین</span>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-amber-400 font-bold text-[11px] dir-ltr">
              نسخه {APP_VERSION}
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}

