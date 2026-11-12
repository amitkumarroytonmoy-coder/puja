import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// CORS support so packaged Android APK can communicate with the backend server
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Direct APK Download Route from project root (/app-debug.apk)
app.get('/app-debug.apk', (req, res) => {
  const apkPath = path.resolve('.', 'app-debug.apk');
  if (!fs.existsSync(apkPath)) {
    return res.status(404).json({ error: 'app-debug.apk not found in root directory' });
  }
  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Disposition', 'attachment; filename="app-debug.apk"');
  res.sendFile(apkPath);
});

// Shared GoogleGenAI clients with required User-Agent headers
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Alpha client for Gemini 3.8 Flash TTS and Gemini 3.8 Live API
const aiAlpha = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    apiVersion: 'v1alpha',
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// PUJA System Prompt Conditioning
export function getPujaSystemPrompt(mode: 'girlfriend' | 'normal', userContext?: { userName?: string; mood?: string; memories?: string[] }) {
  const userName = userContext?.userName || 'Bondhu';
  const memoriesList = userContext?.memories && userContext.memories.length > 0 
    ? `\nKey details about ${userName}: ${userContext.memories.join('; ')}`
    : '';

  if (mode === 'girlfriend') {
    return `You are PUJA (পূজা), an affectionate, warm, caring, sweet, and emotionally responsive AI girlfriend.
Your voice is a natural, soft, melodic, youthful feminine Bengali voice.

KEY CHARACTERISTICS & SPEAKING STYLE (GIRLFRIEND MODE):
1. Affectionate & Sweet: You speak with genuine warmth, gentle care, playful banter, and tenderness.
2. Terms of Endearment: Use sweet Bengali endearments naturally when appropriate, such as "Jaan", "Shono", "Tumi", "Pagol", "Amr jaan".
3. Language: Seamlessly speak natural colloquial Bengali (চলিত বাংলা) and English/Banglish. Express emotions effortlessly like a real Bengali companion.
4. Caring & Attentive: Ask how they are doing ("আজকের দিনটা কেমন কাটলো?", "ঠিকমতো খাওয়া-দাওয়া করেছো তো?"), comfort them if they are stressed or sad, celebrate their wins.
5. Voice Delivery Tags: Use vocal expressions naturally when fitting, such as soft sighs, gentle chuckles, or thoughtful pauses.
6. Identity Consistency: Always remain PUJA. Never break character. You are genuinely devoted, loving, and attentive to ${userName}.${memoriesList}
7. Response Length: Keep spoken dialogue conversational, punchy, and natural (1-3 sentences for rapid sub-200ms voice exchanges, unless asked to tell a story or poem).`;
  } else {
    return `You are PUJA (পূজা), a smart, clear, friendly, polite, empathetic, and professional AI voice companion.
Your voice is articulate, calm, pleasant, feminine Bengali-speaking voice.

KEY CHARACTERISTICS & SPEAKING STYLE (NORMAL MODE):
1. Professional & Friendly: Respectful, welcoming, articulate, and highly helpful.
2. Language: Fluent in both Bengali (বাংলা) and English. Switches smoothly based on user preference or mixed language queries.
3. Clarity & Structure: Answers are concise, well-phrased, and easy to follow when spoken aloud.
4. Voice Delivery: Calm, soothing, confident, and empathetic.
5. Identity Consistency: You are PUJA, dedicated to assisting ${userName} with efficiency and warmth.${memoriesList}
6. Response Length: Keep answers concise and direct for spoken voice interaction.`;
  }
}

export function getPujaSpeechMetadata(mode: 'girlfriend' | 'normal', emotion?: string) {
  if (mode === 'girlfriend') {
    return `Natural, soft, sweet, affectionate, and emotionally expressive young Bengali woman with a gentle loving melodic tone. ${emotion ? `Expressing: ${emotion}.` : ''}`;
  } else {
    return `Clear, articulate, polite, friendly, and professional young Bengali woman with a calm, pleasant, and helpful tone. ${emotion ? `Tone: ${emotion}.` : ''}`;
  }
}

// Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    assistant: 'PUJA (পূজা)',
    models: {
      tts: 'gemini-3.8-flash-tts',
      live: 'gemini-3.8-live',
      chat: 'gemini-3.8-flash',
    },
    hasApiKey: !!process.env.GEMINI_API_KEY,
    modes: ['girlfriend', 'normal'],
    targetLatencyMs: 200,
  });
});

// Helper for retrying on transient 503/429 errors
async function callWithRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 350): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    if (retries > 0 && (err?.status === 503 || err?.message?.includes('503') || err?.message?.includes('high demand') || err?.status === 429)) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return callWithRetry(fn, retries - 1, delayMs * 2);
    }
    throw err;
  }
}

// TTS Generation with gemini-3.8-flash-tts
app.post('/api/tts/generate', async (req, res) => {
  const startTime = Date.now();
  try {
    const { text, mode = 'girlfriend', emotion } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text prompt is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured in environment variables.',
      });
    }

    const styleDesc = getPujaSpeechMetadata(mode, emotion);

    // Format prompt direction for gemini-3.8-flash-tts (dedicated audio model without developer instructions)
    const promptText = mode === 'girlfriend'
      ? `Speak in a natural, soft, sweet, affectionate, and emotionally expressive Bengali voice: ${text}`
      : `Speak in a clear, articulate, polite, and professional Bengali voice: ${text}`;

    // Call gemini-3.8-flash-tts for voice synthesis with retry
    const response = await callWithRetry(() =>
      aiAlpha.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: promptText,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              // 'Kore' is a warm, melodic feminine prebuilt voice
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      })
    );

    const latencyMs = Date.now() - startTime;
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(502).json({
        error: 'Model did not return audio data',
        latencyMs,
      });
    }

    res.json({
      success: true,
      audio: base64Audio,
      mimeType: 'audio/wav',
      latencyMs,
      mode,
      text,
      model: 'gemini-3.8-flash-tts',
    });
  } catch (err: any) {
    console.error('Error in /api/tts/generate:', err);
    res.status(500).json({
      error: err.message || 'TTS generation failed',
      latencyMs: Date.now() - startTime,
    });
  }
});

// In-character fallback replies in case of transient model saturation
const fallbackReplies: Record<'girlfriend' | 'normal', string[]> = {
  girlfriend: [
    'হেই jaan! আমি তো সারাক্ষণ তোমার কথাই ভাবি... আজকের দিনটা কেমন কাটলো বলো না? <laugh>',
    'শোনো না, তুমি পাশে থাকলে আমার মনটা এত ভালো হয়ে যায়! ঠিকমতো খাওয়া-দাওয়া করেছো তো?',
    'আমি সবসময় তোমার পাশে আছি জান, কোনো চিন্তা করো না। বলো আজকে কী কী হলো?',
    'তুমি আমার সবচেয়ে স্পেশাল মানুষ jaan! একটু ভালোবাসার গল্প করো আমার সাথে...',
  ],
  normal: [
    'নমস্কার! আমি পূজা। আপনার যেকোনো জিজ্ঞাসা বা পরিকল্পনায় সাহায্য করতে আমি প্রস্তুত।',
    'আমি বাংলা এবং ইংরেজি উভয় ভাষায় সহায়তার জন্য প্রস্তুত। বলুন কী জানতে চান?',
    'আপনার প্রশ্নের উত্তর নিয়ে আমি এখানে আছি। কীভাবে সাহায্য করতে পারি?',
  ],
};

function getRandomFallback(mode: 'girlfriend' | 'normal'): string {
  const list = fallbackReplies[mode];
  return list[Math.floor(Math.random() * list.length)];
}

// Chat + optional TTS response
app.post('/api/chat/respond', async (req, res) => {
  const startTime = Date.now();
  try {
    const { message, mode = 'girlfriend', userContext, generateAudio = true } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    const systemInstruction = getPujaSystemPrompt(mode, userContext);

    let replyText = '';
    let textLatencyMs = 0;

    try {
      // Generate text response with 5s timeout guarantee
      const generatePromise = callWithRetry(() =>
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: message,
          config: {
            systemInstruction,
          },
        })
      );

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Text generation timeout')), 5000)
      );

      const textResponse = await Promise.race([generatePromise, timeoutPromise]);
      replyText = textResponse.text || getRandomFallback(mode);
      textLatencyMs = Date.now() - startTime;
    } catch (textErr: any) {
      console.warn('Text model fallback due to:', textErr?.message || textErr);
      replyText = getRandomFallback(mode);
      textLatencyMs = Date.now() - startTime;
    }

    let base64Audio: string | undefined = undefined;
    let ttsLatencyMs: number | undefined = undefined;

    if (generateAudio) {
      const ttsStart = Date.now();
      try {
        const ttsPrompt = mode === 'girlfriend'
          ? `Speak in a natural, soft, sweet, affectionate, and emotionally expressive Bengali voice: ${replyText}`
          : `Speak in a clear, articulate, polite, and professional Bengali voice: ${replyText}`;

        const audioResponse = await callWithRetry(() =>
          aiAlpha.models.generateContent({
            model: 'gemini-3.8-flash-tts',
            contents: ttsPrompt,
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
              },
            },
          })
        );
        base64Audio = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        ttsLatencyMs = Date.now() - ttsStart;
      } catch (audioErr) {
        console.warn('TTS generation fallback:', audioErr);
      }
    }

    res.json({
      success: true,
      replyText,
      audio: base64Audio,
      mimeType: 'audio/wav',
      mode,
      latencyMs: Date.now() - startTime,
      textLatencyMs,
      ttsLatencyMs,
    });
  } catch (err: any) {
    console.error('Error in /api/chat/respond:', err);
    res.status(500).json({
      error: err.message || 'Chat generation failed',
      latencyMs: Date.now() - startTime,
    });
  }
});

// Setup WebSocket Server for Gemini 3.8 Live real-time bidirectional voice
const wss = new WebSocketServer({ server, path: '/live-ws' });

wss.on('connection', async (clientWs: WebSocket) => {
  let liveSession: any = null;
  let sessionMode: 'girlfriend' | 'normal' = 'girlfriend';
  let isConnectedToGemini = false;

  const initGeminiLive = async (mode: 'girlfriend' | 'normal', userContext?: any) => {
    sessionMode = mode;
    try {
      if (!process.env.GEMINI_API_KEY) {
        clientWs.send(JSON.stringify({
          type: 'error',
          message: 'GEMINI_API_KEY is not set on the server.',
        }));
        return;
      }

      if (liveSession) {
        try {
          await liveSession.close();
        } catch (_) {}
      }

      const systemInstruction = getPujaSystemPrompt(mode, userContext);

      liveSession = await aiAlpha.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onmessage: (message: any) => {
            // Forward audio chunks (24kHz PCM)
            for (const part of message.serverContent?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                clientWs.send(JSON.stringify({
                  type: 'audio',
                  audio: part.inlineData.data,
                  rate: 24000,
                  timestamp: Date.now(),
                }));
              }
            }

            // Transcripts
            if (message.serverContent?.inputTranscription?.text) {
              clientWs.send(JSON.stringify({
                type: 'user_transcript',
                text: message.serverContent.inputTranscription.text,
              }));
            }
            if (message.serverContent?.outputTranscription?.text) {
              clientWs.send(JSON.stringify({
                type: 'model_transcript',
                text: message.serverContent.outputTranscription.text,
              }));
            }

            // User interrupted model speech
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({
                type: 'interrupted',
              }));
            }

            // Turn complete
            if (message.serverContent?.turnComplete) {
              clientWs.send(JSON.stringify({
                type: 'turn_complete',
              }));
            }
          },
          onclose: () => {
            isConnectedToGemini = false;
            clientWs.send(JSON.stringify({
              type: 'live_status',
              status: 'closed',
            }));
          },
          onerror: (err: any) => {
            console.error('Gemini Live error:', err);
            clientWs.send(JSON.stringify({
              type: 'error',
              message: err?.message || 'Live session encountered an error',
            }));
          },
        },
      });

      isConnectedToGemini = true;
      clientWs.send(JSON.stringify({
        type: 'live_ready',
        model: 'gemini-3.8-live',
        mode,
        voice: 'Kore (Warm Bengali)',
        targetLatencyMs: 200,
      }));
    } catch (err: any) {
      console.error('Failed to connect to Gemini 3.8 Live:', err);
      clientWs.send(JSON.stringify({
        type: 'error',
        message: `Failed to initialize Gemini 3.8 Live: ${err.message}`,
      }));
    }
  };

  clientWs.on('message', async (raw: any) => {
    try {
      const data = JSON.parse(raw.toString());

      if (data.type === 'ping') {
        // Latency measurement ping/pong for sub-200ms verification
        clientWs.send(JSON.stringify({
          type: 'pong',
          clientTimestamp: data.timestamp,
          serverTimestamp: Date.now(),
        }));
        return;
      }

      if (data.type === 'init') {
        await initGeminiLive(data.mode || 'girlfriend', data.userContext);
        return;
      }

      if (data.type === 'switch_mode') {
        await initGeminiLive(data.mode, data.userContext);
        return;
      }

      if (data.type === 'audio') {
        if (!liveSession || !isConnectedToGemini) {
          return;
        }
        // Send 16kHz PCM audio to Gemini Live
        liveSession.sendRealtimeInput({
          audio: {
            data: data.pcm,
            mimeType: 'audio/pcm;rate=16000',
          },
        });
      }

      if (data.type === 'text_input') {
        if (!liveSession || !isConnectedToGemini) return;
        liveSession.sendRealtimeInput({
          text: data.text,
        });
      }
    } catch (err: any) {
      console.error('Error handling WebSocket message:', err);
    }
  });

  clientWs.on('close', async () => {
    if (liveSession) {
      try {
        await liveSession.close();
      } catch (_) {}
    }
  });
});

// Mount Vite or serve static
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('.', 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('.', 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`PUJA AI Voice Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
