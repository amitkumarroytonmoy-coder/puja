import React from 'react';
import { Activity, Zap, CheckCircle2, Cpu } from 'lucide-react';
import { VoiceMode } from '../types';

interface LatencyMeterProps {
  currentPingMs: number;
  lastTtsMs?: number;
  mode: VoiceMode;
  isLive: boolean;
}

export const LatencyMeter: React.FC<LatencyMeterProps> = ({
  currentPingMs,
  lastTtsMs,
  mode,
  isLive,
}) => {
  const isOptimal = currentPingMs < 200 && currentPingMs > 0;
  const isGf = mode === 'girlfriend';

  return (
    <div className={`p-3.5 rounded-2xl border backdrop-blur-md transition-all duration-300 ${
      isGf 
        ? 'bg-rose-950/25 border-rose-500/20 shadow-lg shadow-rose-950/20' 
        : 'bg-slate-900/40 border-cyan-500/20 shadow-lg shadow-cyan-950/20'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isGf ? 'bg-rose-500/20 text-rose-300' : 'bg-cyan-500/20 text-cyan-300'}`}>
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold tracking-wider uppercase text-slate-400">
              Latency Engine
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>{currentPingMs > 0 ? `${currentPingMs} ms` : '—'}</span>
              {isOptimal && (
                <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  &lt;200ms Target Met
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[11px] text-slate-400">Live Voice Protocol</div>
          <div className="text-xs font-mono font-medium text-slate-300">
            {isLive ? 'WebSocket 16k/24k' : 'HTTP/WAV Ready'}
          </div>
        </div>
      </div>

      {/* Latency Progress Bar with 200ms milestone marker */}
      <div className="space-y-1">
        <div className="relative w-full h-2 bg-slate-800/80 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 rounded-full ${
              currentPingMs <= 150 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                : currentPingMs <= 200 
                  ? 'bg-gradient-to-r from-teal-400 to-amber-400' 
                  : 'bg-gradient-to-r from-amber-400 to-rose-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(5, (currentPingMs / 300) * 100))}%` }}
          />
          {/* 200ms marker line */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-white/60 shadow-sm"
            style={{ left: `${(200 / 300) * 100}%` }}
            title="200ms threshold"
          />
        </div>

        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>0ms</span>
          <span className="text-emerald-400 font-semibold">200ms Limit</span>
          <span>300ms+</span>
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-slate-500" />
          <span>TTS Model: <strong className="text-slate-200">Gemini 3.8 Flash TTS</strong></span>
        </div>
        {lastTtsMs ? (
          <span>Last Audio: <strong className="text-slate-200">{lastTtsMs}ms</strong></span>
        ) : (
          <span className="text-slate-500">Kore Voice Consistent</span>
        )}
      </div>
    </div>
  );
};
