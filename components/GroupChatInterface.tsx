
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat, Type } from '@google/genai';
import { Character, Message } from '../types';
import { Send, ArrowLeft, Loader2, Shield, Sparkles, Trash2 } from 'lucide-react';

interface GroupChatInterfaceProps {
  characters: Character[];
  onBack: () => void;
}

const GroupChatInterface: React.FC<GroupChatInterfaceProps> = ({ characters, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const names = characters.map(c => c.name).join(', ');
    const traitDescriptions = characters.map(c => `${c.name} (${c.anime}): ${c.description}`).join('\n');
    
    const collectiveInstruction = `
      You are an engine for a multi-character anime group chat. 
      Participants: ${names}.
      
      Details:
      ${traitDescriptions}
      
      RULES:
      1. For every user message, decide which character(s) would respond. 
      2. Respond with a JSON array of objects.
      3. Each object must have "characterName", "text", and optionally an "imagePrompt".
      4. Use "imagePrompt" if a character wants to send a photo or visualize something. Describe the image in detail.
      5. Maintain distinct personalities and catchphrases.
      6. Characters should interact with each other and the user.
      7. Use English, Hindi, or Hinglish as appropriate.
    `;

    chatSessionRef.current = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: collectiveInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              characterName: { 
                type: Type.STRING, 
                description: "The name of the character speaking." 
              },
              text: { 
                type: Type.STRING, 
                description: "The content of the message." 
              },
              imagePrompt: {
                type: Type.STRING,
                description: "A detailed description for an image the character wants to share."
              }
            },
            required: ["characterName", "text"]
          }
        }
      },
    });
    
    setMessages([
      {
        id: 'init',
        role: 'model',
        text: `*${names} have joined the room*`,
        timestamp: new Date()
      }
    ]);
  }, [characters]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateImage = async (prompt: string): Promise<string> => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ parts: [{ text: prompt }] }]
      });
      
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    } catch (e) {
      console.error("Image generation failed", e);
    }
    return '';
  };

  const handleSend = async () => {
    if (!input.trim() || !chatSessionRef.current || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await chatSessionRef.current.sendMessage({ message: userMsg.text });
      const responseText = result.text;
      
      try {
        const parsedResponses = JSON.parse(responseText);
        if (Array.isArray(parsedResponses)) {
          const newMessages: Message[] = [];
          
          for (let i = 0; i < parsedResponses.length; i++) {
            const res = parsedResponses[i];
            let imageUrl = '';
            
            if (res.imagePrompt) {
              imageUrl = await generateImage(res.imagePrompt);
            }

            newMessages.push({
              id: (Date.now() + i).toString(),
              role: 'model',
              senderName: res.characterName,
              text: res.text,
              imageUrl: imageUrl,
              timestamp: new Date()
            });
          }
          
          setMessages(prev => [...prev, ...newMessages]);
        }
      } catch (e) {
        console.error("Failed to parse group response", e);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'model',
          text: responseText,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Group chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMessage = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  const getCharacterByMsg = (msg: Message) => {
    return characters.find(c => c.name === msg.senderName);
  };

  return (
    <div className="flex flex-col h-full bg-gray-950">
      <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/60 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex -space-x-3 overflow-hidden">
            {characters.slice(0, 3).map(c => (
              <img key={c.id} src={c.avatarUrl} alt={c.name} className="inline-block h-10 w-10 rounded-full ring-2 ring-gray-900 object-cover border border-gray-800" />
            ))}
            {characters.length > 3 && (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-xs font-bold text-white ring-2 ring-gray-900">
                +{characters.length - 3}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-sm font-bold text-white leading-tight">Group Session</h2>
            <p className="text-[10px] text-purple-400 font-bold tracking-widest uppercase">Characters Interaction</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full">
           <Shield size={12} className="text-purple-400" />
           <span className="text-[10px] text-purple-300 font-medium">Standard AI Vision</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => {
          const char = getCharacterByMsg(msg);
          const isUser = msg.role === 'user';
          
          return (
            <div key={msg.id} className={`flex w-full group animate-message ${isUser ? 'justify-end' : 'justify-start items-start gap-3'}`}>
              {!isUser && char && (
                <img src={char.avatarUrl} alt={char.name} className="w-8 h-8 rounded-full object-cover border border-gray-700 mt-1" />
              )}
              
              <div className={`relative flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%]`}>
                {!isUser && char && (
                  <span className="text-[10px] font-bold text-gray-500 mb-1 ml-1 uppercase tracking-wider">{char.name}</span>
                )}
                <div className={`rounded-2xl overflow-hidden shadow-lg transition-all ${
                  isUser 
                    ? 'bg-blue-600 text-white rounded-br-none shadow-blue-900/10' 
                    : 'bg-gray-800/80 border border-gray-700 text-gray-100 rounded-tl-none'
                }`}>
                  {msg.imageUrl && (
                    <img 
                      src={msg.imageUrl} 
                      alt="Generated" 
                      className="w-full h-auto max-h-80 object-cover border-b border-gray-700/50" 
                      loading="lazy"
                    />
                  )}
                  {msg.text && (
                    <div className="px-4 py-3 text-sm md:text-base whitespace-pre-wrap leading-relaxed">
                      {msg.text}
                    </div>
                  )}
                </div>
                
                {/* Delete Button */}
                {msg.id !== 'init' && (
                  <button 
                    onClick={() => deleteMessage(msg.id)}
                    className={`mt-1 p-1.5 rounded-full bg-gray-800/50 text-gray-500 hover:text-red-400 hover:bg-gray-700 transition-all opacity-0 group-hover:opacity-100 ${isUser ? 'mr-1' : 'ml-1'}`}
                    title="Delete message"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-gray-950 border-t border-gray-900">
        <div className="relative flex items-end bg-gray-900 rounded-2xl border border-gray-800 focus-within:border-purple-500/50 transition-all shadow-inner">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Send a message to everyone..."
            className="w-full bg-transparent text-white p-4 max-h-32 min-h-[56px] resize-none outline-none placeholder-gray-600 text-sm md:text-base"
            rows={1}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-3 m-1 rounded-xl transition-all flex items-center justify-center ${
              input.trim() 
                ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-900/20' 
                : 'text-gray-600'
            }`}
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
        <div className="flex justify-center gap-4 mt-2">
            <p className="text-[10px] text-gray-700 flex items-center gap-1">
                <Sparkles size={10} /> AI Vision Active
            </p>
        </div>
      </div>
    </div>
  );
};

export default GroupChatInterface;
