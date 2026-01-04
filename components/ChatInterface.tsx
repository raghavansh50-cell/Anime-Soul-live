
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Character, Message } from '../types';
import { Send, Phone, ArrowLeft, Loader2, Sparkles, Image as ImageIcon, Trash2 } from 'lucide-react';

interface ChatInterfaceProps {
  character: Character;
  onBack: () => void;
  onStartCall: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ character, onBack, onStartCall }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        id: 'init',
        role: 'model',
        text: `*${character.name} enters the chat*`,
        timestamp: new Date()
      }
    ]);
  }, [character]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Rebuild history from current message state (excluding init message)
      // This ensures deleted messages are not sent to the AI
      const history = newMessages
        .filter(m => m.id !== 'init')
        .map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: history,
        config: {
          systemInstruction: character.systemInstruction + 
            "\n\nYou can 'show' things by generating images. If the user asks for a photo or if it fits the story, generate an image part alongside your text. Be expressive and stay in character!",
        }
      });

      const responseParts = response.candidates[0].content.parts;
      let textContent = '';
      let generatedImageUrl = '';

      for (const part of responseParts) {
        if (part.text) {
          textContent += part.text;
        } else if (part.inlineData) {
          generatedImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: textContent,
        imageUrl: generatedImageUrl,
        timestamp: new Date()
      }]);

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: '(The connection flickered... try again, maybe?)',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMessage = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-gray-900/40 backdrop-blur-xl z-20 sticky top-0">
        <div className="flex items-center space-x-3">
          <button onClick={onBack} className="md:hidden text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={22} />
          </button>
          <div className="relative">
             <img src={character.avatarUrl} alt={character.name} className="w-10 h-10 rounded-full object-cover border border-white/10 shadow-lg" />
             <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900 shadow-sm"></div>
          </div>
          <div>
            <h2 className="font-bold text-white text-sm md:text-base leading-tight">{character.name}</h2>
            <div className="flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
               <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{character.anime}</p>
            </div>
          </div>
        </div>
        
        <button 
          onClick={onStartCall}
          className="group flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full text-sm font-medium transition-all"
        >
          <Phone size={16} className="group-hover:animate-bounce" />
          <span>Call</span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex group animate-message ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`relative flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[70%]`}>
              <div 
                className={`rounded-2xl overflow-hidden shadow-2xl flex flex-col ${
                  msg.role === 'user' 
                    ? `bg-blue-600 text-white rounded-br-none shadow-blue-900/10` 
                    : 'bg-gray-800/80 text-gray-100 rounded-bl-none border border-white/5 backdrop-blur-sm'
                }`}
              >
                {msg.imageUrl && (
                  <img 
                    src={msg.imageUrl} 
                    alt="Generated content" 
                    className="w-full h-auto max-h-[400px] object-cover border-b border-white/5" 
                    loading="lazy"
                  />
                )}
                {msg.text && (
                  <div className="px-5 py-3.5 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </div>
                )}
              </div>
              
              {/* Delete Button - Visible on Hover */}
              {msg.id !== 'init' && (
                <button 
                  onClick={() => deleteMessage(msg.id)}
                  className={`mt-2 p-1.5 rounded-full bg-gray-800/50 text-gray-500 hover:text-red-400 hover:bg-gray-700 transition-all opacity-0 group-hover:opacity-100 ${msg.role === 'user' ? 'mr-1' : 'ml-1'}`}
                  title="Delete message from memory"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-950/80 backdrop-blur-md border-t border-white/5">
        <div className="relative flex items-end bg-gray-900/50 rounded-2xl border border-white/5 focus-within:border-white/20 transition-all shadow-inner">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${character.name}...`}
            className="w-full bg-transparent text-white p-4 max-h-32 min-h-[56px] resize-none outline-none placeholder-gray-600 text-sm md:text-base"
            rows={1}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-3 m-1 rounded-xl transition-all shadow-lg ${
              input.trim() 
                ? `bg-blue-600 text-white hover:bg-blue-500` 
                : 'text-gray-600 bg-transparent'
            }`}
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
        <div className="flex justify-center gap-6 mt-3">
            <p className="text-[10px] text-gray-600 flex items-center gap-1 font-medium uppercase tracking-tighter">
                <Sparkles size={10} className="text-yellow-500" /> Powered by Gemini
            </p>
            <p className="text-[10px] text-gray-600 flex items-center gap-1 font-medium uppercase tracking-tighter">
                <ImageIcon size={10} className="text-blue-500" /> Vision AI Enabled
            </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
