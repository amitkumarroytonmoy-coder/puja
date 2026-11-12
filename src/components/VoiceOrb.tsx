import React, { useEffect, useRef } from 'react';
import { VoiceMode, VoiceState } from '../types';

interface VoiceOrbProps {
  state: VoiceState;
  mode: VoiceMode;
  analyserNode?: AnalyserNode | null;
  size?: number;
  onClick?: () => void;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  state,
  mode,
  analyserNode,
  size = 280,
  onClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    const freqData = new Uint8Array(128);

    const render = () => {
      time += 0.025;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let audioLevel = 0;
      if (analyserNode && state === 'speaking') {
        try {
          analyserNode.getByteFrequencyData(freqData);
          let sum = 0;
          for (let i = 0; i < 32; i++) {
            sum += freqData[i];
          }
          audioLevel = sum / (32 * 255);
        } catch (_) {}
      } else if (state === 'listening') {
        audioLevel = 0.2 + Math.sin(time * 3) * 0.15;
      } else if (state === 'speaking') {
        audioLevel = 0.45 + Math.sin(time * 6) * 0.25;
      } else if (state === 'thinking') {
        audioLevel = 0.25 + Math.sin(time * 8) * 0.1;
      } else {
        audioLevel = 0.08 + Math.sin(time * 1.5) * 0.04;
      }

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseRadius = (size * 0.28) + (audioLevel * size * 0.12);

      // Gradient color palette based on mode
      const isGf = mode === 'girlfriend';
      const c1 = isGf ? 'rgba(251, 113, 133, ' : 'rgba(56, 189, 248, '; // rose-400 / sky-400
      const c2 = isGf ? 'rgba(244, 63, 94, ' : 'rgba(99, 102, 241, ';  // rose-500 / indigo-500
      const c3 = isGf ? 'rgba(225, 29, 72, ' : 'rgba(79, 70, 229, ';   // rose-600 / indigo-600
      const aura = isGf ? 'rgba(253, 164, 175, 0.25)' : 'rgba(129, 140, 248, 0.25)';

      // Outer breathing aura ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 1.45 + Math.sin(time * 2) * 6, 0, Math.PI * 2);
      ctx.fillStyle = aura;
      ctx.filter = 'blur(16px)';
      ctx.fill();
      ctx.filter = 'none';

      // Secondary layered glowing waves
      const waveCount = 3;
      for (let w = 0; w < waveCount; w++) {
        ctx.beginPath();
        const waveRadius = baseRadius * (1 + (w * 0.15));
        const waveOpacity = (0.35 - (w * 0.1)) * (0.8 + audioLevel);

        for (let a = 0; a <= Math.PI * 2; a += 0.1) {
          const distortion = Math.sin(a * 4 + time * 3 + w) * (8 + audioLevel * 22);
          const r = waveRadius + distortion;
          const x = centerX + Math.cos(a) * r;
          const y = centerY + Math.sin(a) * r;
          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = `${c2}${waveOpacity})`;
        ctx.lineWidth = 2 + (w === 0 ? audioLevel * 3 : 1);
        ctx.stroke();
      }

      // Core Orb Radial Gradient
      const grad = ctx.createRadialGradient(
        centerX - baseRadius * 0.3,
        centerY - baseRadius * 0.3,
        baseRadius * 0.1,
        centerX,
        centerY,
        baseRadius * 1.1
      );

      if (isGf) {
        grad.addColorStop(0, '#ffe4e6'); // rose-100
        grad.addColorStop(0.3, '#fb7185'); // rose-400
        grad.addColorStop(0.7, '#e11d48'); // rose-600
        grad.addColorStop(1, '#881337'); // rose-900
      } else {
        grad.addColorStop(0, '#e0f2fe'); // sky-100
        grad.addColorStop(0.3, '#38bdf8'); // sky-400
        grad.addColorStop(0.7, '#6366f1'); // indigo-500
        grad.addColorStop(1, '#1e1b4b'); // indigo-950
      }

      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.shadowColor = isGf ? 'rgba(244, 63, 94, 0.8)' : 'rgba(99, 102, 241, 0.8)';
      ctx.shadowBlur = 24 + audioLevel * 30;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inner highlight sparkle
      ctx.beginPath();
      ctx.arc(centerX - baseRadius * 0.35, centerY - baseRadius * 0.35, baseRadius * 0.18, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fill();

      // Delicate floating particles / sparks around the orb
      const particleCount = isGf ? 8 : 6;
      for (let p = 0; p < particleCount; p++) {
        const pAngle = time * 0.8 + (p * (Math.PI * 2 / particleCount));
        const pDist = baseRadius * 1.35 + Math.sin(time * 2 + p) * 12;
        const px = centerX + Math.cos(pAngle) * pDist;
        const py = centerY + Math.sin(pAngle) * pDist;
        const pSize = 1.8 + Math.sin(time * 3 + p) * 1.2;

        ctx.beginPath();
        ctx.arc(px, py, Math.max(0.8, pSize), 0, Math.PI * 2);
        ctx.fillStyle = isGf ? 'rgba(254, 205, 211, 0.7)' : 'rgba(186, 230, 253, 0.7)';
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [state, mode, analyserNode, size]);

  return (
    <div 
      className="relative flex items-center justify-center cursor-pointer select-none group"
      onClick={onClick}
      style={{ width: size, height: size }}
    >
      <canvas
        ref={canvasRef}
        width={size * 2}
        height={size * 2}
        style={{ width: size, height: size }}
        className="transition-transform duration-300 group-hover:scale-105"
      />
      {/* Subtext overlay badge */}
      <div className="absolute -bottom-2 px-3 py-1 rounded-full text-xs font-medium tracking-wide shadow-lg backdrop-blur-md border transition-all duration-300"
        style={{
          backgroundColor: mode === 'girlfriend' ? 'rgba(30, 10, 20, 0.75)' : 'rgba(10, 20, 35, 0.75)',
          borderColor: mode === 'girlfriend' ? 'rgba(244, 63, 94, 0.4)' : 'rgba(99, 102, 241, 0.4)',
          color: mode === 'girlfriend' ? '#fda4af' : '#a5b4fc',
        }}
      >
        {state === 'disconnected' && ' অফলাইন • ট্যাপ করে কল করুন'}
        {state === 'connecting' && 'সংযুক্ত হচ্ছে...'}
        {state === 'idle' && (mode === 'girlfriend' ? '💖 পূজা শুনছে...' : '🎙️ প্রস্তুত')}
        {state === 'listening' && '👂 আপনার কথা শুনছি...'}
        {state === 'thinking' && '✨ চিন্তা করছি...'}
        {state === 'speaking' && (mode === 'girlfriend' ? '🌸 পূজা মিষ্টি করে বলছে...' : '🗣️ পূজা উত্তর দিচ্ছে...')}
      </div>
    </div>
  );
};
