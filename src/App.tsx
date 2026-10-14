import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { ToastContainer } from './components/common/Toast';
import { AuthModal } from './components/common/AuthModal';
import { LiveVoiceAssistantModal } from './components/chat/LiveVoiceAssistantModal';
import { ToolsDrawerModal } from './components/common/ToolsDrawerModal';
import { HomeScreen } from './components/home/HomeScreen';
import { ChatScreen } from './components/chat/ChatScreen';
import { ImageWorkspace } from './components/create/ImageWorkspace';
import { ToolsScreen } from './components/tools/ToolsScreen';
import { GalleryScreen } from './components/gallery/GalleryScreen';
import { HistoryScreen } from './components/history/HistoryScreen';
import { SettingsScreen } from './components/settings/SettingsScreen';
import { ChatGPTSettingsModal } from './components/common/ChatGPTSettingsModal';

const MainLayout: React.FC = () => {
  const { currentView, isToolsDrawerOpen, setIsToolsDrawerOpen } = useApp();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <Header onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

      {/* Main Body with Sidebar + Dynamic View Screen */}
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
          {currentView === 'home' && <HomeScreen />}
          {currentView === 'chat' && <ChatScreen />}
          {currentView === 'create' && <ImageWorkspace />}
          {currentView === 'tools' && <ToolsScreen />}
          {currentView === 'gallery' && <GalleryScreen />}
          {currentView === 'history' && <HistoryScreen />}
          {currentView === 'settings' && <SettingsScreen />}
        </main>
      </div>

      {/* Global Modals & Notifications */}
      <ToolsDrawerModal isOpen={isToolsDrawerOpen} onClose={() => setIsToolsDrawerOpen(false)} />
      <LiveVoiceAssistantModal />
      <ToastContainer />
      <AuthModal />
      <ChatGPTSettingsModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
