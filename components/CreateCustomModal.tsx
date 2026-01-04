
import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';

interface CreateCustomModalProps {
  onClose: () => void;
  onCreate: (name: string, anime: string, description: string, traits: string) => void;
}

const CreateCustomModal: React.FC<CreateCustomModalProps> = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    anime: '',
    description: '',
    traits: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.traits) return;
    onCreate(formData.name, formData.anime, formData.description, formData.traits);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="text-blue-400" size={20} />
            New Character
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Character Name</label>
            <input 
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="e.g. Ichigo Kurosaki"
              className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-xl border border-gray-700 focus:border-blue-500 outline-none transition-all placeholder-gray-600"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Anime Title</label>
            <input 
              value={formData.anime}
              onChange={e => setFormData({...formData, anime: e.target.value})}
              placeholder="e.g. Bleach"
              className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-xl border border-gray-700 focus:border-blue-500 outline-none transition-all placeholder-gray-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Traits & Personality</label>
            <textarea 
              required
              rows={3}
              value={formData.traits}
              onChange={e => setFormData({...formData, traits: e.target.value})}
              placeholder="e.g. Stoic, protective, hates seeing people suffer, substitute soul reaper..."
              className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-xl border border-gray-700 focus:border-blue-500 outline-none transition-all placeholder-gray-600 resize-none"
            />
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-95"
            >
              Summon Character
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCustomModal;
