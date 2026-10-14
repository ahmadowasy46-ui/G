import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { AssistantCharacter } from '../../types';
import { api } from '../../services/api';
import {
  Mic,
  MicOff,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  ChevronDown,
  RefreshCw,
  PhoneOff,
  User,
} from 'lucide-react';
import { studioAudio } from '../../services/audioEnhancer';

export const LiveVoiceAssistantModal: React.FC = () => {
  const {
    isLiveVoiceModalOpen,
    setIsLiveVoiceModalOpen,
    characters,
    selectedCharacter,
    setSelectedCharacter,
    activeConversationId,
    startNewChat,
    addToast,
  } = useApp();

  const [assistantState, setAssistantState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [userTranscript, setUserTranscript] = useState<string>('');
  const [aiResponseText, setAiResponseText] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showCharacterMenu, setShowCharacterMenu] = useState<boolean>(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const recognitionRef = useRef<any>(null);
  const isComponentMounted = useRef<boolean>(true);
  const isListeningActive = useRef<boolean>(false);

  // Load browser TTS voices
  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const v = window.speechSynthesis.getVoices();
        setAvailableVoices(v);
      }
    };

    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Find best matching voice for selected character
  const getCharacterVoice = useCallback((char: AssistantCharacter): SpeechSynthesisVoice | null => {
    if (availableVoices.length === 0) return null;

    // Search by character preferred keywords
    for (const keyword of char.preferredVoiceKeywords) {
      const match = availableVoices.find(
        (v) =>
          v.name.toLowerCase().includes(keyword.toLowerCase()) ||
          v.lang.toLowerCase().includes(keyword.toLowerCase())
      );
      if (match) return match;
    }

    // Secondary search by gender hint
    if (char.gender === 'female') {
      const fMatch = availableVoices.find(
        (v) =>
          v.name.toLowerCase().includes('natural') ||
          v.name.toLowerCase().includes('google us english') ||
          v.name.toLowerCase().includes('google uk english female') ||
          v.name.toLowerCase().includes('female') ||
          v.name.toLowerCase().includes('jenny') ||
          v.name.toLowerCase().includes('aria') ||
          v.name.toLowerCase().includes('samantha') ||
          v.name.toLowerCase().includes('victoria') ||
          v.name.toLowerCase().includes('zira') ||
          v.name.toLowerCase().includes('karen')
      );
      if (fMatch) return fMatch;
    } else {
      const mMatch = availableVoices.find(
        (v) =>
          v.name.toLowerCase().includes('male') ||
          v.name.toLowerCase().includes('daniel') ||
          v.name.toLowerCase().includes('david') ||
          v.name.toLowerCase().includes('george')
      );
      if (mMatch) return mMatch;
    }

    // Default to first English voice or first voice
    const engVoice = availableVoices.find((v) => v.lang.startsWith('en'));
    return engVoice || availableVoices[0] || null;
  }, [availableVoices]);

  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Fallback to browser synthesis if API audio is unavailable
  const fallbackToBrowserSpeech = (text: string, onEndCallback: () => void) => {
    if (!('speechSynthesis' in window)) {
      onEndCallback();
      return;
    }

    const cleanText = text.replace(/[*#`_~>\[\]]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voice = getCharacterVoice(selectedCharacter);
    if (voice) {
      utterance.voice = voice;
    }
    utterance.pitch = selectedCharacter.voicePitch;
    utterance.rate = selectedCharacter.voiceRate;

    utterance.onend = () => {
      if (isComponentMounted.current) {
        onEndCallback();
      }
    };

    utterance.onerror = (e) => {
      console.warn('Browser speech synthesis error:', e);
      if (isComponentMounted.current) {
        onEndCallback();
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  // Speak AI text aloud using HD Gemini 3.8 Flash TTS (24kHz Studio Podcast Quality)
  const speakResponse = useCallback(
    async (text: string, onEndCallback: () => void) => {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      setAssistantState('speaking');

      // Attempt 1: High-Definition Gemini 3.8 Flash TTS (24kHz Studio Podcast Voice)
      try {
        const ttsRes = await api.generateSpeech({
          text,
          voiceName: selectedCharacter.voiceName || 'Kore',
          character: selectedCharacter.name,
        });

        if (ttsRes.success && ttsRes.audioUrl && isComponentMounted.current) {
          const audio = await studioAudio.playHDAudio(ttsRes.audioUrl);
          activeAudioRef.current = audio;

          audio.onended = () => {
            activeAudioRef.current = null;
            if (isComponentMounted.current) {
              onEndCallback();
            }
          };

          audio.onerror = (e) => {
            console.warn('HD Audio playback error, falling back to browser speech:', e);
            fallbackToBrowserSpeech(text, onEndCallback);
          };

          return;
        }
      } catch (hdErr) {
        console.warn('HD TTS call error, falling back to browser speech:', hdErr);
      }

      // Attempt 2: Enhanced browser speech fallback
      fallbackToBrowserSpeech(text, onEndCallback);
    },
    [selectedCharacter, getCharacterVoice]
  );

  // Send query to Luna Nova backend and receive intelligent response
  const sendVoiceQuery = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        startListening();
        return;
      }

      setAssistantState('thinking');
      setUserTranscript(query);

      try {
        let convId = activeConversationId;
        if (!convId) {
          convId = await startNewChat(`Voice: ${query.slice(0, 24)}...`);
        }

        const customPrompt = `${selectedCharacter.systemPromptModifier}
The user is speaking with you via Luna Live Voice.
Keep your response conversational, concise (under 3-4 sentences unless requested), engaging, and friendly without code blocks or complex markdown.`;

        const res = await api.sendMessage({
          messages: [{ role: 'user', content: query }],
          modelId: 'gemini-3.8-flash',
          conversationId: convId,
          customSystemPrompt: customPrompt,
        });

        const reply = res.content || "I'm listening. How can I help you next?";
        setAiResponseText(reply);

        // Speak response, then automatically resume listening for continuous conversation!
        speakResponse(reply, () => {
          if (!isMuted && isComponentMounted.current) {
            startListening();
          } else {
            setAssistantState('idle');
          }
        });
      } catch (err: any) {
        console.error('Voice chat error:', err);
        const fallback = 'I had a brief connection issue. Could you please say that again?';
        setAiResponseText(fallback);
        speakResponse(fallback, () => {
          startListening();
        });
      }
    },
    [selectedCharacter, activeConversationId, startNewChat, speakResponse, isMuted]
  );

  const [micPermissionDenied, setMicPermissionDenied] = useState<boolean>(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState<boolean>(false);

  // Proactively request / re-request microphone permission
  const requestMicrophonePermission = async () => {
    setIsRequestingPermission(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        setMicPermissionDenied(false);
        setIsRequestingPermission(false);
        addToast({ type: 'success', message: 'Microphone permission granted!' });
        startListening();
        return true;
      }
    } catch (err: any) {
      console.warn('getUserMedia error:', err);
      setMicPermissionDenied(true);
      setIsRequestingPermission(false);
      addToast({
        type: 'error',
        message: 'Microphone permission denied. Please allow microphone access in your browser settings.',
      });
      return false;
    }
    setIsRequestingPermission(false);
    return false;
  };

  // Start speech recognition listening
  const startListening = useCallback(() => {
    if (isMuted) {
      setAssistantState('idle');
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      addToast({
        type: 'error',
        message: 'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.',
      });
      setAssistantState('idle');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        isListeningActive.current = true;
        setAssistantState('listening');
        setUserTranscript('');
        setMicPermissionDenied(false);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setUserTranscript(transcript);

        // If final result, send query
        if (event.results[event.results.length - 1].isFinal) {
          recognition.stop();
          sendVoiceQuery(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          // If silence, re-listen smoothly
          if (isComponentMounted.current && !isMuted) {
            setTimeout(() => {
              if (isComponentMounted.current && !isMuted) startListening();
            }, 600);
          }
        } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setMicPermissionDenied(true);
          setAssistantState('idle');
          addToast({
            type: 'error',
            message: 'Microphone permission blocked. Tap "Enable Microphone" below to grant access.',
          });
        } else {
          setAssistantState('idle');
        }
      };

      recognition.onend = () => {
        isListeningActive.current = false;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Could not start recognition:', err);
      setAssistantState('idle');
    }
  }, [isMuted, addToast, sendVoiceQuery]);

  // Initialize on modal open
  useEffect(() => {
    isComponentMounted.current = true;

    if (isLiveVoiceModalOpen) {
      // Greet user
      const greeting = `Hello! I'm ${selectedCharacter.name}. What's on your mind?`;
      setAiResponseText(greeting);
      speakResponse(greeting, () => {
        startListening();
      });
    }

    return () => {
      isComponentMounted.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isLiveVoiceModalOpen]);

  // Handle character switch
  const handleSelectCharacter = (char: AssistantCharacter) => {
    setSelectedCharacter(char);
    setShowCharacterMenu(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    const msg = `Voice changed to ${char.name}. I am ready.`;
    setAiResponseText(msg);
    speakResponse(msg, () => {
      startListening();
    });
  };

  const toggleMute = () => {
    if (!isMuted) {
      setIsMuted(true);
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      if (recognitionRef.current) recognitionRef.current.abort();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setAssistantState('idle');
    } else {
      setIsMuted(false);
      startListening();
    }
  };

  const handleClose = () => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    if (recognitionRef.current) recognitionRef.current.abort();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsLiveVoiceModalOpen(false);
  };

  if (!isLiveVoiceModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in">
      {/* Background ambient radial glow */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <div
          className={`w-[450px] h-[450px] rounded-full blur-3xl transition-all duration-700 ${
            assistantState === 'speaking'
              ? 'bg-purple-600/30 scale-125'
              : assistantState === 'listening'
              ? 'bg-indigo-600/30 scale-110'
              : assistantState === 'thinking'
              ? 'bg-cyan-600/30 scale-100'
              : 'bg-slate-800/20 scale-90'
          }`}
        />
      </div>

      <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900/95 p-6 sm:p-8 shadow-2xl flex flex-col items-center justify-between min-h-[520px]">
        {/* Top Header: Character Switcher, HD Studio Badge & Close */}
        <div className="w-full flex items-center justify-between relative z-20">
          {/* Character Selector Pill */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCharacterMenu(!showCharacterMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-white shadow-sm transition"
              >
                <span className="text-sm">{selectedCharacter.avatar}</span>
                <span>{selectedCharacter.name}</span>
                <span className="text-[10px] text-indigo-400 capitalize">({selectedCharacter.gender})</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Character Dropdown Menu */}
              {showCharacterMenu && (
                <div className="absolute left-0 top-full mt-2 w-72 rounded-2xl border border-slate-800 bg-slate-950/95 p-2 shadow-2xl z-30 space-y-1 animate-in fade-in">
                  <p className="px-3 py-1 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Select Voice Persona
                  </p>
                  {characters.map((char) => (
                    <button
                      key={char.id}
                      type="button"
                      onClick={() => handleSelectCharacter(char)}
                      className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition ${
                        selectedCharacter.id === char.id
                          ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                          : 'hover:bg-slate-900 text-slate-300'
                      }`}
                    >
                      <span className="text-xl p-1 rounded-lg bg-slate-900">{char.avatar}</span>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-white">{char.name}</span>
                          <span className="text-[10px] text-indigo-400 font-medium capitalize">
                            • {char.gender === 'elder' ? 'Older Male' : char.gender}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{char.title}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* HD Studio Voice Badge */}
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>HD Podcast Audio</span>
            </span>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
            title="End Conversation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Center: Animated Neural Voice Orb */}
        <div className="my-auto flex flex-col items-center justify-center space-y-6">
          <div className="relative flex items-center justify-center">
            {/* Animated Ripples when speaking or listening */}
            {(assistantState === 'speaking' || assistantState === 'listening') && (
              <>
                <div
                  className={`absolute w-44 h-44 rounded-full border-2 animate-ping opacity-25 ${
                    assistantState === 'speaking' ? 'border-purple-400' : 'border-indigo-400'
                  }`}
                />
                <div
                  className={`absolute w-36 h-36 rounded-full border border-dashed animate-spin duration-700 opacity-40 ${
                    assistantState === 'speaking' ? 'border-purple-300' : 'border-indigo-300'
                  }`}
                />
              </>
            )}

            {/* Glowing Core Sphere */}
            <div
              className={`w-28 h-28 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
                assistantState === 'speaking'
                  ? 'bg-gradient-to-tr from-purple-600 via-pink-500 to-indigo-500 scale-110 shadow-purple-500/40'
                  : assistantState === 'listening'
                  ? 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 scale-105 shadow-indigo-500/40'
                  : assistantState === 'thinking'
                  ? 'bg-gradient-to-tr from-cyan-600 to-blue-500 animate-pulse shadow-cyan-500/30'
                  : 'bg-gradient-to-tr from-slate-800 to-slate-700 shadow-slate-900/50'
              }`}
            >
              <span className="text-3xl select-none">{selectedCharacter.avatar}</span>
            </div>
          </div>

          {/* Status Badge & Sound Wave or Permission Prompt */}
          {micPermissionDenied ? (
            <div className="text-center space-y-3 max-w-sm p-4 rounded-2xl border border-rose-500/30 bg-rose-950/40">
              <div className="flex items-center justify-center gap-2 text-rose-300 font-bold text-xs">
                <MicOff className="w-4 h-4 text-rose-400" />
                <span>Microphone Permission Required</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Luna Nova needs microphone access to converse with you. Tap the button below to grant permission, or check your browser address bar.
              </p>
              <button
                type="button"
                onClick={requestMicrophonePermission}
                disabled={isRequestingPermission}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition active:scale-95"
              >
                {isRequestingPermission ? 'Requesting Access...' : 'Enable Microphone Access'}
              </button>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  assistantState === 'speaking'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : assistantState === 'listening'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 animate-pulse'
                    : assistantState === 'thinking'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>
                  {assistantState === 'speaking'
                    ? `${selectedCharacter.name} Speaking...`
                    : assistantState === 'listening'
                    ? 'Listening to you...'
                    : assistantState === 'thinking'
                    ? 'Luna Thinking...'
                    : 'Tap mic to talk'}
                </span>
              </span>

              {/* Live Subtitle Transcript */}
              <div className="max-w-xs min-h-[54px] flex items-center justify-center px-4">
                {userTranscript ? (
                  <p className="text-xs text-indigo-200 italic font-medium">"{userTranscript}"</p>
                ) : aiResponseText ? (
                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                    {aiResponseText}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">Speak naturally, Luna is listening...</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Voice Controls */}
        <div className="w-full pt-4 border-t border-slate-800 flex items-center justify-around z-20">
          {/* Mute/Unmute */}
          <button
            type="button"
            onClick={toggleMute}
            className={`p-3 rounded-2xl border transition ${
              isMuted
                ? 'bg-rose-600/20 border-rose-500/40 text-rose-400'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Central Push-to-Talk / Re-Listen trigger */}
          <button
            type="button"
            onClick={() => {
              if (assistantState === 'listening') {
                if (recognitionRef.current) recognitionRef.current.stop();
              } else {
                startListening();
              }
            }}
            className={`px-6 py-3.5 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-xl transition active:scale-95 ${
              assistantState === 'listening'
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>{assistantState === 'listening' ? 'Done Speaking' : 'Start Talking'}</span>
          </button>

          {/* End Call / Close */}
          <button
            type="button"
            onClick={handleClose}
            className="p-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 transition active:scale-95"
            title="End Voice Conversation"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
