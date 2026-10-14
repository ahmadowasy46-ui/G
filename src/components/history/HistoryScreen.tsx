import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  History,
  Search,
  MessageSquare,
  Wand2,
  Trash2,
  ArrowRight,
  Calendar,
  Layers,
} from 'lucide-react';

export const HistoryScreen: React.FC = () => {
  const {
    conversations,
    galleryItems,
    setActiveConversationId,
    setCurrentView,
    deleteConversation,
    openImageEditorWith,
    addToast,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [tab, setTab] = useState<'all' | 'chats' | 'images'>('all');

  const filteredChats = conversations.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.messages.some((m) => m.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredImages = galleryItems.filter(
    (g) =>
      g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.prompt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 max-w-5xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <History className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Activity History</h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400">
          Search and revisit all your past assistant dialogues, visual edits, and generated creations.
        </p>
      </div>

      {/* Search and Tabs Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search keywords, prompts, or messages..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setTab('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              tab === 'all'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Activity
          </button>
          <button
            type="button"
            onClick={() => setTab('chats')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              tab === 'chats'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Chats ({filteredChats.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('images')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              tab === 'images'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Images ({filteredImages.length})
          </button>
        </div>
      </div>

      {/* Timeline List */}
      <div className="space-y-3">
        {/* Chats */}
        {(tab === 'all' || tab === 'chats') && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
              Conversations
            </h3>
            {filteredChats.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3">No matching conversations.</p>
            ) : (
              filteredChats.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => {
                    setActiveConversationId(conv.id);
                    setCurrentView('chat');
                  }}
                  className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900/90 hover:border-slate-700 cursor-pointer transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-semibold text-white truncate">{conv.title}</h4>
                      <p className="text-[11px] text-slate-400 truncate">
                        {conv.messages.length} messages • Last updated{' '}
                        {new Date(conv.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this chat?')) deleteConversation(conv.id);
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Images */}
        {(tab === 'all' || tab === 'images') && (
          <div className="space-y-2 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
              Image Tasks & Modifications
            </h3>
            {filteredImages.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3">No matching image tasks.</p>
            ) : (
              filteredImages.map((img) => (
                <div
                  key={img.id}
                  onClick={() => openImageEditorWith(img.resultImage, img.prompt)}
                  className="p-3 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900/90 hover:border-slate-700 cursor-pointer transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img
                      src={img.resultImage}
                      alt={img.title}
                      className="w-12 h-12 rounded-lg object-cover border border-slate-800 shrink-0"
                    />
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-semibold text-white truncate">{img.title}</h4>
                      <p className="text-[11px] text-slate-400 truncate">{img.prompt}</p>
                      <span className="text-[10px] text-indigo-400 font-mono">
                        {img.type.toUpperCase()} • {new Date(img.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
