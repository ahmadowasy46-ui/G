import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { imageProcessor } from '../../services/imageProcessor';
import {
  Sparkles,
  Image as ImageIcon,
  MessageSquare,
  ArrowRight,
  ArrowUp,
  Plus,
  Mic,
  Radio,
  ChevronDown,
  Camera,
  FileText,
  Code,
  Lightbulb,
  Compass,
  Zap,
} from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const {
    setCurrentView,
    setCreateMode,
    openImageEditorWith,
    openImageGeneratorWith,
    startNewChat,
    openChatWithPrompt,
    openLiveVoiceAssistant,
    galleryItems,
    conversations,
    setActiveConversationId,
    setIsToolsDrawerOpen,
    addToast,
  } = useApp();

  const [quickInput, setQuickInput] = useState('');
  const [isRecordingHomeVoice, setIsRecordingHomeVoice] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [selectedModel, setSelectedModel] = useState('Default');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const startHomeVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      addToast({
        type: 'info',
        message: 'Speech recognition is not supported in this browser. Please use Chrome/Safari.',
      });
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      setIsRecordingHomeVoice(true);
      addToast({ type: 'info', message: 'Listening... speak your request' });

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setQuickInput(transcript);
        }
      };

      recognition.onerror = () => {
        setIsRecordingHomeVoice(false);
      };

      recognition.onend = () => {
        setIsRecordingHomeVoice(false);
      };

      recognition.start();
    } catch (e) {
      setIsRecordingHomeVoice(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (file.type.startsWith('image/')) {
      try {
        const { dataUrl } = await imageProcessor.fileToDataUrl(file);
        openImageEditorWith(dataUrl, 'Make this image look professional with enhanced lighting');
        addToast({ type: 'success', message: 'Photo loaded into Luna Image Workspace' });
      } catch (e: any) {
        addToast({ type: 'error', message: 'Failed to process image' });
      }
    } else {
      try {
        const reader = new FileReader();
        reader.onload = () => {
          openChatWithPrompt(`Analyze and summarize this file: ${file.name}`);
        };
        reader.readAsDataURL(file);
      } catch (e) {
        addToast({ type: 'error', message: 'Failed to read file' });
      }
    }
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;

    const lower = quickInput.toLowerCase();
    if (
      lower.startsWith('generate') ||
      lower.startsWith('create an image') ||
      lower.startsWith('draw') ||
      lower.startsWith('paint')
    ) {
      openImageGeneratorWith(quickInput.replace(/^(generate|create an image of|draw|paint)\s*/i, ''));
    } else if (
      lower.includes('background') ||
      lower.includes('remove') ||
      lower.includes('enhance') ||
      lower.includes('edit')
    ) {
      setCreateMode('edit');
      setCurrentView('create');
    } else {
      openChatWithPrompt(quickInput);
    }
    setQuickInput('');
  };

  // Suggestion prompt chips like ChatGPT
  const promptSuggestions = [
    {
      title: 'Create an image',
      subtitle: 'of a hyperrealistic glowing galaxy crystal',
      icon: <ImageIcon className="w-4 h-4 text-purple-400" />,
      action: () => openImageGeneratorWith('a hyperrealistic glowing galaxy crystal resting on dark obsidian stone, 8k resolution, cinematic lighting'),
    },
    {
      title: 'Help me code',
      subtitle: 'a responsive navigation bar with React & Tailwind',
      icon: <Code className="w-4 h-4 text-blue-400" />,
      action: () => openChatWithPrompt('Write a clean, responsive navigation bar component in React with Tailwind CSS and dark mode support.'),
    },
    {
      title: 'Summarize text',
      subtitle: 'extract key takeaways and bullet points',
      icon: <FileText className="w-4 h-4 text-amber-400" />,
      action: () => openChatWithPrompt('Please summarize the key takeaways of the following text into 5 clear bullet points: '),
    },
    {
      title: 'Brainstorm ideas',
      subtitle: 'for a new creative AI productivity workflow',
      icon: <Lightbulb className="w-4 h-4 text-emerald-400" />,
      action: () => openChatWithPrompt('Brainstorm 5 innovative product ideas combining voice intelligence and instant image editing.'),
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#212121] text-slate-100">
      {/* Hidden File Inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
        }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.csv,.json,.md,.zip,text/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
        }}
      />

      {/* Main Canvas Area (Centered ChatGPT Mobile Home Style) */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 flex flex-col items-center justify-center max-w-4xl mx-auto w-full">
        <div className="w-full max-w-2xl space-y-8 my-auto text-center py-4">
          {/* Centered Luna Nova Emblem */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 p-1 shadow-2xl shadow-indigo-500/25 animate-in zoom-in-95">
              <div className="w-full h-full bg-[#1e1e1e] rounded-[22px] flex items-center justify-center">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full border-3 border-indigo-400 border-r-transparent -rotate-45" />
                  <Sparkles className="w-4 h-4 text-purple-300 absolute -top-1 -right-1 animate-pulse" />
                </div>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              What can I help with today?
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto">
              Ask anything, generate photorealistic images, analyze files, or speak directly in voice mode.
            </p>
          </div>

          {/* ChatGPT-style Suggestion Chips Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
            {promptSuggestions.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={item.action}
                className="p-3.5 rounded-2xl border border-[#333] bg-[#2a2a2a]/80 hover:bg-[#333] hover:border-indigo-500/40 transition group cursor-pointer text-left flex items-start gap-3 active:scale-98 shadow-sm"
              >
                <div className="p-2 rounded-xl bg-[#1e1e1e] border border-[#444]/40 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  {item.icon}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition leading-tight">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Quick Shortcuts Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={openLiveVoiceAssistant}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition"
            >
              <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>Voice Assistant Call</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCreateMode('generate');
                setCurrentView('create');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2a2a2a] hover:bg-[#333] border border-[#383838] text-neutral-300 text-xs font-semibold transition"
            >
              <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
              <span>Image Studio</span>
            </button>
            <button
              type="button"
              onClick={() => setIsToolsDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2a2a2a] hover:bg-[#333] border border-[#383838] text-neutral-300 text-xs font-semibold transition"
            >
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span>All AI Tools</span>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Bottom Chat Input Area (Replicating ChatGPT Mobile Input)    */}
      {/* ------------------------------------------------------------- */}
      <div className="p-3 sm:p-5 border-t border-[#2a2a2a] bg-[#1a1a1a]">
        <div className="max-w-2xl mx-auto relative">
          {/* Attachment Popup Menu */}
          {showAttachMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowAttachMenu(false)}
              />
              <div className="absolute left-0 bottom-full mb-2 w-56 rounded-2xl border border-[#333] bg-[#262626] p-2 shadow-2xl z-40 space-y-1 animate-in fade-in slide-in-from-bottom-2">
                <p className="px-3 py-1 text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                  Attach
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowAttachMenu(false);
                    cameraInputRef.current?.click();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-medium text-neutral-200 hover:bg-[#333] hover:text-white transition"
                >
                  <Camera className="w-4 h-4 text-indigo-400" />
                  <span>Camera</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAttachMenu(false);
                    galleryInputRef.current?.click();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-medium text-neutral-200 hover:bg-[#333] hover:text-white transition"
                >
                  <ImageIcon className="w-4 h-4 text-purple-400" />
                  <span>Photos & Images</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAttachMenu(false);
                    fileInputRef.current?.click();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-medium text-neutral-200 hover:bg-[#333] hover:text-white transition"
                >
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Document or File</span>
                </button>
              </div>
            </>
          )}

          {/* Unified Input Box */}
          <form onSubmit={handleQuickSubmit}>
            <div className="relative flex items-center gap-1 sm:gap-2 bg-[#2f2f2f] rounded-3xl border border-[#3e3e3e] p-1.5 sm:p-2 shadow-xl focus-within:border-neutral-500 transition">
              {/* 1. Attachment Button (+ icon) on FAR LEFT */}
              <button
                type="button"
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                className={`p-2 rounded-full transition shrink-0 ${
                  showAttachMenu
                    ? 'bg-[#404040] text-white'
                    : 'text-neutral-400 hover:text-white hover:bg-[#383838]'
                }`}
                title="Add Photos, Camera or Files (+)"
                aria-label="Add attachments"
              >
                <Plus className="w-5 h-5" />
              </button>

              {/* 2. 'Default' Model Dropdown Selector directly next to input */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                  className="flex items-center gap-1 px-2 py-1 rounded-xl bg-[#383838] hover:bg-[#404040] text-xs font-semibold text-neutral-200 hover:text-white transition"
                  title="Model selector"
                >
                  <span className="text-indigo-400 font-bold">{selectedModel}</span>
                  <ChevronDown className="w-3 h-3 text-neutral-400" />
                </button>

                {showModelDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setShowModelDropdown(false)}
                    />
                    <div className="absolute left-0 bottom-full mb-2 w-52 rounded-2xl border border-[#333] bg-[#262626] p-2 shadow-2xl z-40 space-y-1">
                      {['Default', 'Luna Nova Pro', 'Fast Lite'].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            setSelectedModel(m);
                            setShowModelDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                            selectedModel === m
                              ? 'bg-indigo-600 text-white font-bold'
                              : 'text-neutral-300 hover:bg-[#333]'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* 3. Text Input in Middle */}
              <input
                type="text"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder="Message Luna Nova..."
                className="w-full bg-transparent px-2 py-1.5 text-xs sm:text-sm text-white placeholder-neutral-400 focus:outline-none"
              />

              {/* 4. Controls on RIGHT: Microphone + Upward-Pointing Arrow Send Button */}
              <div className="flex items-center gap-1 pr-1 shrink-0">
                {/* Voice Input (Microphone) */}
                <button
                  type="button"
                  onClick={startHomeVoiceInput}
                  className={`p-2 rounded-full transition ${
                    isRecordingHomeVoice
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'text-neutral-400 hover:text-white hover:bg-[#383838]'
                  }`}
                  title="Voice input (Microphone)"
                  aria-label="Voice input"
                >
                  <Mic className="w-4 h-4" />
                </button>

                {/* Send Button: Upward-pointing arrow icon (ArrowUp) in circle */}
                <button
                  type="submit"
                  disabled={!quickInput.trim()}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition active:scale-95 ${
                    quickInput.trim()
                      ? 'bg-white text-black hover:bg-neutral-200 shadow-md cursor-pointer'
                      : 'bg-[#404040] text-neutral-500 cursor-not-allowed opacity-60'
                  }`}
                  title="Send message"
                  aria-label="Send message"
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
