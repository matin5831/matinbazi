import React, { useState, useEffect } from 'react';
import { Campaign, PlayerLead, StoreSettings } from './types';
import {
  getStoredCampaigns,
  saveCampaigns,
  getStoredLeads,
  getStoredSettings,
  saveSettings
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { CampaignsList } from './components/CampaignsList';
import { CampaignBuilder } from './components/CampaignBuilder';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { StoreSettingsView } from './components/StoreSettingsView';
import { PublicPlayerModal } from './components/PublicPlayerModal';
import { NetlifyDeployModal } from './components/NetlifyDeployModal';

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
  const [activeDemoCampaign, setActiveDemoCampaign] = useState<Campaign | null>(null);
  const [showNetlifyModal, setShowNetlifyModal] = useState(false);

  // Load Initial Storage Data
  useEffect(() => {
    const loadedCampaigns = getStoredCampaigns();
    const loadedLeads = getStoredLeads();
    const loadedSettings = getStoredSettings();

    setCampaigns(loadedCampaigns);
    setLeads(loadedLeads);
    setStoreSettings(loadedSettings);

    // Direct campaign URL query check
    const params = new URLSearchParams(window.location.search);
    const campParam = params.get('campaign');
    if (campParam) {
      const targetCamp = loadedCampaigns.find(c => c.id === campParam);
      if (targetCamp) {
        setActiveDemoCampaign(targetCamp);
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

  const handleSaveSettings = (newSettings: StoreSettings) => {
    setStoreSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleReloadAllData = () => {
    setCampaigns(getStoredCampaigns());
    setLeads(getStoredLeads());
    setStoreSettings(getStoredSettings());
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-['Vazirmatn',sans-serif] selection:bg-amber-500 selection:text-slate-950">
      
      {/* Header Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        storeSettings={storeSettings}
        onOpenNetlifyModal={() => setShowNetlifyModal(true)}
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
                onPlayDemo={(camp) => setActiveDemoCampaign(camp)}
                onToggleActive={handleToggleActiveCampaign}
                onDelete={handleDeleteCampaign}
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

      {/* Live Customer Game Player Modal */}
      {activeDemoCampaign && (
        <PublicPlayerModal
          campaign={activeDemoCampaign}
          onClose={() => {
            setActiveDemoCampaign(null);
            // Refresh leads & stats
            setLeads(getStoredLeads());
            setCampaigns(getStoredCampaigns());
          }}
        />
      )}

      {/* Netlify Deploy Guide Modal */}
      {showNetlifyModal && (
        <NetlifyDeployModal onClose={() => setShowNetlifyModal(false)} />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 dir-rtl">
        <span>پلتفرم بازاریابی و گیمیفیکیشن متین بازی (Matin Bazi) مخصوص فروشگاه‌های آنلاین | آماده اجرا روی Netlify</span>
      </footer>

    </div>
  );
}
