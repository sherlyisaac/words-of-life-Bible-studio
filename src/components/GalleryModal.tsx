import React, { useRef, useState } from 'react';
import {
  X,
  Image as ImageIcon,
  Download,
  Trash2,
  ArrowUpRight,
  FolderHeart,
  Upload,
  Plus,
  Sparkles,
  Check
} from 'lucide-react';
import { CustomUploadedBackground, DesignProject } from '../types';

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  designs: DesignProject[];
  onLoadDesign: (design: DesignProject) => void;
  onDeleteDesign: (id: string) => void;
  onImportDesigns: (designs: DesignProject[]) => void;
  customBackgrounds: CustomUploadedBackground[];
  onSelectCustomBackground: (bg: CustomUploadedBackground) => void;
  onDeleteCustomBackground: (id: string) => void;
  onUploadNewBackground: (file: File) => void;
  currentBackgroundUrl?: string;
}

export const GalleryModal: React.FC<GalleryModalProps> = ({
  isOpen,
  onClose,
  designs,
  onLoadDesign,
  onDeleteDesign,
  onImportDesigns,
  customBackgrounds,
  onSelectCustomBackground,
  onDeleteCustomBackground,
  onUploadNewBackground,
  currentBackgroundUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'designs' | 'backgrounds'>('designs');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bgUploadInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleExportBackup = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(designs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `wordsoflife_gallery_backup_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            onImportDesigns(parsed);
          }
        } catch {
          alert('Invalid backup file format');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleBgFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadNewBackground(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] rounded-3xl bg-slate-900 border border-slate-700/80 p-5 sm:p-7 shadow-2xl text-slate-100 flex flex-col overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header & Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pr-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FolderHeart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Personal Gallery & Assets</span>
              </h3>
              <p className="text-xs text-slate-400">
                Saved Scripture designs and your personal custom background library
              </p>
            </div>
          </div>

          {/* Backup / Export / Import for Designs */}
          {activeTab === 'designs' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition"
                title="Import JSON backup"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Import</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />

              {designs.length > 0 && (
                <button
                  onClick={handleExportBackup}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition"
                  title="Export JSON backup"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Backup</span>
                </button>
              )}
            </div>
          )}

          {/* Upload Button for Backgrounds */}
          {activeTab === 'backgrounds' && (
            <div>
              <button
                onClick={() => bgUploadInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Background</span>
              </button>
              <input
                type="file"
                ref={bgUploadInputRef}
                accept="image/*"
                onChange={handleBgFileSelect}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 mb-4 gap-2">
          <button
            onClick={() => setActiveTab('designs')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'designs'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Saved Verse Designs</span>
            <span className="text-[11px] px-2 py-0.2 rounded-full bg-slate-800 text-purple-200">
              {designs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('backgrounds')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'backgrounds'
                ? 'border-pink-500 text-pink-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>My Custom Backgrounds</span>
            <span className="text-[11px] px-2 py-0.2 rounded-full bg-slate-800 text-pink-200">
              {customBackgrounds.length}
            </span>
          </button>
        </div>

        {/* TAB 1: SAVED DESIGNS */}
        {activeTab === 'designs' && (
          <div className="flex-1 overflow-y-auto pr-1">
            {designs.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-center text-slate-500 mb-4">
                  <ImageIcon className="w-8 h-8 text-purple-400/50" />
                </div>
                <h4 className="text-base font-bold text-slate-200 mb-1">No Saved Designs Yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
                  When you create a beautiful Bible verse art in the studio, click "Save Design" to save it here for later editing, sharing, or downloading.
                </p>
                <button
                  onClick={onClose}
                  className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition"
                >
                  Create First Design
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {designs.map((project) => {
                  const dateStr = new Date(project.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <div
                      key={project.id}
                      className="group relative rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-purple-500/50 p-3 flex flex-col justify-between transition-all hover:shadow-xl hover:shadow-purple-950/30"
                    >
                      {/* Thumbnail Preview */}
                      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 border border-slate-800 mb-3 flex items-center justify-center">
                        {project.thumbnailDataUrl ? (
                          <img
                            src={project.thumbnailDataUrl}
                            alt={project.verse.reference}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="p-4 text-center">
                            <span className="text-xs font-serif text-slate-300 line-clamp-3">
                              "{project.verse.text}"
                            </span>
                          </div>
                        )}

                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-mono text-white/90">
                          {project.aspectRatio}
                        </span>
                      </div>

                      {/* Meta info */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-amber-300 font-cinzel">
                            {project.verse.reference}
                          </span>
                          <span className="text-[10px] text-slate-500">{dateStr}</span>
                        </div>
                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                          "{project.verse.text}"
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5">
                        <button
                          onClick={() => {
                            onLoadDesign(project);
                            onClose();
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 text-xs font-semibold transition"
                        >
                          <span>Open in Studio</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onDeleteDesign(project.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition"
                          title="Delete from Gallery"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY CUSTOM BACKGROUNDS */}
        {activeTab === 'backgrounds' && (
          <div className="flex-1 overflow-y-auto pr-1">
            {customBackgrounds.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-center text-slate-500 mb-4">
                  <Upload className="w-8 h-8 text-pink-400/60" />
                </div>
                <h4 className="text-base font-bold text-slate-200 mb-1">
                  No Custom Backgrounds Uploaded Yet
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
                  Upload your own photos, nature shots, or watercolor artwork. They will be saved permanently here in your gallery and ready to reuse anytime!
                </p>
                <button
                  onClick={() => bgUploadInputRef.current?.click()}
                  className="py-2.5 px-4 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-semibold text-xs flex items-center gap-2 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload Background Now</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {customBackgrounds.map((bg) => {
                  const isCurrent = currentBackgroundUrl === bg.url;
                  const dateStr = new Date(bg.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  });

                  return (
                    <div
                      key={bg.id}
                      className={`group relative rounded-2xl bg-slate-950/60 border p-2 flex flex-col justify-between transition-all hover:shadow-xl ${
                        isCurrent
                          ? 'border-pink-500 ring-2 ring-pink-500/40'
                          : 'border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 border border-slate-800 mb-2">
                        <img
                          src={bg.url}
                          alt={bg.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {isCurrent && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-lg">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <div className="px-1 mb-2">
                        <p className="text-xs font-semibold text-white truncate">{bg.title}</p>
                        <p className="text-[10px] text-slate-400">Added {dateStr}</p>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 px-1">
                        <button
                          onClick={() => {
                            onSelectCustomBackground(bg);
                            onClose();
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pink-600/30 hover:bg-pink-600/50 text-pink-200 text-[11px] font-semibold transition"
                        >
                          <span>Use</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => onDeleteCustomBackground(bg.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition"
                          title="Delete background"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
