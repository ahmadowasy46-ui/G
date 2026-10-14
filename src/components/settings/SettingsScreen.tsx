import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Settings,
  Moon,
  Sun,
  User,
  Sliders,
  Database,
  Download,
  Sparkles,
  Check,
  Mic,
  Volume2,
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const {
    theme,
    setTheme,
    user,
    setUser,
    conversations,
    galleryItems,
    characters,
    selectedCharacter,
    setSelectedCharacter,
    addToast,
  } = useApp();

  const [userName, setUserName] = useState(user.name);
  const [userEmail, setUserEmail] = useState(user.email);
  const [creativity, setCreativity] = useState('0.7');
  const [responseLength, setResponseLength] = useState('balanced');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({
      ...user,
      name: userName,
      email: userEmail,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
    addToast({ type: 'success', message: 'Profile updated successfully' });
  };

  const handleExportData = () => {
    const data = {
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
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `luna-ai-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({ type: 'success', message: 'Data backup downloaded' });
  };

  const testVoice = (char = selectedCharacter) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const testPhrase = `Hello! I am ${char.name}. I am configured as your ${char.gender === 'elder' ? 'older male' : char.gender} AI assistant.`;
      const utterance = new SpeechSynthesisUtterance(testPhrase);
      utterance.pitch = char.voicePitch;
      utterance.rate = char.voiceRate;
      window.speechSynthesis.speak(utterance);
    } else {
      addToast({ type: 'info', message: 'Speech synthesis not supported in this browser' });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 max-w-4xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Settings className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Settings & Preferences</h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400">
          Customize your Luna Nova experience, interface themes, and assistant generation parameters.
        </p>
      </div>

      {/* Theme Appearance (Moved from top of screen into private settings) */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Appearance & Theme</span>
        </h2>
        <p className="text-xs text-slate-400">
          Select your preferred display theme for Luna Nova.
        </p>
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border flex items-center gap-3 transition ${
              theme === 'dark'
                ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-md'
                : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            <Moon className="w-5 h-5 text-indigo-400" />
            <div className="text-left">
              <p className="text-xs font-bold">Obsidian Dark</p>
              <p className="text-[10px] text-slate-400">Optimized for visual editing</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border flex items-center gap-3 transition ${
              theme === 'light'
                ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-md'
                : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            <Sun className="w-5 h-5 text-amber-400" />
            <div className="text-left">
              <p className="text-xs font-bold">Daylight</p>
              <p className="text-[10px] text-slate-400">High contrast bright mode</p>
            </div>
          </button>
        </div>
      </div>

      {/* Assistant Character & Voice Selection */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Mic className="w-4 h-4 text-indigo-400" />
            <span>AI Assistant Character & Voice</span>
          </h2>
          <button
            type="button"
            onClick={() => testVoice()}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Test Voice</span>
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Choose which character persona and voice Luna Nova uses during voice calls and audio speech.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {characters.map((char) => {
            const isSelected = selectedCharacter.id === char.id;
            return (
              <div
                key={char.id}
                onClick={() => {
                  setSelectedCharacter(char);
                  addToast({ type: 'success', message: `Active assistant voice changed to ${char.name}` });
                  testVoice(char);
                }}
                className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-500/15 shadow-md shadow-indigo-500/10'
                    : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{char.avatar}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-900 text-indigo-400 border border-slate-800">
                      {char.gender === 'elder' ? 'Older Male' : char.gender}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-white">{char.name}</h3>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{char.description}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Pitch: {char.voicePitch}x</span>
                  {isSelected && <span className="font-bold text-indigo-400">● Selected</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* User Profile */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-400" />
          <span>User Profile & Plan</span>
        </h2>

        <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Display Name</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400">
              Active Tier: <strong className="text-indigo-400">{user.plan}</strong>
            </span>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition"
            >
              {saveSuccess && <Check className="w-3.5 h-3.5" />}
              <span>{saveSuccess ? 'Saved!' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Assistant Persona & Generation Controls */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span>AI Assistant Behavior</span>
        </h2>

        <div className="space-y-4 max-w-md">
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Creativity & Temperature</span>
              <span className="font-mono text-indigo-400">{creativity}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={creativity}
              onChange={(e) => setCreativity(e.target.value)}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>Deterministic / Precise</span>
              <span>Balanced</span>
              <span>Highly Creative</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Response Conciseness
            </label>
            <select
              value={responseLength}
              onChange={(e) => setResponseLength(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="concise">Concise & Direct</option>
              <option value="balanced">Balanced & Thorough</option>
              <option value="detailed">In-depth with Full Examples & Code</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-400" />
          <span>Data & Storage</span>
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Export your chat logs and creations history as a JSON archive, or review stored data.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportData}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 rounded-xl transition"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export User Archive</span>
          </button>
        </div>
      </div>
    </div>
  );
};
