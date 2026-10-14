import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Scissors,
  Zap,
  RotateCcw,
  SunMedium,
  Palette,
  Image as ImageIcon,
  Eye,
  FileText,
  Code2,
  Languages,
  BookOpen,
  Sparkles,
  Radio,
  X,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface ToolsDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ToolsDrawerModal: React.FC<ToolsDrawerModalProps> = ({ isOpen, onClose }) => {
  const {
    openImageEditorWith,
    openImageGeneratorWith,
    openChatWithPrompt,
    openLiveVoiceAssistant,
    setCreateMode,
    setCurrentView,
  } = useApp();

  if (!isOpen) return null;

  const sampleToolImage =
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';

  const toolCategories = [
    {
      category: 'Image Editing & Generation',
      tools: [
        {
          id: 'bg-remover',
          name: 'Background Remover',
          description: 'Isolate subjects with pixel-accurate transparent PNG cuts',
          icon: <Scissors className="w-5 h-5 text-emerald-400" />,
          badge: 'Popular',
          action: () => {
            setCreateMode('edit');
            openImageEditorWith(sampleToolImage, 'Remove the entire background cleanly, isolate subject with crisp edges');
            onClose();
          },
        },
        {
          id: 'image-upscaler',
          name: 'Image Enhancer & 4K Upscaler',
          description: 'Supercharge low-res photos to crisp 4K with deep texture restoration',
          icon: <Zap className="w-5 h-5 text-amber-400" />,
          badge: '4K Ultra',
          action: () => {
            setCreateMode('edit');
            openImageEditorWith(sampleToolImage, 'Upscale to ultra HD 4K, enhance fine skin and texture details, remove noise');
            onClose();
          },
        },
        {
          id: 'photo-restorer',
          name: 'Vintage Photo Restorer',
          description: 'Repair scratches, balance faded colors, and remove historical grain',
          icon: <RotateCcw className="w-5 h-5 text-indigo-400" />,
          action: () => {
            setCreateMode('edit');
            openImageEditorWith(sampleToolImage, 'Restore this vintage photograph: repair scratches, colorize, and balance tones');
            onClose();
          },
        },
        {
          id: 'studio-lighting',
          name: 'Studio Lighting Transformer',
          description: 'Apply cinematic dark studio keylights & soft highlights',
          icon: <SunMedium className="w-5 h-5 text-orange-400" />,
          action: () => {
            setCreateMode('edit');
            openImageEditorWith(sampleToolImage, 'Replace lighting with professional dark minimalist studio lighting');
            onClose();
          },
        },
        {
          id: 'style-transfer',
          name: 'Artistic Style Transfer',
          description: 'Turn photos into Cyberpunk, Anime, Oil Painting, or 3D Render',
          icon: <Palette className="w-5 h-5 text-pink-400" />,
          action: () => {
            setCreateMode('edit');
            openImageEditorWith(sampleToolImage, 'Apply futuristic cyberpunk neon cyan and magenta rim lighting');
            onClose();
          },
        },
        {
          id: 'ai-image-gen',
          name: 'AI Image Generator',
          description: 'Generate breathtaking original visuals from simple text descriptions',
          icon: <ImageIcon className="w-5 h-5 text-purple-400" />,
          badge: 'Core',
          action: () => {
            setCreateMode('generate');
            openImageGeneratorWith('A surreal floating island with crystal waterfalls under a celestial purple nebula');
            onClose();
          },
        },
      ],
    },
    {
      category: 'Voice & Intelligent Assistants',
      tools: [
        {
          id: 'live-voice',
          name: 'Live Voice Assistant',
          description: 'Continuous hands-free conversation with HD podcast-quality girl voice',
          icon: <Radio className="w-5 h-5 text-rose-400 animate-pulse" />,
          badge: 'HD Studio',
          action: () => {
            openLiveVoiceAssistant();
            onClose();
          },
        },
        {
          id: 'ai-vision',
          name: 'AI Vision & Inspector',
          description: 'Inspect images, identify objects, extract text (OCR), analyze colors',
          icon: <Eye className="w-5 h-5 text-cyan-400" />,
          action: () => {
            openChatWithPrompt('Please analyze this image: identify key objects, composition, and describe all text.');
            onClose();
          },
        },
        {
          id: 'code-assistant',
          name: 'Full-Stack Code Assistant',
          description: 'Write, debug, refactor, and explain TypeScript, React, Python, and SQL',
          icon: <Code2 className="w-5 h-5 text-emerald-400" />,
          action: () => {
            openChatWithPrompt('Write a clean TypeScript solution with performance optimizations.');
            onClose();
          },
        },
        {
          id: 'writing-assistant',
          name: 'Writing & Grammar Assistant',
          description: 'Draft compelling articles, refine tone, fix syntax, and elevate prose',
          icon: <FileText className="w-5 h-5 text-blue-400" />,
          action: () => {
            openChatWithPrompt('Help me write a persuasive product launch pitch for a modern platform.');
            onClose();
          },
        },
        {
          id: 'translator',
          name: 'Universal Translator',
          description: 'Accurate multi-language translation preserving tone and context',
          icon: <Languages className="w-5 h-5 text-yellow-400" />,
          action: () => {
            openChatWithPrompt('Translate the following into fluent conversational Spanish, French, and Urdu:');
            onClose();
          },
        },
        {
          id: 'summarizer',
          name: 'Smart Document Summarizer',
          description: 'Condense long articles and documents into key takeaways',
          icon: <BookOpen className="w-5 h-5 text-teal-400" />,
          action: () => {
            openChatWithPrompt('Summarize the main insights, action points, and key metrics from this text:');
            onClose();
          },
        },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-start">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Container sliding from top-left */}
      <div className="relative z-50 w-full max-w-lg max-h-[92vh] mt-2 ml-2 sm:ml-4 rounded-3xl border border-slate-800 bg-slate-950/95 shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-200">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">Luna Nova Tools</h2>
              <p className="text-[11px] text-slate-400">Select any tool to launch directly</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tools List by Category */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {toolCategories.map((cat, cIdx) => (
            <div key={cIdx} className="space-y-2">
              <p className="px-2 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                {cat.category}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {cat.tools.map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={tool.action}
                    className="flex items-start gap-3 p-3 rounded-2xl border border-slate-800/80 bg-slate-900/40 hover:bg-slate-900 hover:border-indigo-500/40 text-left transition group active:scale-[0.98]"
                  >
                    <div className="p-2 rounded-xl bg-slate-800/80 group-hover:bg-slate-800 shrink-0 border border-slate-700/50">
                      {tool.icon}
                    </div>
                    <div className="overflow-hidden min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white group-hover:text-indigo-300 transition truncate">
                          {tool.name}
                        </span>
                        {tool.badge && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                            {tool.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                        {tool.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Drawer Footer with View All */}
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-900/50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setCurrentView('tools');
              onClose();
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
          >
            <span>Open Full AI Tools Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <span className="text-[10px] text-slate-500">12 AI Tools Available</span>
        </div>
      </div>
    </div>
  );
};
