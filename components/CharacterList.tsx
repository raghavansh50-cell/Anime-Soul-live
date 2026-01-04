
import React, { useState } from 'react';
import { Character } from '../types';
import { Search, Zap, Plus, Users, CheckCircle2 } from 'lucide-react';

interface CharacterListProps {
  characters: Character[];
  onSelect: (character: Character) => void;
  selectedId?: string;
  onAddCharacter: () => void;
  onStartGroupChat: (selected: Character[]) => void;
}

const CharacterList: React.FC<CharacterListProps> = ({ 
  characters, 
  onSelect, 
  selectedId, 
  onAddCharacter,
  onStartGroupChat
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [groupSelection, setGroupSelection] = useState<Character[]>([]);

  const filtered = characters.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.anime.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleGroupMode = () => {
    setIsGroupMode(!isGroupMode);
    setGroupSelection([]);
  };

  const handleCharClick = (char: Character) => {
    if (isGroupMode) {
      if (groupSelection.find(c => c.id === char.id)) {
        setGroupSelection(groupSelection.filter(c => c.id !== char.id));
      } else if (groupSelection.length < 5) {
        setGroupSelection([...groupSelection, char]);
      }
    } else {
      onSelect(char);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 border-r border-white/5 relative">
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-white font-anime flex items-center gap-2 tracking-tight">
             <Zap className="text-yellow-400" fill="currentColor" size={24} /> AnimeSoul
          </h1>
          <button 
            onClick={onAddCharacter}
            className="p-2 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg transition-all border border-blue-500/20 shadow-lg shadow-blue-500/5"
            title="Create Custom Character"
          >
            <Plus size={18} />
          </button>
        </div>
        <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest mb-6 opacity-60">Parallel Universe Nexus</p>
        
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
            <input 
              type="text" 
              placeholder="Filter spirits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 text-white pl-9 pr-4 py-2.5 rounded-xl border border-white/5 focus:border-blue-500 focus:bg-white/10 outline-none transition-all placeholder-gray-600 text-xs"
            />
          </div>
          <button 
            onClick={toggleGroupMode}
            className={`px-3 rounded-xl border transition-all flex items-center gap-1 text-[10px] font-bold uppercase tracking-tighter ${isGroupMode ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20' : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'}`}
          >
            <Users size={14} />
            {isGroupMode ? 'Cancel' : 'Group'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-32 space-y-1">
        {filtered.map(char => {
          const isSelectedInGroup = groupSelection.some(c => c.id === char.id);
          const isActive = selectedId === char.id && !isGroupMode;
          
          return (
            <button
              key={char.id}
              onClick={() => handleCharClick(char)}
              className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 group relative ${
                isActive || isSelectedInGroup
                  ? 'bg-white/10 border-white/10 shadow-xl' 
                  : 'hover:bg-white/5 border border-transparent opacity-80 hover:opacity-100'
              }`}
            >
              <div className="relative flex-shrink-0">
                 <img 
                   src={char.avatarUrl} 
                   alt={char.name} 
                   className={`w-11 h-11 rounded-full object-cover transition-transform duration-500 ${isActive || isSelectedInGroup ? 'scale-105' : 'group-hover:scale-110'}`}
                 />
                 {isActive && (
                    <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500 border-2 border-gray-900"></span>
                    </span>
                 )}
                 {isSelectedInGroup && (
                   <div className="absolute -top-1 -right-1 bg-purple-500 rounded-full p-0.5 shadow-lg animate-in zoom-in">
                     <CheckCircle2 size={12} className="text-white" />
                   </div>
                 )}
              </div>
              <div className="text-left flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`font-bold text-sm truncate tracking-tight ${isActive || isSelectedInGroup ? 'text-white' : 'text-gray-300'}`}>
                    {char.name}
                  </h3>
                  {char.isCustom && <span className="text-[8px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded-full font-black uppercase tracking-tighter">AI</span>}
                </div>
                <p className="text-[10px] text-gray-500 truncate font-medium">{char.anime}</p>
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-10 text-center opacity-40">
            <p className="text-xs text-gray-500">No souls found in this realm...</p>
          </div>
        )}
      </div>

      {isGroupMode && groupSelection.length >= 2 && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-950 via-gray-950 to-transparent z-40">
          <button 
            onClick={() => onStartGroupChat(groupSelection)}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-purple-900/40 flex items-center justify-center gap-2 transform active:scale-95 transition-all animate-in slide-in-from-bottom-4"
          >
            <Users size={16} />
            Enter Nexus ({groupSelection.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default CharacterList;
