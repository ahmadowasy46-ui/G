import React from 'react';
import { useApp } from '../../context/AppContext';
import { ToolItem } from '../../types';
import {
  Wand2,
  Image as ImageIcon,
  Scissors,
  Zap,
  RotateCcw,
  Eye,
  MessageSquare,
  FileText,
  Languages,
  BookOpen,
  Code2,
  Sparkles,
  ArrowRight,
  SunMedium,
  Palette,
} from 'lucide-react';

export const ToolsScreen: React.FC = () => {
  const {
    openImageEditorWith,
    openImageGeneratorWith,
    openChatWithPrompt,
    setCreateMode,
    setCurrentView,
  } = useApp();

  const sampleToolImage =
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';

  const tools: (ToolItem & { iconComponent: React.ReactNode; color: string })[] = [
    {
      id: 'bg-remover',
      name: 'Background Remover',
      category: 'image-edit',
      description: 'Isolate subjects with pixel-perfect transparency in seconds.',
      icon: 'Scissors',
      iconComponent: <Scissors className="w-5 h-5 text-emerald-400" />,
      badge: 'Popular',
      color: 'from-emerald-500/20 to-emerald-950/40 border-emerald-500/30',
      targetView: 'create',
      samplePrompt: 'Remove the entire background cleanly, isolate subject with crisp edges',
    },
    {
      id: 'image-upscaler',
      name: 'Image Enhancer & Upscaler',
      category: 'enhancer',
      description: 'Supercharge low-res photos to crisp 4K with deep texture restoration.',
      icon: 'Zap',
      iconComponent: <Zap className="w-5 h-5 text-amber-400" />,
      badge: '4K Ultra',
      color: 'from-amber-500/20 to-amber-950/40 border-amber-500/30',
      targetView: 'create',
      samplePrompt: 'Upscale to ultra HD 4K, enhance fine skin and texture details, remove noise',
    },
    {
      id: 'photo-restorer',
      name: 'Vintage Photo Restorer',
      category: 'image-edit',
      description: 'Repair scratches, balance faded colors, and remove historical film grain.',
      icon: 'RotateCcw',
      iconComponent: <RotateCcw className="w-5 h-5 text-indigo-400" />,
      color: 'from-indigo-500/20 to-indigo-950/40 border-indigo-500/30',
      targetView: 'create',
      samplePrompt: 'Restore this vintage photograph: repair scratches, colorize, and balance tones',
    },
    {
      id: 'studio-lighting',
      name: 'Studio Lighting Transformer',
      category: 'image-edit',
      description: 'Replace harsh or flat lighting with cinematic dark studio keylights.',
      icon: 'SunMedium',
      iconComponent: <SunMedium className="w-5 h-5 text-orange-400" />,
      color: 'from-orange-500/20 to-orange-950/40 border-orange-500/30',
      targetView: 'create',
      samplePrompt: 'Replace lighting with professional dark minimalist studio lighting and soft highlights',
    },
    {
      id: 'style-transfer',
      name: 'Artistic Style Transfer',
      category: 'image-edit',
      description: 'Turn photos into Cyberpunk, Anime, Oil Paintings, or 3D Render aesthetic.',
      icon: 'Palette',
      iconComponent: <Palette className="w-5 h-5 text-pink-400" />,
      color: 'from-pink-500/20 to-pink-950/40 border-pink-500/30',
      targetView: 'create',
      samplePrompt: 'Apply futuristic cyberpunk neon cyan and magenta rim lighting with reflective ambiance',
    },
    {
      id: 'ai-image-gen',
      name: 'AI Image Generator',
      category: 'image-gen',
      description: 'Generate breathtaking original visuals from simple text descriptions.',
      icon: 'ImageIcon',
      iconComponent: <ImageIcon className="w-5 h-5 text-purple-400" />,
      badge: 'Core',
      color: 'from-purple-500/20 to-purple-950/40 border-purple-500/30',
      targetView: 'create',
      samplePrompt: 'A surreal floating island with crystal waterfalls under a celestial purple nebula',
    },
    {
      id: 'ai-vision',
      name: 'AI Vision & Inspector',
      category: 'vision',
      description: 'Inspect images, identify objects, extract text (OCR), and detect emotions.',
      icon: 'Eye',
      iconComponent: <Eye className="w-5 h-5 text-cyan-400" />,
      color: 'from-cyan-500/20 to-cyan-950/40 border-cyan-500/30',
      targetView: 'chat',
      samplePrompt: 'Please analyze this image: identify key objects, composition, and describe all text.',
    },
    {
      id: 'writing-assistant',
      name: 'Writing & Grammar Assistant',
      category: 'assistants',
      description: 'Draft compelling articles, refine tone, fix syntax, and elevate prose.',
      icon: 'FileText',
      iconComponent: <FileText className="w-5 h-5 text-blue-400" />,
      color: 'from-blue-500/20 to-blue-950/40 border-blue-500/30',
      targetView: 'chat',
      samplePrompt: 'Help me write a persuasive product launch pitch for a modern creative platform.',
    },
    {
      id: 'code-assistant',
      name: 'Full-Stack Code Assistant',
      category: 'assistants',
      description: 'Write, debug, refactor, and explain TypeScript, React, Python, and SQL.',
      icon: 'Code2',
      iconComponent: <Code2 className="w-5 h-5 text-emerald-400" />,
      badge: 'Developer',
      color: 'from-emerald-500/20 to-emerald-950/40 border-emerald-500/30',
      targetView: 'chat',
      samplePrompt: 'Write a TypeScript function that optimizes image canvas processing with web workers.',
    },
    {
      id: 'universal-translator',
      name: 'Universal Translator',
      category: 'assistants',
      description: 'Translate naturally between 95+ languages with cultural nuance preservation.',
      icon: 'Languages',
      iconComponent: <Languages className="w-5 h-5 text-rose-400" />,
      color: 'from-rose-500/20 to-rose-950/40 border-rose-500/30',
      targetView: 'chat',
      samplePrompt: 'Translate this message into Spanish, Japanese, and French with professional tone:',
    },
    {
      id: 'doc-summarizer',
      name: 'Document Summarizer',
      category: 'assistants',
      description: 'Condense lengthy PDFs, reports, and transcripts into bulleted executive takeaways.',
      icon: 'BookOpen',
      iconComponent: <BookOpen className="w-5 h-5 text-teal-400" />,
      color: 'from-teal-500/20 to-teal-950/40 border-teal-500/30',
      targetView: 'chat',
      samplePrompt: 'Provide an executive summary with key takeaways from the attached file.',
    },
  ];

  const handleLaunchTool = (tool: typeof tools[0]) => {
    if (tool.id === 'ai-image-gen') {
      openImageGeneratorWith(tool.samplePrompt || '');
    } else if (tool.targetView === 'create') {
      openImageEditorWith(sampleToolImage, tool.samplePrompt || '');
    } else {
      openChatWithPrompt(tool.samplePrompt || `Let's use the ${tool.name}.`);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 max-w-6xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            AI Tools Hub
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
          Modular, production-ready AI capabilities for creative editing, high-resolution generation,
          vision analysis, and cognitive assistance.
        </p>
      </div>

      {/* Grid of Tools */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <div
            key={tool.id}
            onClick={() => handleLaunchTool(tool)}
            className={`group relative rounded-2xl border bg-gradient-to-br ${tool.color} p-5 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm">
                  {tool.iconComponent}
                </div>
                {tool.badge && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {tool.badge}
                  </span>
                )}
              </div>

              <h3 className="text-sm font-bold text-white mb-1.5 group-hover:text-indigo-300 transition">
                {tool.name}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                {tool.description}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
              <span>Launch Tool</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
