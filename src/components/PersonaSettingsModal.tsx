import React, { useState } from 'react';
import { X, Sparkles, Heart, Plus, Trash2, Check, User, Globe, Server } from 'lucide-react';
import { UserContext, VoiceMode } from '../types';
import { getSavedServerUrl, setSavedServerUrl, isPackagedMobileApp } from '../utils/api';

interface PersonaSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userContext: UserContext;
  onUpdateContext: (context: UserContext) => void;
  mode: VoiceMode;
}

export const PersonaSettingsModal: React.FC<PersonaSettingsModalProps> = ({
  isOpen,
  onClose,
  userContext,
  onUpdateContext,
  mode,
}) => {
  const [userName, setUserName] = useState(userContext.userName);
  const [userNickname, setUserNickname] = useState(userContext.userNickname);
  const [languagePreference, setLanguagePreference] = useState(userContext.languagePreference);
  const [memories, setMemories] = useState<string[]>(userContext.memories || []);
  const [newMemory, setNewMemory] = useState('');
  const [serverUrl, setServerUrl] = useState<string>(() => getSavedServerUrl());

  if (!isOpen) return null;

  const handleAddMemory = () => {
    if (!newMemory.trim()) return;
    setMemories([...memories, newMemory.trim()]);
    setNewMemory('');
  };

  const handleRemoveMemory = (index: number) => {
    setMemories(memories.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    setSavedServerUrl(serverUrl);
    onUpdateContext({
      userName,
      userNickname,
      languagePreference,
      memories,
    });
    onClose();
  };

  const isGf = mode === 'girlfriend';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isGf ? 'bg-rose-500/20 text-rose-300' : 'bg-cyan-500/20 text-cyan-300'}`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">PUJA Voice & Persona Settings</h3>
              <p className="text-xs text-slate-400">ব্যক্তিগত পরিচয় ও স্মৃতি সংরক্ষণ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inputs */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* User Name & Nickname */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                আপনার আসল নাম:
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="যেমন: নোতুন / তানভীর"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-pink-400" />
                পূজা যে নামে ডাকবে (Nickname):
              </label>
              <input
                type="text"
                value={userNickname}
                onChange={(e) => setUserNickname(e.target.value)}
                placeholder="যেমন: জান, বাবু, বন্ধু"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              />
            </div>
          </div>

          {/* Language Preference */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              ভাষার ধরন (Language Style):
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'banglish', label: 'Banglish (স্বাভাবিক মিশ্রণ)' },
                { id: 'bengali', label: 'বাংলা (বিশুদ্ধ চলিত)' },
                { id: 'english', label: 'English & Bengali' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLanguagePreference(opt.id as any)}
                  className={`p-2 rounded-xl text-xs font-medium border text-center transition ${
                    languagePreference === opt.id
                      ? 'bg-rose-500/20 border-rose-500 text-rose-200'
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Relationship Memories */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
              পূজার স্মৃতিতে থাকা তথ্য (Relationship Context & Memories):
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newMemory}
                onChange={(e) => setNewMemory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddMemory()}
                placeholder="যেমন: সফটওয়্যার ইঞ্জিনিয়ার, রাতে দেরি করে ঘুমায়..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              />
              <button
                type="button"
                onClick={handleAddMemory}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>যোগ করুন</span>
              </button>
            </div>

            {/* Memory Tags */}
            <div className="space-y-1.5">
              {memories.map((mem, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs text-slate-300"
                >
                  <span className="font-bengali">{mem}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMemory(idx)}
                    className="text-slate-400 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {memories.length === 0 && (
                <p className="text-[11px] text-slate-500 italic">কোনো বিশেষ স্মৃতি যোগ করা হয়নি।</p>
              )}
            </div>
          </div>

          {/* Backend Server URL (for Android APK / Remote mode) */}
          <div className="pt-2 border-t border-slate-800/80">
            <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span>ব্যাকএন্ড সার্ভার URL {isPackagedMobileApp() ? '(APK Mode)' : '(ঐচ্ছিক)'}:</span>
            </label>
            <input
              type="url"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="https://ais-pre-4e7cvmhzcdceswfr227vvq-38813031509.asia-southeast1.run.app"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              অ্যান্ড্রয়েড APK থেকে ভয়েস ও চ্যাট চালাতে আপনার ডিপ্লয় করা সার্ভার URL ব্যবহার করুন।
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition"
          >
            বাতিল
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-semibold shadow-md active:scale-95 transition"
          >
            <Check className="w-4 h-4" />
            <span>সংরক্ষণ করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};
