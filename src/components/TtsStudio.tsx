import React, { useState, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Download, 
  Sparkles, 
  Zap, 
  Volume2, 
  RefreshCw, 
  Heart, 
  Send, 
  MessageCircleHeart,
  Sliders,
  CheckCircle2,
  Clock,
  FileAudio
} from 'lucide-react';
import { VoiceMode, PresetPhrase } from '../types';
import { PRESET_PHRASES } from '../data/presets';
import { getApiUrl } from '../utils/api';

interface TtsStudioProps {
  mode: VoiceMode;
  onAudioGenerated?: (durationMs: number) => void;
}

export const TtsStudio: React.FC<TtsStudioProps> = ({ mode, onAudioGenerated }) => {
  const [inputText, setInputText] = useState<string>(
    mode === 'girlfriend'
      ? 'শোনো না জান... তুমি ঠিকমতো খেয়েছো তো? নাকি কাজের চাপে আবার ভুলে গেছো? <laugh>'
      : 'নমস্কার! আমি পূজা। আজকের আপনার কাজ এবং পরিকল্পনায় কীভাবে সাহায্য করতে পারি?'
  );
  const [selectedEmotion, setSelectedEmotion] = useState<string>(
    mode === 'girlfriend' ? 'Affectionate & sweet' : 'Clear & professional'
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isGf = mode === 'girlfriend';

  const girlfriendEmotions = [
    { label: 'মিষ্টি ও আদুরে', value: 'Affectionate, gentle and very sweet' },
    { label: 'প্রেমময় ফিসফিস', value: 'Soft, loving whisper with intimate tenderness' },
    { label: 'হাসিখুশি ও খুনসুটি', value: 'Playful, teasing and cheerful with soft laughs' },
    { label: 'শান্ত ও আশ্বস্তকারী', value: 'Comforting, soothing and deeply caring' },
  ];

  const normalEmotions = [
    { label: 'স্পষ্ট ও প্রফেশনাল', value: 'Clear, articulate and professional' },
    { label: 'বন্ধুত্বপূর্ণ ও আন্তরিক', value: 'Warm, approachable and polite' },
    { label: 'ধীর ও তথ্যবহুল', value: 'Calm, steady and informative' },
  ];

  const currentEmotions = isGf ? girlfriendEmotions : normalEmotions;

  const insertTag = (tag: string) => {
    setInputText((prev) => `${prev} ${tag} `);
  };

  const handleGenerateTTS = async (textToUse?: string) => {
    const text = textToUse || inputText;
    if (!text.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);
    const start = Date.now();

    try {
      const response = await fetch(getApiUrl('/api/tts/generate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          mode,
          emotion: selectedEmotion,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'TTS generation failed');
      }

      const audioUrl = `data:audio/wav;base64,${data.audio}`;
      setCurrentAudioUrl(audioUrl);
      setLatencyMs(data.latencyMs || (Date.now() - start));

      if (onAudioGenerated) {
        onAudioGenerated(data.latencyMs || (Date.now() - start));
      }

      // Auto play audio
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play().then(() => setIsPlaying(true)).catch((e) => console.log('Autoplay blocked:', e));
      }
    } catch (err: any) {
      console.error('TTS error:', err);
      setErrorMsg(err.message || 'Failed to synthesize voice.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentAudioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const filteredPresets = PRESET_PHRASES.filter((p) => p.mode === mode);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 p-4">
      {/* Studio Card */}
      <div className={`p-6 rounded-3xl border backdrop-blur-xl transition-all shadow-xl ${
        isGf 
          ? 'bg-rose-950/20 border-rose-500/25 shadow-rose-950/20' 
          : 'bg-slate-900/50 border-cyan-500/25 shadow-cyan-950/20'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isGf ? 'bg-rose-500/20 text-rose-300' : 'bg-cyan-500/20 text-cyan-300'}`}>
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Gemini 3.8 Flash TTS Voice Studio</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase border ${
                  isGf ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                }`}>
                  {isGf ? 'Kore Voice • GF Style' : 'Kore Voice • Professional'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Primary voice generation model with natural feminine Bengali intonation.
              </p>
            </div>
          </div>

          {/* Sub-200ms Latency Badge */}
          {latencyMs !== null && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs font-mono">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-slate-300">TTFB:</span>
              <span className="font-bold text-emerald-400">{latencyMs}ms</span>
            </div>
          )}
        </div>

        {/* Text Input Area */}
        <div className="relative mb-4">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={3}
            placeholder={isGf ? 'পূজার কণ্ঠে মিষ্টি কোনো কথা লিখুন...' : 'Write any Bengali or English text to speak...'}
            className="w-full p-4 rounded-2xl bg-slate-900/80 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm font-bengali leading-relaxed focus:outline-none focus:ring-2 focus:ring-rose-500/50 resize-none"
          />

          {/* Quick Vocal Burst Tags (Special feature of gemini-3.8-flash-tts) */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[11px] text-slate-400 mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Vocal Bursts:
            </span>
            {[
              { tag: '<laugh>', label: '😊 <laugh>' },
              { tag: '<breath>', label: '💨 <breath>' },
              { tag: '<gasp>', label: '😮 <gasp>' },
              { tag: '|mhm|', label: '💭 |mhm|' },
              { tag: '|yeah|', label: '✨ |yeah|' },
            ].map((v) => (
              <button
                key={v.tag}
                type="button"
                onClick={() => insertTag(v.tag)}
                className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 transition"
                title="Add emotional vocal inflection"
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Style & Emotion Selector */}
        <div className="mb-5">
          <label className="text-xs font-medium text-slate-400 mb-2 block flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" />
            Speaking Style & Mood:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {currentEmotions.map((em) => (
              <button
                key={em.value}
                type="button"
                onClick={() => setSelectedEmotion(em.value)}
                className={`p-2.5 rounded-xl text-xs font-bengali text-left transition border ${
                  selectedEmotion === em.value
                    ? isGf
                      ? 'bg-rose-500/20 border-rose-500 text-rose-200 font-semibold shadow-sm'
                      : 'bg-cyan-500/20 border-cyan-500 text-cyan-200 font-semibold shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {em.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions & Playback Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleGenerateTTS()}
              disabled={isLoading || !inputText.trim()}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-xs transition active:scale-95 disabled:opacity-50 ${
                isGf
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-md shadow-rose-950/40'
                  : 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-700 hover:to-indigo-700 text-white shadow-md shadow-cyan-950/40'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>ভয়েস তৈরি হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>ভয়েস শুনুন (Gemini 3.8 Flash TTS)</span>
                </>
              )}
            </button>

            {currentAudioUrl && (
              <button
                onClick={togglePlay}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                title={isPlaying ? 'Pause' : 'Replay'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            )}
          </div>

          {currentAudioUrl && (
            <div className="flex items-center gap-2">
              <a
                href={currentAudioUrl}
                download={`puja-voice-${Date.now()}.wav`}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold text-xs border border-emerald-500/40 shadow-sm transition active:scale-95"
                title="Download 24kHz WAV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ডাউনলোড WAV</span>
              </a>
            </div>
          )}
        </div>

        {/* Dedicated Prominent Audio Ready Card with Quick Download */}
        {currentAudioUrl && (
          <div className="mt-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                <FileAudio className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white font-bengali flex items-center gap-1.5">
                  <span>অডিও ফাইল ডাউনলোড করার জন্য প্রস্তুত!</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-mono">24kHz WAV</span>
                </div>
                <p className="text-[11px] text-slate-300 font-bengali">
                  আপনার ফোনে বা পিসিতে অফলাইনে শুনতে এখনই সেভ করুন
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={togglePlay}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 text-pink-400" /> : <Play className="w-3.5 h-3.5 fill-current text-pink-400" />}
                <span>{isPlaying ? 'পজ' : 'প্লে করুন'}</span>
              </button>

              <a
                href={currentAudioUrl}
                download={`puja-bengali-voice-${Date.now()}.wav`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-950/40 active:scale-95 transition"
              >
                <Download className="w-4 h-4" />
                <span>ফাইল ডাউনলোড (.wav)</span>
              </a>
            </div>
          </div>
        )}

        {/* Hidden Audio Element for Unary Playback */}
        <audio
          ref={audioRef}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />

        {errorMsg && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Preset Phrases Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <MessageCircleHeart className="w-4 h-4 text-pink-400" />
            <span>জনপ্রিয় বাংলা কথা ও অনুভূতির ডায়ালগ ({isGf ? 'গার্লফ্রেন্ড রূপ' : 'প্রফেশনাল রূপ'})</span>
          </h3>
          <span className="text-[11px] text-slate-500">ট্যাপ করে সরাসরি ভয়েস শুনুন</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredPresets.map((preset) => (
            <div
              key={preset.id}
              onClick={() => {
                setInputText(preset.bengali);
                handleGenerateTTS(preset.bengali);
              }}
              className="p-3.5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-all duration-200 group active:scale-[0.99] flex flex-col justify-between"
            >
              <div>
                <p className="text-xs font-medium font-bengali text-slate-200 group-hover:text-white leading-relaxed mb-1.5">
                  "{preset.bengali}"
                </p>
                <p className="text-[11px] text-slate-400 italic">
                  {preset.englishMeaning}
                </p>
              </div>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400">
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                  {preset.emotion}
                </span>
                <span className="text-rose-400 group-hover:text-rose-300 flex items-center gap-1 font-medium">
                  <Play className="w-3 h-3 fill-current" />
                  শুনুন
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
