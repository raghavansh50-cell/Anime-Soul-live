
export interface Character {
  id: string;
  name: string;
  anime: string;
  description: string;
  systemInstruction: string;
  themeColor: string;
  avatarUrl: string;
  isCustom?: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  senderName?: string; // Name of the character speaking if role is 'model'
  imageUrl?: string; // Optional URL for generated image
}

export enum AppMode {
  SELECT = 'SELECT',
  CHAT = 'CHAT',
  LIVE_CALL = 'LIVE_CALL',
  GROUP_CHAT = 'GROUP_CHAT'
}
