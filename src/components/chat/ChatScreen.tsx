import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Message, Attachment } from '../../types';
import { api } from '../../services/api';
import { imageProcessor } from '../../services/imageProcessor';
import {
  Send,
  Paperclip,
  Plus,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  RefreshCw,
  Square,
  FileText,
  Image as ImageIcon,
  Camera,
  X,
  Volume2,
  ChevronDown,
  Wand2,
  Mic,
  MicOff,
  Radio,
  ArrowRight,
  ArrowUp,
  PhoneCall,
  Headphones,
} from 'lucide-react';
import { studioAudio } from '../../services/audioEnhancer';

export const ChatScreen: React.FC = () => {
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    activeConversation,
    startNewChat,
    deleteConversation,
    openImageEditorWith,
    characters,
    selectedCharacter,
    setSelectedCharacter,
    openLiveVoiceAssistant,
    addToast,
  } = useApp();

  const [input, setInput] = useState<string>('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState<boolean>(false);
  const [showAudioModelDropdown, setShowAudioModelDropdown] = useState<boolean>(false);
  const [selectedModelId, setSelectedModelId] = useState<string>('gemini-3.8-flash');

  // Voice Input (Speech-to-Text) state
  const [isRecordingVoice, setIsRecordingVoice] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [liveTranscript, setLiveTranscript] = useState<string>('');

  // Native input refs for Camera, Gallery, and Files
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const voiceRecognitionRef = useRef<any>(null);
  const recordingTimerRef = useRef<any>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages, isGenerating, isRecordingVoice]);

  // Clean up timer/recognition on unmount
  useEffect(() => {
    return () => {
      if (voiceRecognitionRef.current) {
        voiceRecognitionRef.current.abort();
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  // -------------------------------------------------------------
  // File & Media Upload Handlers
  // -------------------------------------------------------------
  const processFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setShowAttachMenu(false);

    const allowedExtensions = [
      'jpg', 'jpeg', 'png', 'webp', 'gif', 'svg',
      'pdf', 'txt', 'md', 'json', 'csv', 'doc', 'docx', 'js', 'ts', 'tsx', 'py', 'html', 'css'
    ];

    for (const file of Array.from(fileList)) {
      // Size check (max 25MB)
      if (file.size > 25 * 1024 * 1024) {
        addToast({ type: 'error', message: `File "${file.name}" exceeds the 25MB size limit.` });
        continue;
      }

      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const isImage = file.type.startsWith('image/');
      const isSupportedDoc = allowedExtensions.includes(ext) || file.type.startsWith('text/');

      if (!isImage && !isSupportedDoc) {
        addToast({
          type: 'error',
          message: `Unsupported file type: .${ext}. Supported: images, PDF, documents, code, text.`,
        });
        continue;
      }

      try {
        let dataUrl = '';
        let preview: string | undefined = undefined;

        if (isImage) {
          const result = await imageProcessor.fileToDataUrl(file, 1600);
          dataUrl = result.dataUrl;
          preview = result.dataUrl;
        } else {
          const reader = new FileReader();
          dataUrl = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        }

        const newAtt: Attachment = {
          id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          url: dataUrl,
          preview,
        };

        setAttachments((prev) => [...prev, newAtt]);
        addToast({
          type: 'success',
          message: isImage ? `Image "${file.name}" attached` : `File "${file.name}" attached`,
        });
      } catch (err: any) {
        addToast({ type: 'error', message: `Failed to process ${file.name}` });
      }
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // -------------------------------------------------------------
  // Voice Input (Speech-to-Text in Input Dock)
  // -------------------------------------------------------------
  const startVoiceInput = async () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      addToast({
        type: 'error',
        message: 'Speech recognition is not supported in this browser. Please use Chrome, Safari, or Edge.',
      });
      return;
    }

    // Proactively verify/request microphone permission using getUserMedia
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          addToast({
            type: 'error',
            message: 'Microphone permission blocked. Please allow microphone access in your browser address bar.',
          });
          return;
        }
      }
    }

    try {
      if (voiceRecognitionRef.current) {
        voiceRecognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecordingVoice(true);
        setRecordingDuration(0);
        setLiveTranscript('');

        recordingTimerRef.current = setInterval(() => {
          setRecordingDuration((d) => d + 1);
        }, 1000);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        setLiveTranscript(currentText);
      };

      recognition.onerror = (event: any) => {
        console.warn('Voice recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          addToast({
            type: 'error',
            message: 'Microphone permission denied. Click the lock/site icon in your browser address bar to allow.',
          });
        }
        stopVoiceInput(false);
      };

      recognition.onend = () => {
        // Recognition ended
      };

      voiceRecognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Could not start voice recognition:', err);
      setIsRecordingVoice(false);
    }
  };

  const stopVoiceInput = (saveToInput = true) => {
    if (voiceRecognitionRef.current) {
      voiceRecognitionRef.current.stop();
      voiceRecognitionRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (saveToInput && liveTranscript.trim()) {
      setInput((prev) => (prev ? `${prev} ${liveTranscript.trim()}` : liveTranscript.trim()));
      addToast({ type: 'success', message: 'Speech transcribed to input.' });
    }

    setIsRecordingVoice(false);
    setRecordingDuration(0);
    setLiveTranscript('');
  };

  const sendVoiceTranscribedMessage = () => {
    const textToSend = liveTranscript.trim() || input.trim();
    stopVoiceInput(false);
    if (textToSend || attachments.length > 0) {
      handleSendMessage(textToSend);
    }
  };

  // -------------------------------------------------------------
  // Send Message & Response Handling
  // -------------------------------------------------------------
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend !== undefined ? textToSend : input;
    if (!text.trim() && attachments.length === 0) return;
    if (isGenerating) return;

    let convId = activeConversationId;
    if (!convId) {
      convId = await startNewChat(text.slice(0, 30) || 'New Conversation');
    }

    const conv = conversations.find((c) => c.id === convId);
    if (!conv) return;

    const userMsg: Message = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      attachments: [...attachments],
    };

    const updatedMessages = [...conv.messages, userMsg];
    conv.messages = updatedMessages;
    conv.updatedAt = Date.now();

    setInput('');
    setAttachments([]);
    setIsGenerating(true);

    try {
      abortControllerRef.current = new AbortController();

      const customPrompt = `${selectedCharacter.systemPromptModifier}
Provide helpful, beautifully structured, insightful answers.
If the user attached an image, carefully analyze its visual elements, colors, subject matter, and composition. If they asked for edits, explain what edits could be made and invite them to explore Luna Image Studio.`;

      const res = await api.sendMessage({
        messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        attachments: userMsg.attachments,
        modelId: selectedModelId,
        conversationId: convId,
        customSystemPrompt: customPrompt,
      });

      const assistantMsg: Message = {
        id: `msg_a_${Date.now()}`,
        role: 'assistant',
        content: res.content,
        timestamp: Date.now(),
        modelUsed: res.modelUsed,
      };

      conv.messages.push(assistantMsg);
      conv.updatedAt = Date.now();

      if (conv.messages.length <= 3 && conv.title.startsWith('New Conversation')) {
        conv.title = text.slice(0, 28) + (text.length > 28 ? '...' : '');
      }

      await api.updateConversation(convId, {
        title: conv.title,
        messages: conv.messages,
      });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        const errorMsg: Message = {
          id: `msg_err_${Date.now()}`,
          role: 'assistant',
          content: 'Something went wrong. Please check your connection or try again in a moment.',
          timestamp: Date.now(),
        };
        conv.messages.push(errorMsg);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsGenerating(false);
    addToast({ type: 'info', message: 'Generation stopped.' });
  };

  const handleRegenerate = async () => {
    if (!activeConversation || activeConversation.messages.length < 2) return;
    const msgs = [...activeConversation.messages];
    if (msgs[msgs.length - 1].role === 'assistant') {
      msgs.pop();
      activeConversation.messages = msgs;
      const lastUserMsg = msgs[msgs.length - 1];
      if (lastUserMsg && lastUserMsg.role === 'user') {
        handleSendMessage(lastUserMsg.content);
      }
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    addToast({ type: 'success', message: 'Copied to clipboard' });
  };

  const activeChatAudioRef = useRef<HTMLAudioElement | null>(null);

  const handleSpeak = async (text: string) => {
    if (activeChatAudioRef.current) {
      activeChatAudioRef.current.pause();
      activeChatAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    try {
      const res = await api.generateSpeech({
        text,
        voiceName: selectedCharacter.voiceName || 'Kore',
        character: selectedCharacter.name,
      });

      if (res.success && res.audioUrl) {
        const audio = await studioAudio.playHDAudio(res.audioUrl);
        activeChatAudioRef.current = audio;
        return;
      }
    } catch (e) {
      console.warn('HD TTS studio playback fallback in chat:', e);
    }

    // Fallback to browser synthesis
    if ('speechSynthesis' in window) {
      const clean = text.replace(/[*#`_~>\[\]]/g, '').trim();
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.pitch = selectedCharacter.voicePitch;
      utterance.rate = selectedCharacter.voiceRate;
      window.speechSynthesis.speak(utterance);
    } else {
      addToast({ type: 'info', message: 'Text-to-speech not supported in this browser' });
    }
  };

  // Helper to format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Markdown renderer
  const renderFormattedContent = (content: string) => {
    const codeBlockRegex = /```([a-zA-Z0-9]*)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.substring(lastIndex, match.index),
        });
      }
      parts.push({
        type: 'code',
        language: match[1] || 'plaintext',
        code: match[2].trim(),
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex),
      });
    }

    return (
      <div className="space-y-3 leading-relaxed text-slate-100 text-sm">
        {parts.map((p, idx) => {
          if (p.type === 'code') {
            return (
              <div
                key={idx}
                className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950/90 my-2 text-xs"
              >
                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
                  <span>{p.language}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(p.code || '', `code_${idx}`)}
                    className="flex items-center gap-1 hover:text-white transition"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy code</span>
                  </button>
                </div>
                <pre className="p-3.5 overflow-x-auto font-mono text-emerald-300/90 text-xs leading-relaxed">
                  <code>{p.code}</code>
                </pre>
              </div>
            );
          }

          const lines = (p.content || '').split('\n');
          return (
            <div key={idx} className="space-y-1.5">
              {lines.map((line, lIdx) => {
                if (line.startsWith('### ')) {
                  return (
                    <h3 key={lIdx} className="text-base font-bold text-white pt-2">
                      {line.replace('### ', '')}
                    </h3>
                  );
                }
                if (line.startsWith('## ')) {
                  return (
                    <h2 key={lIdx} className="text-lg font-bold text-white pt-2">
                      {line.replace('## ', '')}
                    </h2>
                  );
                }
                if (line.startsWith('- ') || line.startsWith('* ')) {
                  return (
                    <li key={lIdx} className="ml-4 list-disc text-slate-200">
                      {line.replace(/^[-*]\s+/, '')}
                    </li>
                  );
                }
                if (/^\d+\.\s/.test(line)) {
                  return (
                    <div key={lIdx} className="ml-2 font-medium text-slate-200">
                      {line}
                    </div>
                  );
                }
                if (!line.trim()) {
                  return <div key={lIdx} className="h-2" />;
                }
                return (
                  <p key={lIdx} className="text-slate-200">
                    {line}
                  </p>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
      {/* Hidden Native File Inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => processFiles(e.target.files)}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => processFiles(e.target.files)}
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.csv,.json,.md,.zip,text/*"
        className="hidden"
        onChange={(e) => processFiles(e.target.files)}
      />



      {/* Message Stream Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
        {activeConversation?.messages.map((msg) => {
          const isUser = msg.role === 'user';
          const hasImageAttachment = msg.attachments?.some((a) => a.preview || a.type.startsWith('image/'));

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center shadow-md select-none ${
                  isUser
                    ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-xs'
                    : 'bg-indigo-600/20 border border-indigo-500/30 text-base'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : selectedCharacter.avatar}
              </div>

              {/* Message Bubble & Content */}
              <div
                className={`group relative rounded-2xl p-4 shadow-lg transition-all ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-900/90 border border-slate-800 text-slate-100 rounded-tl-none'
                }`}
              >
                {/* Attachments preview if any */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2.5">
                    {msg.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950/80 p-1.5 flex items-center gap-2 max-w-sm"
                      >
                        {att.preview ? (
                          <div className="relative group/thumb">
                            <img
                              src={att.preview}
                              alt="thumb"
                              className="w-14 h-14 object-cover rounded-lg cursor-pointer"
                              onClick={() => openImageEditorWith(att.preview!)}
                              title="Click to open in Luna Image Editor"
                            />
                            <div
                              onClick={() => openImageEditorWith(att.preview!)}
                              className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center rounded-lg cursor-pointer transition"
                            >
                              <Wand2 className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="p-2.5 bg-slate-800 rounded-lg text-slate-400">
                            <FileText className="w-5 h-5 text-indigo-400" />
                          </div>
                        )}
                        <div className="overflow-hidden pr-2">
                          <p className="text-xs font-semibold text-white truncate max-w-[160px]">{att.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {formatFileSize(att.size)} • {att.type.split('/')[1] || 'doc'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Content */}
                {isUser ? (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  renderFormattedContent(msg.content)
                )}

                {/* Quick Action: Open in Image Studio if message involved an image */}
                {!isUser && hasImageAttachment && (
                  <div className="mt-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const firstImg = activeConversation?.messages
                          .flatMap((m) => m.attachments || [])
                          .find((a) => a.preview)?.preview;
                        if (firstImg) {
                          openImageEditorWith(firstImg);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>Open in Luna Image Studio for Before/After Slider</span>
                    </button>
                  </div>
                )}

                {/* Action Bar for Assistant Message */}
                {!isUser && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-2 text-slate-400 text-xs">
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.content, msg.id)}
                      className="p-1 hover:text-white rounded transition flex items-center gap-1"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span className="text-[10px]">Copy</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSpeak(msg.content)}
                      className="p-1 hover:text-white rounded transition flex items-center gap-1"
                      title="Read aloud"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Speak</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRegenerate}
                      className="p-1 hover:text-white rounded transition flex items-center gap-1 ml-auto"
                      title="Regenerate response"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Regenerate</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Live Generating Indicator */}
        {isGenerating && (
          <div className="flex gap-3 max-w-2xl mr-auto">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center select-none text-base">
              {selectedCharacter.avatar}
            </div>
            <div className="rounded-2xl rounded-tl-none p-4 bg-slate-900/90 border border-slate-800 text-slate-300 text-xs flex items-center gap-3">
              <span className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-indigo-300 animate-bounce [animation-delay:0.4s]" />
              </span>
              <span>{selectedCharacter.name} is thinking and formulating response...</span>
              <button
                type="button"
                onClick={handleStopGeneration}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] flex items-center gap-1 transition"
              >
                <Square className="w-3 h-3 text-rose-400 fill-rose-400" />
                <span>Stop</span>
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Input Dock Area: Attachment Menu, Voice Input, Send */}
      {/* ------------------------------------------------------------- */}
      <div className="p-4 sm:px-8 border-t border-slate-800/80 bg-slate-950/95">
        <div className="max-w-3xl mx-auto space-y-2 relative">
          {/* Active Voice Recording Bar (Speech-to-Text) */}
          {isRecordingVoice && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-indigo-950/90 to-purple-950/90 border border-indigo-500/40 shadow-xl text-xs animate-in slide-in-from-bottom-2">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-rose-600 text-white animate-pulse shrink-0">
                  <Mic className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">Recording Voice...</span>
                    <span className="font-mono text-indigo-300 text-[11px]">
                      {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 italic truncate max-w-sm">
                    {liveTranscript || 'Listening to your speech...'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => stopVoiceInput(false)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => stopVoiceInput(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs transition"
                >
                  Insert Text
                </button>
                <button
                  type="button"
                  onClick={sendVoiceTranscribedMessage}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition"
                >
                  <span>Send</span>
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Attachment Preview Tray */}
          {attachments.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="relative group rounded-xl border border-slate-700 bg-slate-900/90 p-1.5 flex items-center gap-2.5 shrink-0 shadow-md"
                >
                  {att.preview ? (
                    <img src={att.preview} alt="thumb" className="w-9 h-9 rounded-lg object-cover" />
                  ) : (
                    <div className="p-2 bg-slate-800 rounded-lg text-indigo-400">
                      <FileText className="w-4 h-4" />
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-white max-w-[140px] truncate">{att.name}</p>
                    <p className="text-[10px] text-slate-400">{formatFileSize(att.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
                    className="p-1 text-slate-400 hover:text-rose-400 rounded-md transition"
                    title="Remove attachment"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Popup Selection Menu for Attachments */}
          {showAttachMenu && (
            <div className="absolute left-0 bottom-full mb-2 w-56 rounded-2xl border border-slate-800 bg-slate-900/95 p-2 shadow-2xl z-40 space-y-1 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2">
              <p className="px-3 py-1 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Attach Content
              </p>

              {/* Camera Option */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition"
              >
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold leading-tight">Camera</p>
                  <p className="text-[10px] text-slate-400">Take a photo directly</p>
                </div>
              </button>

              {/* Gallery / Photos Option */}
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition"
              >
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold leading-tight">Photos & Images</p>
                  <p className="text-[10px] text-slate-400">Device photo library</p>
                </div>
              </button>

              {/* Files / Documents Option */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition"
              >
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold leading-tight">Files & Documents</p>
                  <p className="text-[10px] text-slate-400">PDFs, code, text files</p>
                </div>
              </button>
            </div>
          )}

          {/* Textarea Input Container */}
          <div className="relative flex items-center gap-1 sm:gap-2 bg-slate-900/95 rounded-2xl border border-slate-700/80 p-2 shadow-xl focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition">
            {/* 1. File Attachment Button (+ / Plus icon) on the FAR LEFT */}
            <button
              type="button"
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              className={`p-2 rounded-xl transition shrink-0 ${
                showAttachMenu
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Add Camera photo, Device photos, or Files (+)"
              aria-label="Add attachments"
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* 2. 'Default' Model Dropdown Selector directly next to input area */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowAudioModelDropdown(!showAudioModelDropdown)}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white transition shadow-sm active:scale-95"
                title="Select AI Model & Voice"
                aria-label="Select AI Model and Voice"
              >
                <span className="text-indigo-400 font-bold">Default</span>
                <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 transition-transform ${showAudioModelDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Model & Audio Voice Dropdown Menu */}
              {showAudioModelDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowAudioModelDropdown(false)}
                  />
                  <div className="absolute left-0 bottom-full mb-2 w-72 sm:w-80 rounded-2xl border border-slate-800 bg-slate-950 p-2.5 shadow-2xl z-40 space-y-2 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2">
                    <div className="px-2 py-1 flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                        Select Model & Voice
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono">
                        Active: Default
                      </span>
                    </div>

                    {/* AI Models */}
                    <div className="space-y-1">
                      <p className="px-2 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        AI Reasoning Engine
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedModelId('gemini-3.8-flash');
                          setShowAudioModelDropdown(false);
                          addToast({ type: 'info', message: 'Model set to Gemini 3.8 Flash (Default)' });
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs transition ${
                          selectedModelId === 'gemini-3.8-flash'
                            ? 'bg-indigo-600/20 border border-indigo-500/40 text-white font-semibold'
                            : 'hover:bg-slate-900 text-slate-300'
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-white">Default: Gemini 3.8 Flash</p>
                          <p className="text-[10px] text-slate-400">Multimodal vision, high-speed generation</p>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                          Fast
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedModelId('gemini-4-argon');
                          setShowAudioModelDropdown(false);
                          addToast({ type: 'info', message: 'Model set to Gemini 4 Argon' });
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs transition ${
                          selectedModelId === 'gemini-4-argon'
                            ? 'bg-indigo-600/20 border border-indigo-500/40 text-white font-semibold'
                            : 'hover:bg-slate-900 text-slate-300'
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-white">Gemini 4 Argon</p>
                          <p className="text-[10px] text-slate-400">Deep STEM reasoning, complex problem solving</p>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
                          Pro
                        </span>
                      </button>
                    </div>

                    {/* HD Audio Voices */}
                    <div className="space-y-1 pt-1 border-t border-slate-800/80">
                      <p className="px-2 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        HD Voice Persona (24kHz Studio)
                      </p>
                      {characters.map((char) => (
                        <button
                          key={char.id}
                          type="button"
                          onClick={() => {
                            setSelectedCharacter(char);
                            setShowAudioModelDropdown(false);
                            addToast({ type: 'info', message: `Voice Persona set to ${char.name} (${char.title})` });
                          }}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left transition ${
                            selectedCharacter.id === char.id
                              ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                              : 'hover:bg-slate-900 text-slate-300'
                          }`}
                        >
                          <span className="text-base">{char.avatar}</span>
                          <div className="overflow-hidden min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-xs text-white leading-tight">{char.name}</p>
                              {char.id === 'char_luna' && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300 font-bold border border-pink-500/30">
                                  Default Girl Voice
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 truncate">{char.title}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 3. Input Textarea */}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={
                attachments.length > 0
                  ? "Describe what you'd like Luna to do with this attachment..."
                  : "Ask Luna anything, describe an edit, or speak with voice..."
              }
              rows={1}
              className="w-full bg-transparent px-2 sm:px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none resize-none max-h-32 min-h-[38px]"
            />

            {/* 4. Right Controls: Live Voice Assistant + Microphone + Upward Arrow Send */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 pl-1">
              {/* Live Voice Assistant (Interactive HD Voice Call) */}
              <button
                type="button"
                onClick={openLiveVoiceAssistant}
                className="p-2 text-indigo-400 hover:text-white hover:bg-indigo-600/20 rounded-xl transition shrink-0 group relative border border-indigo-500/20 hover:border-indigo-500/40"
                title="Live Voice Assistant (Interactive HD Girl Voice Call)"
                aria-label="Open Live Voice Assistant"
              >
                <Radio className="w-4 h-4 text-indigo-400 animate-pulse group-hover:scale-110 transition" />
              </button>

              {/* Microphone Button on the Right for Speech-to-Text */}
              {!isRecordingVoice && (
                <button
                  type="button"
                  onClick={startVoiceInput}
                  className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-xl transition shrink-0"
                  title="Voice Input (Tap to speak)"
                  aria-label="Voice input"
                >
                  <Mic className="w-4 h-4" />
                </button>
              )}

              {/* Send Button with UPWARD-POINTING ARROW (⬆️ ArrowUp) on the Right */}
              {isGenerating ? (
                <button
                  type="button"
                  onClick={handleStopGeneration}
                  className="w-8 h-8 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-600/30 transition shrink-0 active:scale-95"
                  title="Stop generation"
                  aria-label="Stop generation"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim() && attachments.length === 0}
                  className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-35 text-white flex items-center justify-center shadow-md shadow-indigo-600/30 transition shrink-0 active:scale-95"
                  title="Send message (Upward arrow)"
                  aria-label="Send message"
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                </button>
              )}
            </div>
          </div>

          {/* Under-Input Row: Active Indicator & Keyboard Hint */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-0.5">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="text-slate-500">Active:</span>
              <span className="text-indigo-400 font-medium">
                {selectedModelId === 'gemini-3.8-flash' ? 'Gemini 3.8 Flash' : 'Gemini 4 Argon'}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300 font-medium">{selectedCharacter.name} (HD 24kHz)</span>
            </div>

            <span className="text-[10px] sm:text-[11px] text-slate-500">Shift + Enter for new line • Enter to send</span>
          </div>
        </div>
      </div>
    </div>
  );
};
