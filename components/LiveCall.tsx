import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Character } from '../types';
import { createBlob, decode, decodeAudioData } from '../services/audioUtils';
import { Mic, MicOff, PhoneOff, Video, Activity } from 'lucide-react';

interface LiveCallProps {
  character: Character;
  onEndCall: () => void;
}

const LiveCall: React.FC<LiveCallProps> = ({ character, onEndCall }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error' | 'closed'>('connecting');
  const [volume, setVolume] = useState(0); // For visualizer
  
  // Audio Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);

  // Initialize Connection
  useEffect(() => {
    let cleanup = false;

    const initLiveSession = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // 1. Setup Audio Contexts
        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        // 2. Get Microphone
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        const outputNode = outputAudioContextRef.current.createGain();
        outputNode.connect(outputAudioContextRef.current.destination);

        // 3. Connect to Gemini Live
        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          callbacks: {
            onopen: () => {
              if (cleanup) return;
              console.log('Gemini Live Connected');
              setStatus('connected');

              // Setup Input Processing
              if (!inputAudioContextRef.current) return;
              const source = inputAudioContextRef.current.createMediaStreamSource(stream);
              const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
              
              scriptProcessor.onaudioprocess = (e) => {
                if (isMuted) return; // Simple mute logic (don't send data)
                
                const inputData = e.inputBuffer.getChannelData(0);
                
                // Calculate volume for visualizer
                let sum = 0;
                for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
                const rms = Math.sqrt(sum / inputData.length);
                setVolume(prev => prev * 0.8 + rms * 5 * 0.2); // Smooth volume

                const pcmBlob = createBlob(inputData);
                sessionPromise.then(session => {
                    session.sendRealtimeInput({ media: pcmBlob });
                });
              };

              source.connect(scriptProcessor);
              scriptProcessor.connect(inputAudioContextRef.current.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
               if (cleanup) return;

               // Handle Audio Output
               const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
               if (base64Audio && outputAudioContextRef.current) {
                 const ctx = outputAudioContextRef.current;
                 nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                 
                 const audioBuffer = await decodeAudioData(
                   decode(base64Audio),
                   ctx,
                   24000,
                   1
                 );

                 const source = ctx.createBufferSource();
                 source.buffer = audioBuffer;
                 source.connect(outputNode);
                 source.addEventListener('ended', () => {
                   sourcesRef.current.delete(source);
                 });
                 
                 source.start(nextStartTimeRef.current);
                 nextStartTimeRef.current += audioBuffer.duration;
                 sourcesRef.current.add(source);
               }

               // Handle Interruption
               const interrupted = message.serverContent?.interrupted;
               if (interrupted) {
                 sourcesRef.current.forEach(src => src.stop());
                 sourcesRef.current.clear();
                 nextStartTimeRef.current = 0;
               }
            },
            onclose: () => {
               if (!cleanup) setStatus('closed');
            },
            onerror: (err) => {
               console.error('Gemini Live Error:', err);
               if (!cleanup) setStatus('error');
            }
          },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }, // Using a generic voice, character flavor comes from instruction
            },
            systemInstruction: character.systemInstruction,
          }
        });
        
        sessionRef.current = sessionPromise;

      } catch (err) {
        console.error("Failed to start live session", err);
        setStatus('error');
      }
    };

    initLiveSession();

    return () => {
      cleanup = true;
      // Cleanup Audio
      mediaStreamRef.current?.getTracks().forEach(track => track.stop());
      inputAudioContextRef.current?.close();
      outputAudioContextRef.current?.close();
      // We can't strictly 'close' the sessionPromise from here without the session object, 
      // but the stream tracks stopping will effectively kill input.
      // Ideally we would call session.close() if exposed.
      sessionRef.current?.then((s: any) => s.close());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character.id]); // Re-connect if character changes (shouldn't happen in this view without unmount)

  // Visualizer Animation
  const getPulseSize = () => {
    return 1 + Math.min(volume, 0.5);
  };

  return (
    <div className="flex flex-col h-full bg-black/90 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className={`absolute inset-0 opacity-20 bg-gradient-to-br from-${character.themeColor}-900 to-black animate-pulse`}></div>
      
      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full space-y-8 p-6">
        
        {/* Character Avatar with Ripple Effect */}
        <div className="relative group">
           <div 
             className={`absolute inset-0 rounded-full bg-${character.themeColor}-500 blur-xl opacity-30`}
             style={{ transform: `scale(${getPulseSize()})`, transition: 'transform 0.1s ease-out' }}
           ></div>
           <img 
             src={character.avatarUrl} 
             alt={character.name}
             className={`w-48 h-48 md:w-64 md:h-64 rounded-full object-cover border-4 border-${character.themeColor}-500 shadow-2xl relative z-10`}
           />
           <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-2 border-black ${status === 'connected' ? 'bg-green-500' : status === 'error' ? 'bg-red-500' : 'bg-yellow-500'} z-20`}></div>
        </div>

        <div className="text-center space-y-2">
           <h2 className="text-3xl md:text-4xl font-bold text-white font-anime tracking-wider">{character.name}</h2>
           <p className="text-${character.themeColor}-200 text-lg opacity-80">{status === 'connected' ? 'Listening...' : status === 'connecting' ? 'Connecting...' : 'Disconnected'}</p>
        </div>

        {/* Status Messages */}
        {status === 'error' && (
          <div className="bg-red-500/20 text-red-200 px-4 py-2 rounded-lg border border-red-500/50">
            Connection Error. Please check microphone permissions or API key.
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center space-x-6 mt-8">
           <button 
             onClick={() => setIsMuted(!isMuted)}
             className={`p-4 rounded-full transition-all ${isMuted ? 'bg-white text-black' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
           >
             {isMuted ? <MicOff size={28} /> : <Mic size={28} />}
           </button>

           <button 
             onClick={onEndCall}
             className="p-6 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transform hover:scale-105 transition-all"
           >
             <PhoneOff size={36} fill="white" />
           </button>
           
           <div className="p-4 rounded-full bg-gray-800 text-gray-500 cursor-not-allowed">
             <Video size={28} />
           </div>
        </div>
        
        <div className="absolute bottom-8 flex items-center space-x-2 text-white/30 text-sm">
           <Activity size={16} />
           <span>Gemini Live Audio Stream • 24kHz</span>
        </div>
      </div>
    </div>
  );
};

export default LiveCall;
