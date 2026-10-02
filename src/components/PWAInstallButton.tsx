import React, { useState } from 'react';
import { Download, Share, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-950/40 transition active:scale-95"
        title="Install app on your device"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-500/40 bg-purple-900/30 hover:bg-purple-900/50 text-purple-200 text-xs font-medium transition active:scale-95"
        >
          <Smartphone className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">Add to iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100 relative">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                <Share className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-white mb-2">Install on iPhone / iPad</h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                Enjoy a full-screen, native experience on your iOS device:
              </p>

              <ol className="text-sm text-slate-300 space-y-3 mb-6 list-decimal list-inside bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                <li>Tap the <span className="font-semibold text-purple-300">Share</span> button in Safari toolbar.</li>
                <li>Scroll down and tap <span className="font-semibold text-purple-300">Add to Home Screen</span>.</li>
                <li>Tap <span className="font-semibold text-purple-300">Add</span> in the top right corner.</li>
              </ol>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
