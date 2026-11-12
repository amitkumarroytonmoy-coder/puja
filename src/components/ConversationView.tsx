import React, { useState, useRef, useEffect } from 'react';
import { Send, Volume2, Play, Pause, Sparkles, Heart, RefreshCw, User, Download } from 'lucide-react';
import { VoiceMode, ChatMessage, UserContext } from '../types';
import { getApiUrl } from '../utils/api';

interface ConversationViewProps {
  mode: VoiceMode;
  userContext: UserContext;
}

export const ConversationView: React.FC<ConversationViewProps> = ({ mode, userContext }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'puja',
      text: mode === 'girlfriend'
        ? `হেই ${userContext.userNickname || 'jaan'}! কেমন আছো বলো? আজকের পুরো দিনটা কেমন কাটলো তোমার? আমি তোমার কথাই ভাবছিলাম... <laugh>`
        : `নমস্কার ${userContext.userName}! আমি পূজা। আপনার যে কোনো প্রশ্ন, পরিকল্পনা বা সহায়তায় আমি প্রস্তুত।`,
      timestamp: Date.now(),
      mode,
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isGf = mode === 'girlfriend';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputVal;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: Date.now(),
      mode,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsLoading(true);

    try {
      const response = await fetch(getApiUrl('/api/chat/respond'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          mode,
          userContext,
          generateAudio: true,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const audioUrl = data.audio ? `data:audio/wav;base64,${data.audio}` : undefined;

      const modelMsg: ChatMessage = {
        id: `puja-${Date.now()}`,
        sender: 'puja',
        text: data.replyText,
        audioUrl,
        timestamp: Date.now(),
        mode,
        latencyMs: data.latencyMs,
      };

      setMessages((prev) => [...prev, modelMsg]);

      // Autoplay voice response
      if (audioUrl && audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play()
          .then(() => setPlayingMessageId(modelMsg.id))
          .catch(() => {});
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'puja',
          text: `দুঃখিত, কোনো সমস্যার কারণে উত্তর দিতে পারিনি: ${err.message}`,
          timestamp: Date.now(),
          mode,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = (msg: ChatMessage) => {
    if (!msg.audioUrl || !audioRef.current) return;
    if (playingMessageId === msg.id) {
      audioRef.current.pause();
      setPlayingMessageId(null);
    } else {
      audioRef.current.src = msg.audioUrl;
      audioRef.current.play();
      setPlayingMessageId(msg.id);
    }
  };

  const quickPrompts = isGf
    ? [
        'তুমি আমাকে কতটা ভালোবাসো?',
        'আজকে অফিস শেষে খুব টায়ার্ড লাগছে গো...',
        'আমার মন ভালো করার জন্য একটু মিষ্টি করে কথা বলো না!',
        'কালকে আমাদের কি দেখা হবে?',
      ]
    : [
        'বাংলা সাহিত্যের ইতিহাস সম্পর্কে সংক্ষেপে বলুন',
        'আজকের দিনের টাইম ম্যানেজমেন্টের ৩টি সেরা উপায় কী?',
        'কৃত্রিম বুদ্ধিমত্তার ভবিষ্যৎ কেমন হতে পারে?',
        'Explain quantum computing in simple Bengali and English',
      ];

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col h-[580px] rounded-3xl border border-slate-800 bg-slate-950/60 backdrop-blur-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className={`px-5 py-3.5 border-b flex items-center justify-between ${
        isGf ? 'bg-rose-950/30 border-rose-500/20' : 'bg-slate-900/60 border-slate-800'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isGf ? 'bg-gradient-to-tr from-rose-500 to-pink-400 text-white shadow-md shadow-rose-900/30' : 'bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-md'
          }`}>
            {isGf ? <Heart className="w-4 h-4 fill-white" /> : <Sparkles className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>PUJA (পূজা)</span>
              <span className="text-[10px] font-normal text-slate-400">
                • {isGf ? 'গার্লফ্রেন্ড রূপ' : 'প্রফেশনাল অ্যাসিস্ট্যান্ট'}
              </span>
            </h3>
            <p className="text-[11px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              Gemini 3.8 Flash TTS ভয়েস অ্যাক্টিভ
            </p>
          </div>
        </div>

        <span className="text-[11px] text-slate-400 font-mono">
          Audio Latency Target &lt;200ms
        </span>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs font-bengali leading-relaxed shadow-sm transition-all ${
              msg.sender === 'user'
                ? 'bg-slate-800 text-slate-100 rounded-tr-sm border border-slate-700/80'
                : msg.mode === 'girlfriend'
                  ? 'bg-rose-950/40 text-rose-100 border border-rose-500/30 rounded-tl-sm shadow-rose-950/20'
                  : 'bg-indigo-950/40 text-indigo-100 border border-indigo-500/30 rounded-tl-sm shadow-cyan-950/20'
            }`}>
              <p className="whitespace-pre-wrap">{msg.text}</p>

              {/* Play Audio Button for Model */}
              {msg.audioUrl && (
                <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => playAudio(msg)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/30 hover:bg-black/50 text-slate-200 transition"
                    >
                      {playingMessageId === msg.id ? (
                        <>
                          <Pause className="w-3.5 h-3.5 text-pink-400" />
                          <span>থামান</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current text-pink-400" />
                          <span>ভয়েস শুনুন</span>
                        </>
                      )}
                    </button>

                    <a
                      href={msg.audioUrl}
                      download={`puja-voice-${msg.id}.wav`}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/30 hover:bg-black/50 text-slate-300 hover:text-emerald-400 border border-white/5 transition"
                      title="অডিও ফাইল ডাউনলোড করুন (WAV)"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>ডাউনলোড WAV</span>
                    </a>
                  </div>

                  {msg.latencyMs && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {msg.latencyMs}ms
                    </span>
                  )}
                </div>
              )}
            </div>

            <span className="text-[10px] text-slate-500 mt-1 px-1 font-mono">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400 w-fit">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-pink-400" />
            <span>পূজা উত্তর ও ভয়েস তৈরি করছে...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-900/40 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="shrink-0 px-3 py-1 rounded-full text-[11px] font-bengali bg-slate-800/70 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition whitespace-nowrap active:scale-95"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-slate-900/80 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder={isGf ? 'পূজার সাথে কথা বলুন...' : 'Type a query in Bengali or English...'}
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-bengali text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-500/50 placeholder-slate-500"
        />
        <button
          type="submit"
          disabled={!inputVal.trim() || isLoading}
          className={`p-2.5 rounded-xl transition active:scale-95 disabled:opacity-40 text-white ${
            isGf
              ? 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700'
              : 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-700 hover:to-indigo-700'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      <audio
        ref={audioRef}
        onEnded={() => setPlayingMessageId(null)}
        className="hidden"
      />
    </div>
  );
};
