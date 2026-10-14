import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  Menu,
  SquarePen,
  ChevronDown,
  Check,
  Zap,
  Cpu,
  Eye,
  Settings,
} from 'lucide-react';

interface HeaderProps {
  onToggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileSidebar }) => {
  const {
    setCurrentView,
    startNewChat,
    user,
    setIsSettingsModalOpen,
  } = useApp();

  const [selectedModel, setSelectedModel] = useState('Luna Nova 2.5');
  const [showModelMenu, setShowModelMenu] = useState(false);

  const modelOptions = [
    {
      id: 'luna-2.5-flash',
      name: 'Luna Nova 2.5',
      desc: 'Fastest intelligence & real-time reasoning',
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      badge: 'Default',
    },
    {
      id: 'luna-pro-advanced',
      name: 'Luna Nova Pro',
      desc: 'Complex problem solving, coding & math',
      icon: <Cpu className="w-4 h-4 text-indigo-400" />,
      badge: 'Advanced',
    },
    {
      id: 'luna-vision-multi',
      name: 'Luna Nova Vision',
      desc: 'Multimodal image inspection & generation',
      icon: <Eye className="w-4 h-4 text-emerald-400" />,
      badge: 'Multimodal',
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#262626] bg-[#171717]/95 backdrop-blur-md px-3 sm:px-6 py-2.5 flex items-center justify-between transition-colors">
      {/* Left: 3-Lines Menu Icon -> Opens the ChatGPT History Drawer */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="p-2 -ml-1 text-neutral-300 hover:text-white rounded-xl hover:bg-[#262626] border border-[#333]/60 shadow-sm transition active:scale-95 group cursor-pointer"
          title="Open Chat History & Menu (3-lines)"
          aria-label="Open chat history menu"
        >
          <Menu className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 transition" />
        </button>

        {/* Center/Left Brand & Model Selector Dropdown (ChatGPT Style) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowModelMenu(!showModelMenu)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-[#262626] text-white transition cursor-pointer select-none group"
            title="Switch AI Model"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 p-0.5 shadow-sm">
              <div className="w-full h-full bg-[#171717] rounded-[6px] flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-indigo-400" />
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-white group-hover:text-indigo-300 transition">
                {selectedModel}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${
                  showModelMenu ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>

          {/* Model Selection Dropdown Menu */}
          {showModelMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowModelMenu(false)}
              />
              <div className="absolute left-0 top-full mt-1.5 w-72 rounded-2xl border border-[#333] bg-[#1e1e1e] p-2 shadow-2xl z-50 space-y-1 animate-in fade-in slide-in-from-top-1">
                <p className="px-2.5 py-1 text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                  Model Selector
                </p>
                {modelOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSelectedModel(opt.name);
                      setShowModelMenu(false);
                    }}
                    className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition ${
                      selectedModel === opt.name
                        ? 'bg-[#2a2a2a] text-white ring-1 ring-indigo-500/50'
                        : 'text-neutral-300 hover:text-white hover:bg-[#262626]'
                    }`}
                  >
                    <div className="p-1 rounded-lg bg-[#2a2a2a] shrink-0 mt-0.5">
                      {opt.icon}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{opt.name}</span>
                        {selectedModel === opt.name && (
                          <Check className="w-3.5 h-3.5 text-indigo-400" />
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-400 truncate">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Controls: New Chat Icon + User Profile Badge (Settings) */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* New Chat Button (Pencil / Note Square Icon) */}
        <button
          type="button"
          onClick={() => {
            startNewChat();
            setCurrentView('chat');
          }}
          className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl text-neutral-300 hover:text-white hover:bg-[#262626] border border-[#333]/50 transition active:scale-95"
          title="New Chat"
          aria-label="New Chat"
        >
          <SquarePen className="w-4 h-4 text-neutral-300 hover:text-white" />
          <span className="hidden sm:inline text-xs font-semibold">New chat</span>
        </button>

        {/* User Profile Avatar (Clicking opens ChatGPT Settings Modal) */}
        <button
          type="button"
          onClick={() => setIsSettingsModalOpen(true)}
          className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl hover:bg-[#262626] border border-[#333]/50 transition cursor-pointer"
          title="Settings & Profile"
          aria-label="Settings & Profile"
        >
          <div className="relative w-6 h-6 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white text-[11px] shadow-sm">
            {user.name.charAt(0)}
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="font-semibold text-neutral-200 text-[11px] leading-tight truncate max-w-[80px]">
              {user.name}
            </span>
          </div>
          <Settings className="w-3.5 h-3.5 text-neutral-400" />
        </button>
      </div>
    </header>
  );
};
