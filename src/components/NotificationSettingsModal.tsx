import React, { useState, useEffect } from 'react';
import { X, Bell, Clock, CheckCircle2, AlertCircle, Sparkles, Send } from 'lucide-react';
import { NotificationSchedule, Verse } from '../types';
import {
  hasNotificationPermission,
  requestNotificationPermission,
  sendVersePushNotification,
  getTodayVerse,
} from '../utils/notifications';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: NotificationSchedule;
  onSaveSchedule: (schedule: NotificationSchedule) => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  schedule,
  onSaveSchedule,
}) => {
  const [enabled, setEnabled] = useState(schedule.enabled);
  const [time, setTime] = useState(schedule.time || '08:00');
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [testSent, setTestSent] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    } else {
      setPermission('unsupported');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggle = async (newVal: boolean) => {
    if (newVal) {
      // If turning on, check or request permission
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission !== 'granted') {
          const res = await requestNotificationPermission();
          setPermission(res);
          if (res !== 'granted') {
            setStatusMessage('Permission was not granted. Please enable notifications in your browser settings.');
            setEnabled(false);
            return;
          }
        }
      }
    }
    setEnabled(newVal);
    onSaveSchedule({ enabled: newVal, time });
  };

  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
    if (enabled) {
      onSaveSchedule({ enabled, time: newTime });
    }
  };

  const handleSendTestNotification = async () => {
    const todayVerse = getTodayVerse();
    if (permission !== 'granted') {
      const res = await requestNotificationPermission();
      setPermission(res);
      if (res !== 'granted') {
        setStatusMessage('Please grant notification permission in your browser.');
        return;
      }
    }

    const success = await sendVersePushNotification(
      todayVerse,
      '🌟 Daily Scripture Reminder (Test)'
    );

    if (success) {
      setTestSent(true);
      setStatusMessage('Test notification sent to your device! Check your notification center.');
      setTimeout(() => setTestSent(false), 4000);
    } else {
      setStatusMessage('Could not trigger notification. Ensure browser notifications are enabled.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/80 p-6 sm:p-7 shadow-2xl text-slate-100 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Daily Verse Push Reminders</h3>
            <p className="text-xs text-slate-400">
              Receive uplifting Scripture delivered to your device
            </p>
          </div>
        </div>

        {/* Status banner */}
        {permission === 'unsupported' ? (
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/40 flex items-center gap-2 text-xs text-amber-300 mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Web Push notifications are not supported in this browser.</span>
          </div>
        ) : permission === 'denied' ? (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/40 flex items-center gap-2 text-xs text-red-300 mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Notifications are blocked. Please enable them in your browser site settings.</span>
          </div>
        ) : null}

        {statusMessage && (
          <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/40 flex items-center gap-2 text-xs text-purple-200 mb-4">
            <Sparkles className="w-4 h-4 flex-shrink-0 text-purple-400" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Switch Card */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4 mb-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-white block">
                Enable Daily Scripture Push
              </span>
              <span className="text-xs text-slate-400">
                A fresh verse every morning or evening
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => handleToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Time Picker */}
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-medium text-slate-300">Reminder Time:</span>
            </div>
            <input
              type="time"
              value={time}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-purple-500 font-mono"
            />
          </div>
        </div>

        {/* Live Test Push Trigger */}
        <button
          onClick={handleSendTestNotification}
          className="w-full py-2.5 px-3 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-center gap-2 transition active:scale-98 mb-4"
        >
          {testSent ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300">Push Notification Sent!</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5 text-purple-400" />
              <span>Test Push Notification Now</span>
            </>
          )}
        </button>

        <p className="text-[11px] text-slate-500 text-center leading-relaxed">
          Daily notifications work seamlessly whether the app is open or installed as a PWA on your home screen.
        </p>
      </div>
    </div>
  );
};
