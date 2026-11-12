export type VoiceMode = 'girlfriend' | 'normal';

export type VoiceState = 'disconnected' | 'connecting' | 'idle' | 'listening' | 'thinking' | 'speaking';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'puja';
  text: string;
  audioUrl?: string;
  timestamp: number;
  mode: VoiceMode;
  latencyMs?: number;
  isLiveTranscript?: boolean;
}

export interface LatencyMetric {
  lastPingMs: number;
  averagePingMs: number;
  ttsGenerationMs: number;
  isSub200ms: boolean;
  timestamp: number;
}

export interface UserContext {
  userName: string;
  userNickname: string;
  languagePreference: 'bengali' | 'banglish' | 'english';
  memories: string[];
  partnerMood?: string;
}

export interface PresetPhrase {
  id: string;
  bengali: string;
  englishMeaning: string;
  mode: VoiceMode;
  emotion: string;
  category: 'affection' | 'daily' | 'caring' | 'poetry' | 'work' | 'greeting';
}
