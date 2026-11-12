import React, { useState, useEffect } from 'react';
import { 
  PhoneCall, 
  Volume2, 
  MessageSquare, 
  Settings, 
  Heart, 
  Briefcase, 
  Sparkles, 
  Zap,
  Info,
  ShieldCheck,
  Download
} from 'lucide-react';
import { VoiceMode, UserContext } from './types';
import { LiveVoiceCall } from './components/LiveVoiceCall';
import { TtsStudio } from './components/TtsStudio';
import { ConversationView } from './components/ConversationView';
import { PersonaSettingsModal } from './components/PersonaSettingsModal';
import { DownloadGuideModal } from './components/DownloadGuideModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'live' | 'tts' | 'chat'>('live');
  const [mode, setMode] = useState<VoiceMode>('girlfriend');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [lastAudioLatency, setLastAudioLatency] = useState<number | undefined>(undefined);

  // Persistent user context & relationship memory
  const [userContext, setUserContext] = useState<UserContext>(() => {
    const saved = localStorage.getItem('puja_user_context');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return {
      userName: 'বন্ধু',
      userNickname: 'জান',
      languagePreference: 'banglish',
      memories: [
        'কাজের চাপে প্রায়ই ব্যস্ত থাকে',
        'বৃষ্টির সন্ধ্যায় এক কাপ চা খুব পছন্দ করে',
        'মিষ্টি ও মায়াবী কথায় মন ভালো হয়ে যায়',
      ],
    };
  });

  useEffect(() => {
    localStorage.setItem('puja_user_context', JSON.stringify(userContext));
  }, [userContext]);

  const isGf = mode === 'girlfriend';

  return (
    <div className={`min-h-screen transition-colors duration-700 ${
      isGf 
        ? 'bg-gradient-to-b from-slate-950 via-[#180a14] to-slate-950 text-slate-100' 
        : 'bg-gradient-to-b from-slate-950 via-[#071324] to-slate-950 text-slate-100'
    }`}>
      {/* Background ambient decorative glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div 
          className={`absolute top-[-15%] left-[20%] w-[500px] h-[500px] rounded-full blur-[140px] opacity-25 transition-all duration-1000 ${
            isGf ? 'bg-rose-500' : 'bg-cyan-500'
          }`}
        />
        <div 
          className={`absolute bottom-[-10%] right-[15%] w-[450px] h-[450px] rounded-full blur-[130px] opacity-20 transition-all duration-1000 ${
            isGf ? 'bg-pink-600' : 'bg-indigo-600'
          }`}
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navigation Bar */}
        <header className="border-b border-slate-800/80 backdrop-blur-xl bg-slate-950/40 sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            {/* Logo & Voice Identity */}
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-105 ${
                isGf 
                  ? 'bg-gradient-to-br from-rose-400 to-pink-600 text-white shadow-rose-950/50' 
                  : 'bg-gradient-to-br from-cyan-400 to-indigo-600 text-white shadow-cyan-950/50'
              }`}>
                {isGf ? <Heart className="w-5 h-5 fill-white" /> : <Sparkles className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                    <span>PUJA</span>
                    <span className="font-bengali font-normal text-slate-300">(পূজা)</span>
                  </h1>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                    isGf
                      ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                      : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
                  }`}>
                    {isGf ? '💖 গার্লফ্রেন্ড মোড' : '💼 নরমাল মোড'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Gemini 3.8 Flash TTS &amp; Gemini 3.8 Live • Bengali &amp; English
                </p>
              </div>
            </div>

            {/* Mode Switcher & Personalization Button */}
            <div className="flex items-center gap-2.5">
              {/* Quick Mode Toggle */}
              <div className="hidden sm:flex items-center p-1 bg-slate-900/90 border border-slate-800 rounded-2xl">
                <button
                  onClick={() => setMode('girlfriend')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium transition ${
                    isGf 
                      ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isGf ? 'fill-white' : ''}`} />
                  <span>Girlfriend Mode</span>
                </button>
                <button
                  onClick={() => setMode('normal')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium transition ${
                    !isGf 
                      ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Normal Mode</span>
                </button>
              </div>

              {/* Download Guide Button */}
              <button
                onClick={() => setIsDownloadModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition"
                title="ফাইল ডাউনলোড গাইড"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ডাউনলোড</span>
              </button>

              {/* Persona Settings */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition"
                title="Persona & Memory Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="max-w-6xl mx-auto px-4 flex items-center gap-1 overflow-x-auto no-scrollbar">
            {[
              { id: 'live', label: 'লাইভ ভয়েস কল (Live 3.8)', icon: PhoneCall },
              { id: 'tts', label: 'ভয়েস স্টুডিও (Flash TTS)', icon: Volume2 },
              { id: 'chat', label: 'কথোপকথন (Chat & Audio)', icon: MessageSquare },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                    isActive
                      ? isGf
                        ? 'border-rose-500 text-rose-300 bg-rose-500/5'
                        : 'border-cyan-400 text-cyan-300 bg-cyan-500/5'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
          {activeTab === 'live' && (
            <LiveVoiceCall
              mode={mode}
              userContext={userContext}
              onModeToggle={(newMode) => setMode(newMode)}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          )}

          {activeTab === 'tts' && (
            <TtsStudio
              mode={mode}
              onAudioGenerated={(lat) => setLastAudioLatency(lat)}
            />
          )}

          {activeTab === 'chat' && (
            <ConversationView
              mode={mode}
              userContext={userContext}
            />
          )}
        </main>

        {/* Footer Specification & Latency Guarantee */}
        <footer className="border-t border-slate-900/80 bg-slate-950/60 py-4 text-center text-xs text-slate-500">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Target Latency: <strong className="text-slate-300">&lt;200ms</strong></span>
              <span className="text-slate-600">•</span>
              <span>Consistent Voice Persona: <strong className="text-slate-300">PUJA (Kore Bengali)</strong></span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span>Primary Model: <strong>Gemini 3.8 Flash TTS</strong></span>
              <span>•</span>
              <span>Live Model: <strong>Gemini 3.8 Live</strong></span>
            </div>
          </div>
        </footer>
      </div>

      {/* Settings Modal */}
      <PersonaSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userContext={userContext}
        onUpdateContext={(newCtx) => setUserContext(newCtx)}
        mode={mode}
      />
      {/* Download Guide Modal */}
      <DownloadGuideModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        mode={mode}
      />
    </div>
  );
}
