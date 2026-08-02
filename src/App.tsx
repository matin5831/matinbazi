import React, { useState, useEffect } from 'react';
import { Campaign, PlayerLead, StoreSettings, APP_VERSION } from './types';
import {
  getStoredCampaigns,
  saveCampaigns,
  getStoredLeads,
  getStoredSettings,
  saveSettings,
  resetCampaignLeads
} from './utils/storage';
import { fetchLeadsFromServer } from './utils/api';
import { Navbar } from './components/Navbar';
import { CampaignsList } from './components/CampaignsList';
import { CampaignBuilder } from './components/CampaignBuilder';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { StoreSettingsView } from './components/StoreSettingsView';
import { CustomerGamePage } from './components/CustomerGamePage';
import { RenderDeployModal } from './components/RenderDeployModal';
import { AdminAuthModal } from './components/AdminAuthModal';

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
  const [showNetlifyModal, setShowNetlifyModal] = useState(false);
  const [isAdminAuthed, setIsAdminAuthed] = useState(false);

  // Load Initial Storage Data & Check URL Parameters
  useEffect(() => {
    const loadedCampaigns = getStoredCampaigns();
    const loadedLeads = getStoredLeads();
    const loadedSettings = getStoredSettings();

    setCampaigns(loadedCampaigns);
    setLeads(loadedLeads);
    setStoreSettings(loadedSettings);

    // Pull authoritative leads from server (admin view — requires admin password header)
    fetchLeadsFromServer().then(serverLeads => {
      if (serverLeads) setLeads(serverLeads);
    });

    // Direct campaign URL query check (e.g. ?campaign=cmp-wheel-01 or ?play=cmp-wheel-01)
    // Special value "random" picks a random ACTIVE campaign (floating button on store site)
    const params = new URLSearchParams(window.location.search);
    const campParam = params.get('campaign') || params.get('play') || params.get('c');
    
    if (campParam) {
      let targetCamp: Campaign | undefined;
      if (campParam.toLowerCase() === 'random') {
        // Random chance game: pick from active campaigns, fallback to any
        const activeCamps = loadedCampaigns.filter(c => c.isActive);
        const pool = activeCamps.length > 0 ? activeCamps : loadedCampaigns;
        targetCamp = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : undefined;
      } else {
        targetCamp = loadedCampaigns.find(c => c.id === campParam);
      }
      if (targetCamp) {
        setCustomerCampaign(targetCamp);
      } else if (loadedCampaigns.length > 0) {
        // Fallback to first campaign if requested ID not found
        setCustomerCampaign(loadedCampaigns[0]);
      }
    }
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
    setEditingCampaign(null);
  };

  const handleToggleActiveCampaign = (id: string) => {
    const updated = campaigns.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c);
    setCampaigns(updated);
    saveCampaigns(updated);
  };

  const handleDeleteCampaign = (id: string) => {
    if (confirm('آیا از حذف این کمپین اطمینان دارید؟')) {
      const updated = campaigns.filter(c => c.id !== id);
      setCampaigns(updated);
      saveCampaigns(updated);
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
  };

  const handleReloadAllData = () => {
    setCampaigns(getStoredCampaigns());
    setLeads(getStoredLeads());
    setStoreSettings(getStoredSettings());
  };

  // If a customer opened a story link (or admin requested live preview), render ONLY CustomerGamePage
  if (customerCampaign) {
    return (
      <CustomerGamePage
        campaign={customerCampaign}
        onGoToAdmin={() => {
          // Clear query params from browser URL and exit customer view
          window.history.pushState({}, '', window.location.pathname);
          setCustomerCampaign(null);
          setLeads(getStoredLeads());
          setCampaigns(getStoredCampaigns());
        }}
      />
    );
  }

  return (
    <div className="min-h-screen ambient-canvas text-slate-100 font-['Vazirmatn',sans-serif] selection:bg-amber-500 selection:text-slate-950">
      
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

