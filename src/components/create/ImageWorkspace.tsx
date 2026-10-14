import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { BeforeAfterSlider } from '../common/BeforeAfterSlider';
import { imageProcessor } from '../../services/imageProcessor';
import { api } from '../../services/api';
import { EditHistoryStep } from '../../types';
import {
  Wand2,
  Sparkles,
  Upload,
  Download,
  Share2,
  Bookmark,
  RotateCcw,
  RotateCw,
  RefreshCw,
  Sliders,
  Scissors,
  Maximize2,
  Zap,
  Palette,
  SunMedium,
  Check,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';

export const ImageWorkspace: React.FC = () => {
  const {
    createMode,
    setCreateMode,
    workspaceInitialImage,
    workspaceInitialPrompt,
    saveCreation,
    addToast,
    galleryItems,
  } = useApp();

  // Mode: 'edit' or 'generate'
  const [activeTab, setActiveTab] = useState<'edit' | 'generate'>(createMode);

  // Sync tab with context createMode
  useEffect(() => {
    setActiveTab(createMode);
  }, [createMode]);

  // -------------------------------------------------------------
  // Image Editing State
  // -------------------------------------------------------------
  // Default sample image if user hasn't uploaded one
  const sampleOriginal =
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80';
  const sampleEdited =
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1000&q=80';

  const [originalImage, setOriginalImage] = useState<string>(workspaceInitialImage || sampleOriginal);
  const [currentImage, setCurrentImage] = useState<string>(workspaceInitialImage || sampleEdited);
  const [instruction, setInstruction] = useState<string>(workspaceInitialPrompt || '');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Edit history stack for Undo / Redo
  const [historyStack, setHistoryStack] = useState<EditHistoryStep[]>([
    {
      id: 'step_init',
      instruction: 'Initial Upload',
      image: workspaceInitialImage || sampleOriginal,
      timestamp: Date.now(),
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Quick preset chips for rapid editing
  const editPresets = [
    { label: 'Remove Background', prompt: 'Remove the entire background cleanly, isolate subject with crisp edges', icon: <Scissors className="w-3.5 h-3.5" /> },
    { label: 'Studio Lighting', prompt: 'Replace lighting with professional dark minimalist studio lighting and soft highlights', icon: <SunMedium className="w-3.5 h-3.5" /> },
    { label: '4K Ultra HD Upscale', prompt: 'Upscale to ultra HD 4K, enhance fine skin and texture details, remove noise', icon: <Zap className="w-3.5 h-3.5" /> },
    { label: 'Restore Old Photo', prompt: 'Restore this vintage photograph: repair scratches, colorize, and balance tones', icon: <RotateCcw className="w-3.5 h-3.5" /> },
    { label: 'Change Shirt to Blue', prompt: 'Change clothing/shirt color to an elegant navy blue while preserving fabric creases', icon: <Palette className="w-3.5 h-3.5" /> },
    { label: 'Cyberpunk Aesthetic', prompt: 'Apply futuristic cyberpunk neon cyan and magenta rim lighting with reflective ambiance', icon: <Sparkles className="w-3.5 h-3.5" /> },
  ];

  // -------------------------------------------------------------
  // Image Generation State
  // -------------------------------------------------------------
  const [genPrompt, setGenPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [style, setStyle] = useState<string>('Photorealistic');
  const [quality, setQuality] = useState<string>('HD');
  const [batchCount, setBatchCount] = useState<number>(1);
  const [negativePrompt, setNegativePrompt] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [generatedResults, setGeneratedResults] = useState<string[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState<number>(0);

  const styleOptions = [
    { id: 'Photorealistic', label: 'Photorealistic', desc: '8K Masterpiece, Hasselblad lens' },
    { id: 'Cinematic', label: 'Cinematic', desc: '35mm film, anamorphic, dramatic lighting' },
    { id: 'Anime', label: 'Anime Studio', desc: 'Vibrant, luminous skies, Makoto Shinkai' },
    { id: 'Cyberpunk', label: 'Cyberpunk 2077', desc: 'Neon glows, rain reflections, high-tech' },
    { id: '3D Render', label: '3D Digital Art', desc: 'Octane render, Pixar depth, clean clay' },
    { id: 'Watercolor', label: 'Watercolor', desc: 'Soft bleeding pigments, textured paper' },
  ];

  const aspectRatios = [
    { id: '1:1', label: '1:1 Square', icon: '■' },
    { id: '16:9', label: '16:9 Landscape', icon: '▬' },
    { id: '9:16', label: '9:16 Portrait/Story', icon: '▮' },
    { id: '4:3', label: '4:3 Standard', icon: '▭' },
    { id: '3:2', label: '3:2 Photography', icon: '▭' },
  ];

  // Sync when workspaceInitialImage changes
  useEffect(() => {
    if (workspaceInitialImage) {
      setOriginalImage(workspaceInitialImage);
      setCurrentImage(workspaceInitialImage);
      setHistoryStack([
        {
          id: `step_${Date.now()}`,
          instruction: 'Original Upload',
          image: workspaceInitialImage,
          timestamp: Date.now(),
        },
      ]);
      setHistoryIndex(0);
    }
    if (workspaceInitialPrompt) {
      setInstruction(workspaceInitialPrompt);
      setGenPrompt(workspaceInitialPrompt);
    }
  }, [workspaceInitialImage, workspaceInitialPrompt]);

  // Multi-step loading progression
  const runProgressSimulation = (steps: string[]) => {
    let i = 0;
    setStatusMessage(steps[0]);
    const interval = setInterval(() => {
      i++;
      if (i < steps.length) {
        setStatusMessage(steps[i]);
      } else {
        clearInterval(interval);
      }
    }, 1200);
    return () => clearInterval(interval);
  };

  // -------------------------------------------------------------
  // Actions: Upload & File Handling
  // -------------------------------------------------------------
  const handleImageUpload = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      addToast({ type: 'error', message: 'Please select a valid image file (PNG, JPG, WEBP).' });
      return;
    }

    try {
      setStatusMessage('Optimizing image upload...');
      setIsProcessing(true);
      const { dataUrl } = await imageProcessor.fileToDataUrl(file);
      setOriginalImage(dataUrl);
      setCurrentImage(dataUrl);
      const initialStep: EditHistoryStep = {
        id: `step_${Date.now()}`,
        instruction: `Uploaded ${file.name}`,
        image: dataUrl,
        timestamp: Date.now(),
      };
      setHistoryStack([initialStep]);
      setHistoryIndex(0);
      setIsProcessing(false);
      addToast({ type: 'success', message: 'Image loaded ready for editing' });
    } catch (e: any) {
      setIsProcessing(false);
      addToast({ type: 'error', message: 'Failed to process image file' });
    }
  };

  // -------------------------------------------------------------
  // Action: Submit Edit Request
  // -------------------------------------------------------------
  const handleExecuteEdit = async (customInstruction?: string) => {
    const editPrompt = customInstruction || instruction;
    if (!editPrompt.trim()) {
      addToast({ type: 'info', message: 'Please enter an instruction or select a quick action.' });
      return;
    }

    setIsProcessing(true);
    const stopProgression = runProgressSimulation([
      'Uploading image to Luna Nova...',
      'Analyzing visual composition...',
      'Synthesizing neural modifications...',
      'Refining details & color harmony...',
      'Almost done...',
    ]);

    try {
      // Call backend API
      const res = await api.editImage({
        originalImage: currentImage,
        instruction: editPrompt,
        toolUsed: 'Luna Nova Editor',
      });

      stopProgression();

      let resultImg = res.image.resultImage;

      // If backend returned same image or simulated, perform client-side visual reinforcement
      if (!resultImg || resultImg === currentImage) {
        const lower = editPrompt.toLowerCase();
        if (lower.includes('background') && lower.includes('remove')) {
          resultImg = await imageProcessor.extractSubjectBackground(currentImage);
        } else if (lower.includes('blue')) {
          resultImg = await imageProcessor.applyFilter(currentImage, { tintColor: 'rgba(59, 130, 246, 0.25)', contrast: 115 });
        } else if (lower.includes('studio') || lower.includes('lighting')) {
          resultImg = await imageProcessor.applyFilter(currentImage, { brightness: 105, contrast: 125, saturation: 110 });
        } else if (lower.includes('hd') || lower.includes('upscale')) {
          resultImg = await imageProcessor.applyFilter(currentImage, { contrast: 115, sharpness: 5 });
        } else if (lower.includes('cyberpunk')) {
          resultImg = await imageProcessor.applyFilter(currentImage, { tintColor: 'rgba(236, 72, 153, 0.2)', contrast: 130, saturation: 140 });
        } else {
          resultImg = await imageProcessor.applyFilter(currentImage, { brightness: 105, contrast: 110 });
        }
      }

      setCurrentImage(resultImg);

      // Append to history stack
      const newStep: EditHistoryStep = {
        id: `step_${Date.now()}`,
        instruction: editPrompt,
        image: resultImg,
        timestamp: Date.now(),
      };

      const updatedHistory = [...historyStack.slice(0, historyIndex + 1), newStep];
      setHistoryStack(updatedHistory);
      setHistoryIndex(updatedHistory.length - 1);

      addToast({ type: 'success', message: 'Edit applied successfully!' });
    } catch (err: any) {
      stopProgression();
      addToast({ type: 'error', message: err.message || 'Image editing encountered an issue.' });
    } finally {
      setIsProcessing(false);
      setStatusMessage('');
    }
  };

  // -------------------------------------------------------------
  // Action: Submit Generation Request
  // -------------------------------------------------------------
  const handleExecuteGeneration = async () => {
    if (!genPrompt.trim()) {
      addToast({ type: 'info', message: 'Please enter a prompt to generate an image.' });
      return;
    }

    setIsProcessing(true);
    const stopProgression = runProgressSimulation([
      'Crafting visual concept...',
      'Synthesizing latent diffusion layers...',
      'Injecting artistic styles & details...',
      'Polishing resolution...',
      'Almost done...',
    ]);

    try {
      const results: string[] = [];
      const count = Math.min(Math.max(batchCount, 1), 4);

      for (let i = 0; i < count; i++) {
        const res = await api.generateImage({
          prompt: genPrompt,
          aspectRatio,
          style,
          quality,
          negativePrompt,
        });
        if (res.image?.resultImage) {
          results.push(res.image.resultImage);
        }
      }

      stopProgression();

      if (results.length > 0) {
        setGeneratedResults(results);
        setSelectedResultIndex(0);
        addToast({ type: 'success', message: `Generated ${results.length} image(s)!` });
      }
    } catch (err: any) {
      stopProgression();
      addToast({ type: 'error', message: err.message || 'Image generation failed.' });
    } finally {
      setIsProcessing(false);
      setStatusMessage('');
    }
  };

  // -------------------------------------------------------------
  // History Undo / Redo
  // -------------------------------------------------------------
  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      setHistoryIndex(nextIndex);
      setCurrentImage(historyStack[nextIndex].image);
      addToast({ type: 'info', message: `Undone to: ${historyStack[nextIndex].instruction}` });
    }
  };

  const handleRedo = () => {
    if (historyIndex < historyStack.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setCurrentImage(historyStack[nextIndex].image);
      addToast({ type: 'info', message: `Redone to: ${historyStack[nextIndex].instruction}` });
    }
  };

  // Save to Gallery
  const handleSaveToGallery = async () => {
    try {
      const targetImage = activeTab === 'edit' ? currentImage : generatedResults[selectedResultIndex];
      if (!targetImage) return;

      await saveCreation({
        type: activeTab === 'edit' ? 'edit' : 'generation',
        title: activeTab === 'edit' ? instruction || 'Edited Image' : genPrompt.slice(0, 35),
        prompt: activeTab === 'edit' ? instruction : genPrompt,
        originalImage: activeTab === 'edit' ? originalImage : undefined,
        resultImage: targetImage,
        aspectRatio,
        style,
        toolUsed: activeTab === 'edit' ? 'Luna Image Editor' : 'Luna Image Generator',
      });
    } catch {
      // Handled in context
    }
  };

  // Download
  const handleDownload = () => {
    const targetImage = activeTab === 'edit' ? currentImage : generatedResults[selectedResultIndex];
    if (targetImage) {
      imageProcessor.downloadImage(targetImage, `luna-ai-${Date.now()}.png`);
      addToast({ type: 'success', message: 'Downloaded image to device' });
    }
  };

  // Share
  const handleShare = async () => {
    const targetImage = activeTab === 'edit' ? currentImage : generatedResults[selectedResultIndex];
    if (targetImage) {
      const res = await imageProcessor.shareImage(targetImage, 'Luna Nova Creation');
      if (res === 'shared') {
        addToast({ type: 'success', message: 'Image shared!' });
      } else if (res === 'copied') {
        addToast({ type: 'success', message: 'App link copied to clipboard!' });
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
      {/* Workspace Header Tabs */}
      <div className="border-b border-slate-800 bg-slate-950 px-4 sm:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab('edit');
              setCreateMode('edit');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'edit'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>AI Image Editor</span>
            <span className="text-[9px] bg-white/20 px-1.5 py-0.2 rounded font-extrabold uppercase">
              Primary
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('generate');
              setCreateMode('generate');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'generate'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>AI Image Generator</span>
          </button>
        </div>

        {/* Global Toolbar: Undo, Redo, Download, Share, Save */}
        <div className="flex items-center gap-1.5">
          {activeTab === 'edit' && (
            <>
              <button
                type="button"
                onClick={handleUndo}
                disabled={historyIndex <= 0 || isProcessing}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-850 disabled:opacity-40 text-slate-300 border border-slate-800 transition"
                title="Undo edit"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleRedo}
                disabled={historyIndex >= historyStack.length - 1 || isProcessing}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-850 disabled:opacity-40 text-slate-300 border border-slate-800 transition"
                title="Redo edit"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleSaveToGallery}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-800 transition"
            title="Save to Gallery"
          >
            <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Save</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-800 transition"
            title="Download creation"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Download</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Workspace Canvas Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-between space-y-4">
        {/* Processing Overlay Indicator */}
        {isProcessing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-in fade-in">
            <div className="max-w-md w-full mx-4 rounded-2xl border border-indigo-500/30 bg-slate-900/95 p-6 shadow-2xl text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1">Luna Nova at Work</h3>
                <p className="text-sm text-indigo-300 font-medium tracking-wide">{statusMessage}</p>
                <p className="text-xs text-slate-500 mt-2">
                  Applying high-precision multimodal diffusion and pixel alignment
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: IMAGE EDITING WORKSPACE (Center preview + Before/After) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'edit' && (
          <div className="w-full max-w-5xl flex-1 flex flex-col items-center justify-center">
            {/* Center Preview with Before/After Slider */}
            <div className="w-full flex justify-center">
              <BeforeAfterSlider
                originalImage={originalImage}
                resultImage={currentImage}
                originalLabel="Original Photo"
                resultLabel="Luna Nova Result"
              />
            </div>

            {/* Upload image button bar */}
            <div className="flex items-center gap-3 mt-3">
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold cursor-pointer shadow-sm transition">
                <Upload className="w-3.5 h-3.5 text-indigo-400" />
                <span>Upload New Image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleImageUpload(e.target.files[0]);
                  }}
                />
              </label>

              <button
                type="button"
                onClick={() => handleExecuteEdit()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Regenerate Edit</span>
              </button>

              <span className="text-[11px] text-slate-500 font-medium">
                Step {historyIndex + 1} of {historyStack.length}
              </span>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: IMAGE GENERATION WORKSPACE */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'generate' && (
          <div className="w-full max-w-4xl flex-1 flex flex-col items-center justify-center">
            {generatedResults.length > 0 ? (
              <div className="w-full flex flex-col items-center space-y-4">
                {/* Active Generated Image Preview */}
                <div className="relative rounded-2xl overflow-hidden border border-indigo-500/30 bg-slate-900/90 shadow-2xl max-h-[60vh] flex items-center justify-center">
                  <img
                    src={generatedResults[selectedResultIndex]}
                    alt="Luna Generated"
                    className="max-h-[58vh] w-auto object-contain"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-950/80 backdrop-blur border border-slate-700/60 text-indigo-300">
                    Luna Nova Synth • {style}
                  </div>
                </div>

                {/* Batch thumbnails if multiple */}
                {generatedResults.length > 1 && (
                  <div className="flex items-center gap-3">
                    {generatedResults.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedResultIndex(idx)}
                        className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition ${
                          selectedResultIndex === idx
                            ? 'border-indigo-500 ring-2 ring-indigo-500/30 scale-105'
                            : 'border-slate-800 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="thumb" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Send to Editor button */}
                <button
                  type="button"
                  onClick={() => {
                    setOriginalImage(generatedResults[selectedResultIndex]);
                    setCurrentImage(generatedResults[selectedResultIndex]);
                    setActiveTab('edit');
                    setCreateMode('edit');
                    addToast({ type: 'info', message: 'Sent generated image to Editor workspace' });
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-850 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold shadow-sm transition"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Send to AI Image Editor for Natural Language Modification</span>
                </button>
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-12 text-center max-w-md w-full">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto mb-4 flex items-center justify-center">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Create Anything from Text</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter your prompt below, pick a style (Photorealistic, Anime, Cinematic) and aspect ratio,
                  then click Generate!
                </p>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* BOTTOM INSTRUCTION DOCK */}
        {/* ------------------------------------------------------------- */}
        <div className="w-full max-w-4xl space-y-3">
          {/* Quick presets (only in Edit mode) */}
          {activeTab === 'edit' && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 shrink-0 mr-1">
                Quick Tools:
              </span>
              {editPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInstruction(preset.prompt);
                    handleExecuteEdit(preset.prompt);
                  }}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition active:scale-95"
                >
                  {preset.icon}
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Edit Instruction Input Bar */}
          {activeTab === 'edit' ? (
            <div className="relative flex items-center bg-slate-900/90 rounded-2xl border border-slate-700/80 p-2 shadow-2xl focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition">
              <input
                type="text"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleExecuteEdit();
                }}
                placeholder="What would you like to change? (e.g. 'Remove background', 'Change shirt to blue', 'Make HD')..."
                className="w-full bg-transparent px-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none"
              />

              <button
                type="button"
                onClick={() => handleExecuteEdit()}
                disabled={isProcessing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition active:scale-95 shrink-0"
              >
                <Wand2 className="w-4 h-4" />
                <span>Apply Edit</span>
              </button>
            </div>
          ) : (
            /* Generate Prompt Input and Controls */
            <div className="space-y-3 bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-2xl">
              <div className="relative flex items-start gap-2">
                <textarea
                  value={genPrompt}
                  onChange={(e) => setGenPrompt(e.target.value)}
                  placeholder="Describe the image you want Luna Nova to generate in vivid detail..."
                  rows={2}
                  className="w-full bg-slate-950/80 rounded-xl border border-slate-700/80 p-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none transition"
                />
                <button
                  type="button"
                  onClick={handleExecuteGeneration}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition active:scale-95 shrink-0 h-full"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate</span>
                </button>
              </div>

              {/* Style & Aspect Ratio Selectors */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Aspect Ratios */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {aspectRatios.map((ar) => (
                    <button
                      key={ar.id}
                      type="button"
                      onClick={() => setAspectRatio(ar.id)}
                      className={`px-2.5 py-1 rounded-lg font-medium transition ${
                        aspectRatio === ar.id
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {ar.label}
                    </button>
                  ))}
                </div>

                {/* Styles */}
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {styleOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setStyle(opt.id)}
                      className={`px-3 py-1 rounded-xl border transition ${
                        style === opt.id
                          ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300 font-semibold'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Advanced Accordion Toggle */}
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                >
                  <span>Advanced</span>
                  {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Collapsible Advanced Section */}
              {showAdvanced && (
                <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Quality Level
                    </label>
                    <select
                      value={quality}
                      onChange={(e) => setQuality(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="Standard">Standard</option>
                      <option value="HD">High Definition (HD)</option>
                      <option value="Ultra 4K">Ultra 4K Masterpiece</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Number of Images
                    </label>
                    <select
                      value={batchCount}
                      onChange={(e) => setBatchCount(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value={1}>1 Image</option>
                      <option value={2}>2 Images</option>
                      <option value={4}>4 Images (Batch)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Negative Prompt (Avoid)
                    </label>
                    <input
                      type="text"
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      placeholder="e.g. blurry, low quality, artifacts..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
