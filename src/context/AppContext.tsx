import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AppView,
  Conversation,
  GalleryItem,
  AIModelConfig,
  UserProfile,
  AssistantCharacter,
} from '../types';
import { api } from '../services/api';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title?: string;
  message: string;
  duration?: number;
}

export const assistantCharacters: AssistantCharacter[] = [
  {
    id: 'char_luna',
    name: 'Luna',
    gender: 'female',
    title: 'Warm, Empathetic & Creative (HD Girl Voice)',
    avatar: '🌙',
    description: 'Specializes in creative ideation, image styling, empathetic dialogue, and clear reasoning.',
    systemPromptModifier: 'You speak with the voice and personality of Luna: warm, articulate, highly empathetic, creative, and inspiring. Keep vocal responses natural, concise, and conversational like a real female podcast host.',
    voicePitch: 1.05,
    voiceRate: 1.0,
    voiceName: 'Kore',
    preferredVoiceKeywords: ['samantha', 'victoria', 'karen', 'zira', 'female', 'natural'],
  },
  {
    id: 'char_atlas',
    name: 'Atlas',
    gender: 'male',
    title: 'Analytical, Direct & Sharp (HD Studio)',
    avatar: '⚡',
    description: 'Expert in technical problem solving, structured analysis, coding, and fast decision-making.',
    systemPromptModifier: 'You speak with the voice and personality of Atlas: confident, analytical, structured, direct, and pragmatic. Provide crisp, high-signal conversational insights.',
    voicePitch: 0.96,
    voiceRate: 1.02,
    voiceName: 'Puck',
    preferredVoiceKeywords: ['daniel', 'alex', 'david', 'male', 'george', 'natural'],
  },
  {
    id: 'char_orion',
    name: 'Orion',
    gender: 'elder',
    title: 'Elder Sage, Patient & Thoughtful (HD Deep)',
    avatar: '🦉',
    description: 'Brings seasoned depth, calm contemplation, philosophical perspective, and patient guidance.',
    systemPromptModifier: 'You speak with the voice and personality of Orion: a wise elder mentor. Your cadence is calm, reflective, measured, and deeply thoughtful. Avoid rushed replies.',
    voicePitch: 0.82,
    voiceRate: 0.92,
    voiceName: 'Fenrir',
    preferredVoiceKeywords: ['daniel', 'richard', 'oliver', 'deep', 'male', 'whisper'],
  },
];

interface AppContextType {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  createMode: 'edit' | 'generate';
  setCreateMode: (mode: 'edit' | 'generate') => void;
  
  // Workspace Preloading
  workspaceInitialImage: string | null;
  workspaceInitialPrompt: string;
  openImageEditorWith: (image: string, prompt?: string) => void;
  openImageGeneratorWith: (prompt: string, style?: string) => void;
  openChatWithPrompt: (prompt: string, attachment?: any) => void;

  // Conversations
  conversations: Conversation[];
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  setActiveConversationId: (id: string | null) => void;
  loadConversations: () => Promise<void>;
  startNewChat: (title?: string) => Promise<string>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, newTitle: string) => Promise<void>;

  // Gallery
  galleryItems: GalleryItem[];
  loadGallery: () => Promise<void>;
  saveCreation: (item: Partial<GalleryItem>) => Promise<GalleryItem>;
  deleteCreation: (id: string) => Promise<void>;

  // Models
  models: AIModelConfig[];
  loadModels: () => Promise<void>;
  toggleModel: (id: string, enabled: boolean) => Promise<void>;

  // Assistant Characters
  characters: AssistantCharacter[];
  selectedCharacter: AssistantCharacter;
  setSelectedCharacter: (char: AssistantCharacter) => void;

  // Live Voice Assistant
  isLiveVoiceModalOpen: boolean;
  setIsLiveVoiceModalOpen: (open: boolean) => void;
  openLiveVoiceAssistant: () => void;

  // Tools Drawer Modal (3-lines icon at top-left)
  isToolsDrawerOpen: boolean;
  setIsToolsDrawerOpen: (open: boolean) => void;

  // User & Auth
  user: UserProfile;
  setUser: (u: UserProfile) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (open: boolean) => void;
  signOut: () => void;
  clearLocalStorageAndCache: () => Promise<void>;
  deleteAllConversations: () => Promise<void>;

  // Theme
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;

  // Toasts
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

const defaultUser: UserProfile = {
  id: 'user_default',
  name: 'Alex Rivera',
  email: 'reduk289@gmail.com',
  role: 'user',
  plan: 'Luna Nova Pro',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [createMode, setCreateMode] = useState<'edit' | 'generate'>('edit');
  const [workspaceInitialImage, setWorkspaceInitialImage] = useState<string | null>(null);
  const [workspaceInitialPrompt, setWorkspaceInitialPrompt] = useState<string>('');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [models, setModels] = useState<AIModelConfig[]>([]);

  const [characters] = useState<AssistantCharacter[]>(assistantCharacters);
  const [selectedCharacter, setSelectedCharacter] = useState<AssistantCharacter>(assistantCharacters[0]);
  const [isLiveVoiceModalOpen, setIsLiveVoiceModalOpen] = useState<boolean>(false);
  const [isToolsDrawerOpen, setIsToolsDrawerOpen] = useState<boolean>(false);

  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, toast.duration || 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const signOut = useCallback(() => {
    setUser({
      id: 'guest_' + Date.now(),
      name: 'Guest User',
      email: 'guest@lunanova.ai',
      role: 'user',
      plan: 'Free Tier',
    });
    setIsSettingsModalOpen(false);
    addToast({
      type: 'info',
      title: 'Signed Out',
      message: 'You have been signed out. You are now using Luna Nova as Guest.',
    });
  }, [addToast]);

  const clearLocalStorageAndCache = useCallback(async () => {
    try {
      const keepKeys = ['theme'];
      Object.keys(localStorage).forEach((key) => {
        if (!keepKeys.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      if ('caches' in window) {
        const cacheKeys = await window.caches.keys();
        await Promise.all(cacheKeys.map((k) => window.caches.delete(k)));
      }
      addToast({
        type: 'success',
        title: 'Storage & Cache Cleared',
        message: 'Temporary files, models cache, and local storage have been cleaned.',
      });
    } catch (e: any) {
      addToast({ type: 'error', message: 'Failed to clear local cache' });
    }
  }, [addToast]);

  const deleteAllConversations = useCallback(async () => {
    try {
      for (const conv of conversations) {
        await api.deleteConversation(conv.id);
      }
      setConversations([]);
      setActiveConversationId(null);
      addToast({
        type: 'info',
        title: 'History Cleared',
        message: 'All conversations have been removed from your account.',
      });
    } catch (e: any) {
      addToast({ type: 'error', message: 'Failed to delete all conversations' });
    }
  }, [conversations, addToast]);

  // Theme toggle
  const setTheme = useCallback((t: 'dark' | 'light') => {
    setThemeState(t);
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const res = await api.getConversations(user.id);
      setConversations(res.conversations);
      if (!activeConversationId && res.conversations.length > 0) {
        setActiveConversationId(res.conversations[0].id);
      }
    } catch (err: any) {
      console.warn('Could not load conversations:', err.message);
    }
  }, [user.id, activeConversationId]);

  // Load gallery
  const loadGallery = useCallback(async () => {
    try {
      const res = await api.getGallery(user.id);
      setGalleryItems(res.items);
    } catch (err: any) {
      console.warn('Could not load gallery:', err.message);
    }
  }, [user.id]);

  // Load models
  const loadModels = useCallback(async () => {
    try {
      const res = await api.getModels();
      setModels(res.models);
    } catch (err: any) {
      console.warn('Could not load models:', err.message);
    }
  }, []);

  useEffect(() => {
    loadConversations();
    loadGallery();
    loadModels();
  }, [loadConversations, loadGallery, loadModels]);

  const startNewChat = async (title = 'New Conversation') => {
    try {
      const res = await api.createConversation({ title, userId: user.id });
      setConversations((prev) => [res.conversation, ...prev]);
      setActiveConversationId(res.conversation.id);
      setCurrentView('chat');
      return res.conversation.id;
    } catch (err: any) {
      addToast({ type: 'error', message: 'Failed to create new conversation' });
      return '';
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      await api.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        const remaining = conversations.filter((c) => c.id !== id);
        setActiveConversationId(remaining.length > 0 ? remaining[0].id : null);
      }
      addToast({ type: 'info', message: 'Conversation deleted' });
    } catch (err: any) {
      addToast({ type: 'error', message: 'Failed to delete conversation' });
    }
  };

  const renameConversation = async (id: string, newTitle: string) => {
    try {
      await api.updateConversation(id, { title: newTitle });
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
      );
      addToast({ type: 'success', message: 'Conversation renamed' });
    } catch (err: any) {
      addToast({ type: 'error', message: 'Failed to rename conversation' });
    }
  };

  const saveCreation = async (item: Partial<GalleryItem>) => {
    try {
      const res = await api.saveToGallery({ ...item, userId: user.id });
      setGalleryItems((prev) => [res.item, ...prev]);
      addToast({ type: 'success', message: 'Creation saved to Gallery' });
      return res.item;
    } catch (err: any) {
      addToast({ type: 'error', message: 'Failed to save to gallery' });
      throw err;
    }
  };

  const deleteCreation = async (id: string) => {
    try {
      await api.deleteFromGallery(id);
      setGalleryItems((prev) => prev.filter((g) => g.id !== id));
      addToast({ type: 'info', message: 'Item deleted from gallery' });
    } catch (err: any) {
      addToast({ type: 'error', message: 'Failed to delete item' });
    }
  };

  const toggleModel = async (id: string, enabled: boolean) => {
    try {
      const res = await api.toggleModel(id, enabled);
      setModels((prev) => prev.map((m) => (m.id === id ? res.model : m)));
      addToast({
        type: 'success',
        message: `${res.model.name} is now ${enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (err: any) {
      addToast({ type: 'error', message: 'Failed to update model status' });
    }
  };

  const openImageEditorWith = (image: string, prompt = '') => {
    setWorkspaceInitialImage(image);
    setWorkspaceInitialPrompt(prompt);
    setCreateMode('edit');
    setCurrentView('create');
  };

  const openImageGeneratorWith = (prompt: string, style?: string) => {
    setWorkspaceInitialPrompt(prompt);
    setCreateMode('generate');
    setCurrentView('create');
  };

  const openChatWithPrompt = async (prompt: string, attachment?: any) => {
    let convId = activeConversationId;
    if (!convId) {
      convId = await startNewChat('New Conversation');
    }
    setCurrentView('chat');
  };

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        createMode,
        setCreateMode,
        workspaceInitialImage,
        workspaceInitialPrompt,
        openImageEditorWith,
        openImageGeneratorWith,
        openChatWithPrompt,
        conversations,
        activeConversationId,
        activeConversation,
        setActiveConversationId,
        loadConversations,
        startNewChat,
        deleteConversation,
        renameConversation,
        galleryItems,
        loadGallery,
        saveCreation,
        deleteCreation,
        models,
        loadModels,
        toggleModel,
        characters,
        selectedCharacter,
        setSelectedCharacter,
        isLiveVoiceModalOpen,
        setIsLiveVoiceModalOpen,
        openLiveVoiceAssistant: () => setIsLiveVoiceModalOpen(true),
        isToolsDrawerOpen,
        setIsToolsDrawerOpen,
        user,
        setUser,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isSettingsModalOpen,
        setIsSettingsModalOpen,
        signOut,
        clearLocalStorageAndCache,
        deleteAllConversations,
        theme,
        setTheme,
        toggleTheme,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
