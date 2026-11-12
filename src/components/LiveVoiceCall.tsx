import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, 
  MicOff, 
  PhoneCall, 
  PhoneOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Heart, 
  Briefcase, 
  MessageSquare,
  AlertCircle,
  Zap,
  HandMetal
} from 'lucide-react';
import { VoiceMode, VoiceState, UserContext } from '../types';
import { VoiceOrb } from './VoiceOrb';
import { LatencyMeter } from './LatencyMeter';
import { LiveAudioPlayer, float32ToInt16PCM, arrayBufferToBase64, downsampleTo16k } from '../utils/audio';
import { getLiveWsUrl } from '../utils/api';

interface LiveVoiceCallProps {
  mode: VoiceMode;
  userContext: UserContext;
  onModeToggle: (newMode: VoiceMode) => void;
  onOpenSettings: () => void;
}

export const LiveVoiceCall: React.FC<LiveVoiceCallProps> = ({
  mode,
  userContext,
  onModeToggle,
  onOpenSettings,
}) => {
  const [callState, setCallState] = useState<VoiceState>('disconnected');
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState<boolean>(false);
  const [currentPing, setCurrentPing] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userTranscript, setUserTranscript] = useState<string>('');
  const [modelTranscript, setModelTranscript] = useState<string>('');
  const [micLevel, setMicLevel] = useState<number>(0);

  // Audio & WebSocket refs
  const wsRef = useRef<WebSocket | null>(null);
  const audioPlayerRef = useRef<LiveAudioPlayer | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const pingIntervalRef = useRef<any>(null);
  const isMutedRef = useRef<boolean>(false);
  isMutedRef.current = isMicMuted;

  // Initialize or update audio player
  useEffect(() => {
    const player = new LiveAudioPlayer();
    player.onSpeakingChange = (isSpeaking) => {
      setCallState((prev) => {
        if (prev === 'disconnected' || prev === 'connecting') return prev;
        return isSpeaking ? 'speaking' : 'idle';
      });
    };
    audioPlayerRef.current = player;

    return () => {
      player.close();
      cleanupAudioInput();
    };
  }, []);

  // Update speaker mute
  useEffect(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.setMute(isSpeakerMuted);
    }
  }, [isSpeakerMuted]);

  const cleanupAudioInput = () => {
    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch (_) {}
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      try {
        inputAudioCtxRef.current.close();
      } catch (_) {}
      inputAudioCtxRef.current = null;
    }
    setMicLevel(0);
  };

  const startMicCapture = async (ws: WebSocket) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioCtxClass();
      inputAudioCtxRef.current = inputCtx;

      const source = inputCtx.createMediaStreamSource(stream);
      // ScriptProcessorNode for wide browser compatibility
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      source.connect(processor);
      processor.connect(inputCtx.destination);

      processor.onaudioprocess = (e) => {
        if (isMutedRef.current || ws.readyState !== WebSocket.OPEN) return;

        const inputChannelData = e.inputBuffer.getChannelData(0);
        
        // Calculate audio visualizer level
        let sum = 0;
        for (let i = 0; i < inputChannelData.length; i += 16) {
          sum += Math.abs(inputChannelData[i]);
        }
        const avg = sum / (inputChannelData.length / 16);
        setMicLevel(Math.min(1, avg * 4));

        if (avg > 0.03) {
          setCallState((prev) => (prev === 'speaking' ? prev : 'listening'));
        }

        // Resample to 16kHz if needed
        const resampled = downsampleTo16k(inputChannelData, inputCtx.sampleRate);
        const pcm16Buffer = float32ToInt16PCM(resampled);
        const base64PCM = arrayBufferToBase64(pcm16Buffer);

        ws.send(JSON.stringify({
          type: 'audio',
          pcm: base64PCM,
        }));
      };
    } catch (err: any) {
      console.error('Microphone access failed:', err);
      setErrorMsg('Microphone access was denied or is not supported.');
    }
  };

  const startCall = useCallback(async () => {
    setErrorMsg(null);
    setCallState('connecting');

    try {
      // Connect to WebSocket (supports both hosted web & packaged APK)
      const wsUrl = getLiveWsUrl();
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        // Send initial setup with user context and selected mode
        ws.send(JSON.stringify({
          type: 'init',
          mode,
          userContext,
        }));

        setCallState('idle');
        await startMicCapture(ws);

        // Ping every 1.5 seconds to measure latency
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'ping',
              timestamp: Date.now(),
            }));
          }
        }, 1500);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'pong') {
            const rtt = Date.now() - data.clientTimestamp;
            setCurrentPing(rtt);
            return;
          }

          if (data.type === 'audio') {
            if (audioPlayerRef.current) {
              setCallState('speaking');
              audioPlayerRef.current.playPCMChunk(data.audio);
            }
            return;
          }

          if (data.type === 'user_transcript') {
            setUserTranscript(data.text);
            return;
          }

          if (data.type === 'model_transcript') {
            setModelTranscript((prev) => prev ? `${prev} ${data.text}` : data.text);
            return;
          }

          if (data.type === 'interrupted') {
            if (audioPlayerRef.current) {
              audioPlayerRef.current.stop();
            }
            setCallState('listening');
            return;
          }

          if (data.type === 'turn_complete') {
            setCallState('idle');
            return;
          }

          if (data.type === 'error') {
            setErrorMsg(data.message);
            return;
          }
        } catch (e) {
          console.error('Error handling live message:', e);
        }
      };

      ws.onerror = (e) => {
        console.error('WebSocket connection error:', e);
        setErrorMsg('Live audio server connection error.');
      };

      ws.onclose = () => {
        setCallState('disconnected');
        cleanupAudioInput();
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
      };
    } catch (err: any) {
      console.error('Failed to start call:', err);
      setErrorMsg(err.message || 'Could not connect to live voice session');
      setCallState('disconnected');
    }
  }, [mode, userContext]);

  const endCall = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.stop();
    }
    cleanupAudioInput();
    setCallState('disconnected');
    setCurrentPing(0);
    setUserTranscript('');
    setModelTranscript('');
  }, []);

  const handleInterrupt = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.stop();
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'text_input', text: 'শুনছি, বলো...' }));
    }
    setCallState('listening');
  };

  const handleModeSwitch = (newMode: VoiceMode) => {
    onModeToggle(newMode);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'switch_mode',
        mode: newMode,
        userContext,
      }));
    }
  };

  const isConnected = callState !== 'disconnected';
  const isGf = mode === 'girlfriend';

  return (
    <div className="flex flex-col items-center justify-between min-h-[560px] w-full max-w-2xl mx-auto p-4 md:p-6 select-none">
      {/* Top Bar: Mode Switcher & Personalization Tag */}
      <div className="w-full flex items-center justify-between mb-4">
        {/* Mode Toggle Button */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur-md">
          <button
            onClick={() => handleModeSwitch('girlfriend')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
              isGf
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/25 ring-1 ring-rose-300/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isGf ? 'fill-white animate-pulse' : ''}`} />
            <span>গার্লফ্রেন্ড মোড</span>
          </button>

          <button
            onClick={() => handleModeSwitch('normal')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
              !isGf
                ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-500/25 ring-1 ring-cyan-300/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>নরমাল মোড</span>
          </button>
        </div>

        {/* User Context & Settings */}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{userContext.userNickname || userContext.userName}</span>
        </button>
      </div>

      {/* Latency Meter Bar */}
      <div className="w-full mb-4">
        <LatencyMeter
          currentPingMs={currentPing}
          mode={mode}
          isLive={isConnected}
        />
      </div>

      {/* Centerpiece: Reactive Voice Orb */}
      <div className="my-auto flex flex-col items-center">
        <VoiceOrb
          state={callState}
          mode={mode}
          analyserNode={audioPlayerRef.current?.getAnalyser()}
          size={260}
          onClick={isConnected ? handleInterrupt : startCall}
        />

        {/* Live Mic Activity Visualizer Bar when connected */}
        {isConnected && !isMicMuted && (
          <div className="mt-4 flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-mono">Mic Input</span>
            <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-400 transition-all duration-75"
                style={{ width: `${Math.min(100, micLevel * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMsg && (
          <div className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs max-w-md text-center">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Live Transcript Stream Cards */}
      <div className="w-full space-y-2 my-4 min-h-[90px]">
        {userTranscript && (
          <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 text-slate-200 text-xs font-bengali flex items-start gap-2 shadow-sm">
            <span className="text-slate-400 shrink-0 font-medium font-sans">You:</span>
            <p className="leading-relaxed">{userTranscript}</p>
          </div>
        )}

        {modelTranscript && (
          <div className={`p-3.5 rounded-2xl border text-xs font-bengali leading-relaxed shadow-sm transition-all ${
            isGf
              ? 'bg-rose-950/20 border-rose-500/30 text-rose-100'
              : 'bg-indigo-950/20 border-indigo-500/30 text-indigo-100'
          }`}>
            <div className="flex items-center gap-1.5 mb-1 text-[11px] font-sans font-semibold tracking-wide text-slate-400 uppercase">
              <Sparkles className="w-3 h-3 text-pink-400" />
              <span>PUJA (পূজা)</span>
            </div>
            <p>{modelTranscript}</p>
          </div>
        )}
      </div>

      {/* Call Controls Footer */}
      <div className="w-full flex items-center justify-center gap-4 pt-2 border-t border-slate-800/80">
        {!isConnected ? (
          <button
            onClick={startCall}
            className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl font-semibold text-sm shadow-xl transition-all duration-300 active:scale-95 ${
              isGf
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-rose-900/30 ring-2 ring-rose-400/30'
                : 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-700 hover:to-indigo-700 text-white shadow-indigo-900/30 ring-2 ring-cyan-400/30'
            }`}
          >
            <PhoneCall className="w-5 h-5 animate-bounce" />
            <span className="font-bengali text-base">পূজাকে লাইভ কল করুন (Gemini 3.8 Live)</span>
          </button>
        ) : (
          <div className="flex items-center gap-3">
            {/* Mic Toggle */}
            <button
              onClick={() => setIsMicMuted(!isMicMuted)}
              className={`p-3.5 rounded-2xl border transition-all duration-200 active:scale-90 ${
                isMicMuted
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700'
              }`}
              title={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-emerald-400" />}
            </button>

            {/* Interrupt / Stop Button */}
            <button
              onClick={handleInterrupt}
              className="px-4 py-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-medium hover:bg-amber-500/20 transition flex items-center gap-1.5"
              title="Interrupt and speak"
            >
              <HandMetal className="w-4 h-4" />
              <span>থামো / Interrupt</span>
            </button>

            {/* Speaker Toggle */}
            <button
              onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
              className={`p-3.5 rounded-2xl border transition-all duration-200 active:scale-90 ${
                isSpeakerMuted
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700'
              }`}
              title={isSpeakerMuted ? 'Unmute speaker' : 'Mute speaker'}
            >
              {isSpeakerMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            {/* End Call */}
            <button
              onClick={endCall}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm shadow-lg shadow-rose-900/30 active:scale-95 transition"
              title="End Voice Call"
            >
              <PhoneOff className="w-5 h-5" />
              <span>কল শেষ করুন</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
