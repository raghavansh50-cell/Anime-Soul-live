
import React, { useState } from 'react';
import { Character, AppMode } from './types';
import CharacterList from './components/CharacterList';
import ChatInterface from './components/ChatInterface';
import LiveCall from './components/LiveCall';
import CreateCustomModal from './components/CreateCustomModal';
import GroupChatInterface from './components/GroupChatInterface';
import { CHARACTERS, getInstruction } from './constants';

const App: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>(CHARACTERS);
  const [selectedCharacter, setSelectedCharacter] = useState<Character>(CHARACTERS[0]);
  const [groupCharacters, setGroupCharacters] = useState<Character[]>([]);
  const [mode, setMode] = useState<AppMode>(AppMode.CHAT);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const handleSelectCharacter = (character: Character) => {
    setSelectedCharacter(character);
    setMode(AppMode.CHAT);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleAddCharacter = (name: string, anime: string, description: string, traits: string) => {
    const newChar: Character = {
      id: `custom-${Date.now()}`,
      name,
      anime,
      description,
      systemInstruction: getInstruction(name, anime, traits),
      themeColor: 'blue',
      avatarUrl: `https://picsum.photos/seed/${name.replace(/\s+/g, '')}/200/200`,
      isCustom: true
    };
    
    const updated = [...characters, newChar];
    setCharacters(updated);
    setIsCreating(false);
    handleSelectCharacter(newChar);
  };

  const handleStartGroupChat = (selected: Character[]) => {
    setGroupCharacters(selected);
    setMode(AppMode.GROUP_CHAT);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleStartCall = () => {
    setMode(AppMode.LIVE_CALL);
  };

  const handleEndCall = () => {
    setMode(AppMode.CHAT);
  };

  return (
    <div className="flex h-screen w-screen bg-black text-white overflow-hidden font-sans">
      
      {/* Sidebar - Character Selection */}
      <div className={`fixed inset-y-0 left-0 z-30 w-full md:w-80 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <CharacterList 
          characters={characters}
          onSelect={handleSelectCharacter} 
          selectedId={selectedCharacter.id}
          onAddCharacter={() => setIsCreating(true)}
          onStartGroupChat={handleStartGroupChat}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative w-full h-full bg-gray-900">
        
        {mode === AppMode.CHAT && (
          <ChatInterface 
            character={selectedCharacter}
            onBack={() => setIsSidebarOpen(true)}
            onStartCall={handleStartCall}
          />
        )}

        {mode === AppMode.GROUP_CHAT && (
          <GroupChatInterface 
            characters={groupCharacters}
            onBack={() => {
              setIsSidebarOpen(true);
              setMode(AppMode.CHAT);
            }}
          />
        )}

        {mode === AppMode.LIVE_CALL && (
          <LiveCall 
            character={selectedCharacter}
            onEndCall={handleEndCall}
          />
        )}

      </div>

      {/* Overlay Modal for Character Creation */}
      {isCreating && (
        <CreateCustomModal 
          onClose={() => setIsCreating(false)}
          onCreate={handleAddCharacter}
        />
      )}
    </div>
  );
};

export default App;
