import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Settings,
  User,
  HardDrive,
  Trash2,
  Download,
  LogOut,
  Moon,
  Sun,
  Volume2,
  Check,
  Sparkles,
  Shield,
  Layers,
  RefreshCw,
  Globe,
  Radio,
  FileText,
} from 'lucide-react';

export const ChatGPTSettingsModal: React.FC = () => {
  const {
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    user,
    setUser,
    conversations,
    galleryItems,
    characters,
    selectedCharacter,
    setSelectedCharacter,
    theme,
    setTheme,
    signOut,
    clearLocalStorageAndCache,
    deleteAllConversations,
    setIsAuthModalOpen,
    addToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'general' | 'storage' | 'voice' | 'account'>('general');
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [speechPitch, setSpeechPitch] = useState(selectedCharacter.voicePitch || 1);
  const [speechRate, setSpeechRate] = useState(selectedCharacter.voiceRate || 1);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ur'>('en');
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  if (!isSettingsModalOpen) return null;

  // Approximate storage calculation
  const chatStorageMB = ((conversations.length * 12 + 15) / 10).toFixed(1);
  const galleryStorageMB = ((galleryItems.length * 35 + 20) / 10).toFixed(1);
  const cacheStorageMB = '0.8';
  const totalStorageMB = (parseFloat(chatStorageMB) + parseFloat(galleryStorageMB) + parseFloat(cacheStorageMB)).toFixed(1);
  const storagePercentage = Math.min(Math.round((parseFloat(totalStorageMB) / 100) * 100), 100);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({
      ...user,
      name,
      email,
    });
    addToast({ type: 'success', message: 'Profile details updated' });
  };

  const handleClearCache = async () => {
    setIsClearing(true);
    await clearLocalStorageAndCache();
    setTimeout(() => setIsClearing(false), 500);
  };

  const handleDeleteAllHistory = async () => {
    await deleteAllConversations();
    setConfirmDeleteAll(false);
  };

  const handleExportData = () => {
    const backupData = {
      user,
      conversations,
      galleryItems: galleryItems.map((g) => ({
        id: g.id,
        title: g.title,
        prompt: g.prompt,
        type: g.type,
        createdAt: g.createdAt,
      })),
      exportedAt: new Date().toISOString(),
      platform: 'Luna Nova Studio',
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `luna-nova-data-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({ type: 'success', message: 'Data backup exported successfully' });
  };

  const testVoiceSample = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const sampleText =
        selectedLanguage === 'ur'
          ? `سلام! میں ${selectedCharacter.name} ہوں۔ آپ کی گفتگو میں مدد کے لیے تیار ہوں۔`
          : `Hello! I am ${selectedCharacter.name}, your Luna Nova assistant.`;
      const utterance = new SpeechSynthesisUtterance(sampleText);
      utterance.pitch = speechPitch;
      utterance.rate = speechRate;
      utterance.lang = selectedLanguage === 'ur' ? 'ur-PK' : 'en-US';
      window.speechSynthesis.speak(utterance);
    } else {
      addToast({ type: 'info', message: 'Speech synthesis not supported in this browser' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-800 bg-[#18181b]/95 sm:bg-[#18181b] shadow-2xl text-slate-100 overflow-hidden">
        {/* Modal Header (ChatGPT Mobile Settings Style) */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-[#18181b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Settings</h2>
              <p className="text-[11px] text-slate-400">Account, Storage & App Preferences</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            title="Close Settings"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation (Pill Selector) */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-900/60 border-b border-slate-800/60 overflow-x-auto scrollbar-none text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 rounded-xl transition shrink-0 ${
              activeTab === 'general'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            General
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('storage')}
            className={`px-3 py-1.5 rounded-xl transition shrink-0 flex items-center gap-1.5 ${
              activeTab === 'storage'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Storage & Data</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('voice')}
            className={`px-3 py-1.5 rounded-xl transition shrink-0 flex items-center gap-1.5 ${
              activeTab === 'voice'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Voice & Audio</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`px-3 py-1.5 rounded-xl transition shrink-0 flex items-center gap-1.5 ${
              activeTab === 'account'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Account</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-5">
              {/* Profile Card Snippet */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-lg font-bold text-white shadow-md">
                    {user.name.charAt(0)}
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{user.name}</h3>
                    <p className="text-xs text-slate-400">{user.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {user.plan}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('account')}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                >
                  Edit
                </button>
              </div>

              {/* Theme Settings */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Theme Appearance
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition ${
                      theme === 'dark'
                        ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500/50'
                        : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Moon className="w-4 h-4 text-indigo-400" />
                    <span>Dark (ChatGPT)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition ${
                      theme === 'light'
                        ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500/50'
                        : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>Light Mode</span>
                  </button>
                </div>
              </div>

              {/* Language Selector */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Language
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">زبان</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLanguage('en');
                      addToast({ type: 'info', message: 'Language set to English' });
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition ${
                      selectedLanguage === 'en'
                        ? 'border-indigo-500 bg-indigo-950/40 text-white'
                        : 'border-slate-800 bg-slate-900/40 text-slate-400'
                    }`}
                  >
                    <p className="font-bold">English</p>
                    <p className="text-[10px] text-slate-500">Default</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLanguage('ur');
                      addToast({ type: 'info', message: 'اردو زبان منتخب کر لی گئی ہے' });
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-right transition ${
                      selectedLanguage === 'ur'
                        ? 'border-indigo-500 bg-indigo-950/40 text-white'
                        : 'border-slate-800 bg-slate-900/40 text-slate-400'
                    }`}
                  >
                    <p className="font-bold">اردو (Urdu)</p>
                    <p className="text-[10px] text-slate-500">پاکستانی / عالمی</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STORAGE & DATA CONTROLS (سٹوریج وغیرہ) */}
          {activeTab === 'storage' && (
            <div className="space-y-5">
              {/* Storage Meter Card */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Device Storage & Cache</h4>
                      <p className="text-[11px] text-slate-400">LocalStorage, indexed conversations & cached images</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-300">
                    {totalStorageMB} MB / 100 MB
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(storagePercentage, 6)}%` }}
                  />
                </div>

                {/* Detailed Breakdown */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center">
                  <div className="p-2 rounded-xl bg-slate-800/50">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Chats</p>
                    <p className="text-xs font-bold text-white">{chatStorageMB} MB</p>
                    <p className="text-[9px] text-slate-400">{conversations.length} records</p>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-800/50">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Creations</p>
                    <p className="text-xs font-bold text-white">{galleryStorageMB} MB</p>
                    <p className="text-[9px] text-slate-400">{galleryItems.length} items</p>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-800/50">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Models Cache</p>
                    <p className="text-xs font-bold text-white">{cacheStorageMB} MB</p>
                    <p className="text-[9px] text-slate-400">Optimized</p>
                  </div>
                </div>
              </div>

              {/* Storage Operations */}
              <div className="space-y-2.5">
                {/* Clear Cache Button */}
                <button
                  type="button"
                  onClick={handleClearCache}
                  disabled={isClearing}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-left transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                      <RefreshCw className={`w-4 h-4 ${isClearing ? 'animate-spin' : ''}`} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Clear Cache & Temporary Files</p>
                      <p className="text-[11px] text-slate-400">Frees media cache while retaining your conversations</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-indigo-400">Clear</span>
                </button>

                {/* Export Data Button */}
                <button
                  type="button"
                  onClick={handleExportData}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-left transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Export Data Backup</p>
                      <p className="text-[11px] text-slate-400">Download all chats, messages, and settings as JSON</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-purple-400">Export</span>
                </button>

                {/* Delete All Chats Confirmation */}
                {!confirmDeleteAll ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteAll(true)}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/40 text-left transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                        <Trash2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-rose-300">Delete All Conversations</p>
                        <p className="text-[11px] text-slate-400">Permanently remove all chat history from this device</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-rose-400">Delete</span>
                  </button>
                ) : (
                  <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 space-y-3">
                    <p className="text-xs font-bold text-rose-200">
                      Are you sure you want to delete all {conversations.length} conversations?
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDeleteAllHistory}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
                      >
                        Yes, Delete All
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteAll(false)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: VOICE & AUDIO */}
          {activeTab === 'voice' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Voice Model Character
                  </label>
                  <button
                    type="button"
                    onClick={testVoiceSample}
                    className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Test Voice</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {characters.map((char) => {
                    const isSelected = selectedCharacter.id === char.id;
                    return (
                      <button
                        key={char.id}
                        type="button"
                        onClick={() => setSelectedCharacter(char)}
                        className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-950/40 text-white'
                            : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="text-xl">{char.avatar}</span>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold truncate">{char.name}</p>
                          <p className="text-[10px] text-slate-500 capitalize">{char.gender}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Voice Pitch & Speed */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-300 font-semibold">Voice Speech Rate</span>
                    <span className="font-mono text-indigo-400">{speechRate.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.7"
                    max="1.5"
                    step="0.1"
                    value={speechRate}
                    onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-300 font-semibold">Voice Pitch</span>
                    <span className="font-mono text-indigo-400">{speechPitch.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.7"
                    max="1.4"
                    step="0.1"
                    value={speechPitch}
                    onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ACCOUNT & SIGN OUT */}
          {activeTab === 'account' && (
            <div className="space-y-5">
              <form onSubmit={handleSaveProfile} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Account Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition"
                  >
                    Save Changes
                  </button>
                </div>
              </form>

              {/* Plan Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-800/40 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-white">{user.plan}</span>
                  </div>
                  <p className="text-[11px] text-indigo-300/80 mt-0.5">
                    Full Gemini 2.5 & Multimodal Image Studio Active
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition"
                >
                  Manage
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer (Prominent Sign Out button matching ChatGPT mobile settings) */}
        <div className="p-4 border-t border-slate-800 bg-[#18181b] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setIsSettingsModalOpen(false);
              setIsAuthModalOpen(true);
            }}
            className="text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            Switch Account
          </button>

          {/* Prominent Red Sign Out Button */}
          <button
            type="button"
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-600/20 active:scale-95 transition"
            title="Sign out of Luna Nova"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
