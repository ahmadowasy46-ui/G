import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AppView, Conversation } from '../../types';
import {
  Sparkles,
  Search,
  Plus,
  Image as ImageIcon,
  Bookmark,
  Layers,
  Compass,
  MessageSquare,
  Edit2,
  Trash2,
  X,
  Settings,
  User,
  LogOut,
  ChevronRight,
  HardDrive,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const {
    currentView,
    setCurrentView,
    conversations,
    activeConversationId,
    setActiveConversationId,
    startNewChat,
    deleteConversation,
    renameConversation,
    user,
    setIsSettingsModalOpen,
    setIsToolsDrawerOpen,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);

  // Group conversations by date like ChatGPT: Today, Yesterday, Previous 7 Days, Previous 30 Days, Older
  const groupedConversations = useMemo(() => {
    const filtered = searchQuery.trim()
      ? conversations.filter((c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : conversations;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const groups: { [key: string]: Conversation[] } = {
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      'Previous 30 Days': [],
      Older: [],
    };

    filtered.forEach((conv) => {
      const convDate = new Date(conv.updatedAt || conv.createdAt);
      if (convDate >= today) {
        groups.Today.push(conv);
      } else if (convDate >= yesterday) {
        groups.Yesterday.push(conv);
      } else if (convDate >= sevenDaysAgo) {
        groups['Previous 7 Days'].push(conv);
      } else if (convDate >= thirtyDaysAgo) {
        groups['Previous 30 Days'].push(conv);
      } else {
        groups.Older.push(conv);
      }
    });

    return groups;
  }, [conversations, searchQuery]);

  const handleSelectChat = (id: string) => {
    setActiveConversationId(id);
    setCurrentView('chat');
    onCloseMobile();
  };

  const handleCreateNewChat = () => {
    startNewChat();
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden animate-in fade-in"
        />
      )}

      {/* ChatGPT-style Sidebar Drawer */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-72 bg-[#171717] border-r border-[#262626] flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Top Header: Brand, Search, New Chat, Mobile Close */}
        <div className="p-3.5 border-b border-[#262626] flex items-center justify-between">
          <div
            onClick={() => {
              setCurrentView('home');
              onCloseMobile();
            }}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 p-0.5 shadow-md shadow-indigo-500/20">
              <div className="w-full h-full bg-[#171717] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <span className="font-extrabold text-sm tracking-tight text-white group-hover:text-indigo-300 transition">
              Luna Nova
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Search History Toggle */}
            <button
              type="button"
              onClick={() => setShowSearchInput(!showSearchInput)}
              className={`p-2 rounded-xl transition ${
                showSearchInput
                  ? 'bg-[#262626] text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-[#262626]'
              }`}
              title="Search conversation history"
              aria-label="Search history"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* New Chat Icon */}
            <button
              type="button"
              onClick={handleCreateNewChat}
              className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-[#262626] transition active:scale-95"
              title="New Chat"
              aria-label="New Chat"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-[#262626]"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Search Input (Expands when search icon is clicked) */}
        {showSearchInput && (
          <div className="px-3.5 py-2 border-b border-[#262626] bg-[#1a1a1a] animate-in slide-in-from-top-1">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5" />
              <input
                type="text"
                autoFocus
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#262626] rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 text-neutral-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Top Shortcut Items (ChatGPT Mobile Sidebar Style) */}
        <div className="p-2 space-y-0.5 border-b border-[#262626]">
          {/* Images */}
          <button
            type="button"
            onClick={() => {
              setCurrentView('gallery');
              onCloseMobile();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
              currentView === 'gallery'
                ? 'bg-[#262626] text-white'
                : 'text-neutral-300 hover:text-white hover:bg-[#212121]'
            }`}
          >
            <div className="p-1 rounded-lg bg-purple-500/10 text-purple-400">
              <ImageIcon className="w-3.5 h-3.5" />
            </div>
            <span>Images & Creations</span>
          </button>

          {/* Library / Prompts */}
          <button
            type="button"
            onClick={() => {
              setCurrentView('history');
              onCloseMobile();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
              currentView === 'history'
                ? 'bg-[#262626] text-white'
                : 'text-neutral-300 hover:text-white hover:bg-[#212121]'
            }`}
          >
            <div className="p-1 rounded-lg bg-blue-500/10 text-blue-400">
              <Bookmark className="w-3.5 h-3.5" />
            </div>
            <span>Library & History</span>
          </button>

          {/* AI Tools & Explore */}
          <button
            type="button"
            onClick={() => {
              setIsToolsDrawerOpen(true);
              onCloseMobile();
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white hover:bg-[#212121] transition"
          >
            <div className="p-1 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Compass className="w-3.5 h-3.5" />
            </div>
            <span>Explore AI Tools</span>
          </button>
        </div>

        {/* Chat History Section (Grouped by date like ChatGPT) */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {conversations.length === 0 ? (
            <div className="px-3 py-8 text-center text-neutral-500">
              <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No chat history yet</p>
              <button
                type="button"
                onClick={handleCreateNewChat}
                className="mt-2 text-xs text-indigo-400 hover:underline font-semibold"
              >
                Start a new conversation
              </button>
            </div>
          ) : (
            Object.entries(groupedConversations).map(([groupTitle, list]) => {
              if (list.length === 0) return null;
              return (
                <div key={groupTitle} className="space-y-1">
                  <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    {groupTitle}
                  </p>
                  <div className="space-y-0.5">
                    {list.map((conv) => {
                      const isSelected = activeConversationId === conv.id && currentView === 'chat';
                      return (
                        <div
                          key={conv.id}
                          onClick={() => handleSelectChat(conv.id)}
                          className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer select-none ${
                            isSelected
                              ? 'bg-[#262626] text-white shadow-sm font-semibold'
                              : 'text-neutral-300 hover:text-white hover:bg-[#212121]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden pr-2">
                            <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60 text-neutral-400" />
                            <span className="truncate">{conv.title}</span>
                          </div>

                          {/* Action Buttons on Hover (Rename & Delete) */}
                          <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const newTitle = prompt('Rename conversation:', conv.title);
                                if (newTitle && newTitle.trim()) {
                                  renameConversation(conv.id, newTitle.trim());
                                }
                              }}
                              className="p-1 text-neutral-400 hover:text-indigo-400 transition"
                              title="Rename"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Delete this conversation?')) {
                                  deleteConversation(conv.id);
                                }
                              }}
                              className="p-1 text-neutral-400 hover:text-rose-400 transition"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* User Profile Footer (Directly below History):                 */}
        {/* Clicking this image / row opens Settings (Storage & Sign Out) */}
        {/* ------------------------------------------------------------- */}
        <div className="p-3 border-t border-[#262626] bg-[#141414]">
          <button
            type="button"
            onClick={() => {
              setIsSettingsModalOpen(true);
              onCloseMobile();
            }}
            className="w-full flex items-center justify-between p-2 rounded-2xl hover:bg-[#212121] transition group text-left cursor-pointer active:scale-98"
            title="Open Settings (Storage, Voice, Account & Sign Out)"
            aria-label="User Settings"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              {/* User Avatar Image (clickable) */}
              <div className="relative w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 p-0.5 shrink-0 shadow-md group-hover:ring-2 group-hover:ring-indigo-500/40 transition">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-bold text-white text-xs">
                  {user.name.charAt(0)}
                </div>
                {/* Active indicator dot */}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-900" />
              </div>

              {/* User Name & Plan/Email */}
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate group-hover:text-indigo-300 transition leading-tight">
                  {user.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-neutral-400 truncate max-w-[110px]">
                    {user.email}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {user.plan}
                  </span>
                </div>
              </div>
            </div>

            {/* Settings Gear & Chevron */}
            <div className="p-1.5 rounded-lg text-neutral-400 group-hover:text-white group-hover:bg-[#2a2a2a] transition shrink-0">
              <Settings className="w-4 h-4" />
            </div>
          </button>
        </div>
      </aside>
    </>
  );
};
