import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GalleryItem } from '../../types';
import { BeforeAfterSlider } from '../common/BeforeAfterSlider';
import { imageProcessor } from '../../services/imageProcessor';
import {
  Image as ImageIcon,
  Download,
  Share2,
  Trash2,
  Wand2,
  X,
  Filter,
  Calendar,
  Sparkles,
  Split,
  Eye,
} from 'lucide-react';

export const GalleryScreen: React.FC = () => {
  const { galleryItems, deleteCreation, openImageEditorWith, addToast } = useApp();
  const [filterType, setFilterType] = useState<'all' | 'edit' | 'generation'>('all');
  const [inspectItem, setInspectItem] = useState<GalleryItem | null>(null);

  const filtered = galleryItems.filter((item) => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  const handleDownload = (item: GalleryItem) => {
    imageProcessor.downloadImage(item.resultImage, `luna-${item.type}-${item.id}.png`);
    addToast({ type: 'success', message: 'Downloaded creation to device' });
  };

  const handleShare = async (item: GalleryItem) => {
    const res = await imageProcessor.shareImage(item.resultImage, item.title);
    if (res === 'shared') {
      addToast({ type: 'success', message: 'Creation shared!' });
    } else if (res === 'copied') {
      addToast({ type: 'success', message: 'Creation link copied to clipboard!' });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this item from your library?')) {
      await deleteCreation(id);
      if (inspectItem?.id === id) {
        setInspectItem(null);
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 max-w-6xl mx-auto space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Image Gallery</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            All your generated visuals, natural-language photo edits, and neural restorations.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              filterType === 'all'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({galleryItems.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('edit')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              filterType === 'edit'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Edits ({galleryItems.filter((i) => i.type === 'edit').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('generation')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              filterType === 'generation'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Generations ({galleryItems.filter((i) => i.type === 'generation').length})
          </button>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400">
          <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-30 text-indigo-400" />
          <h3 className="text-base font-bold text-white mb-1">No images found</h3>
          <p className="text-xs text-slate-400">
            {filterType === 'all'
              ? 'Start creating or editing in the Image Studio.'
              : `No items matching category "${filterType}".`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/70 shadow-lg hover:border-indigo-500/40 transition-all duration-200 flex flex-col justify-between"
            >
              {/* Image Thumbnail */}
              <div
                onClick={() => setInspectItem(item)}
                className="relative aspect-square w-full overflow-hidden bg-slate-950 cursor-pointer"
              >
                <img
                  src={item.resultImage}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Badges */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 text-[10px] uppercase font-bold rounded-md bg-slate-950/80 backdrop-blur text-slate-200 border border-slate-700/60">
                    {item.type}
                  </span>
                  {item.originalImage && (
                    <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase font-bold rounded-md bg-indigo-950/80 backdrop-blur text-indigo-300 border border-indigo-700/60">
                      <Split className="w-3 h-3" />
                      <span>Before/After</span>
                    </span>
                  )}
                </div>

                {/* Inspect Overlay hint */}
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="px-3 py-1.5 rounded-lg bg-indigo-600/90 text-white text-xs font-semibold backdrop-blur shadow flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </span>
                </div>
              </div>

              {/* Card Meta & Toolbar */}
              <div className="p-3.5 flex flex-col justify-between flex-1">
                <div>
                  <h4 className="text-xs font-bold text-white truncate mb-1">{item.title}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mb-2">{item.prompt}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="text-[10px]">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openImageEditorWith(item.resultImage, item.prompt)}
                      className="p-1.5 hover:text-indigo-400 rounded-md transition"
                      title="Open in Image Editor"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownload(item)}
                      className="p-1.5 hover:text-emerald-400 rounded-md transition"
                      title="Download image"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShare(item)}
                      className="p-1.5 hover:text-cyan-400 rounded-md transition"
                      title="Share image"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 hover:text-rose-400 rounded-md transition"
                      title="Delete creation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Inspector Modal */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-4xl max-h-[90vh] rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">{inspectItem.title}</h3>
                <p className="text-xs text-slate-400">{inspectItem.prompt}</p>
              </div>
              <button
                onClick={() => setInspectItem(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content: If Before/After available, show slider, otherwise full preview */}
            <div className="flex-1 overflow-y-auto py-4 flex items-center justify-center">
              {inspectItem.originalImage ? (
                <BeforeAfterSlider
                  originalImage={inspectItem.originalImage}
                  resultImage={inspectItem.resultImage}
                />
              ) : (
                <img
                  src={inspectItem.resultImage}
                  alt={inspectItem.title}
                  className="max-h-[60vh] w-auto object-contain rounded-2xl border border-slate-800 shadow-xl"
                />
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Created: {new Date(inspectItem.createdAt).toLocaleString()}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    openImageEditorWith(inspectItem.resultImage, inspectItem.prompt);
                    setInspectItem(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Modify in Editor</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(inspectItem)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleShare(inspectItem)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
