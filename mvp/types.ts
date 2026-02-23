export enum Screen {
  HOME = 'HOME',
  CHAT = 'CHAT',
  FAMILY = 'FAMILY',
  ACTIVITIES = 'ACTIVITIES',
  SETTINGS = 'SETTINGS',
  SEARCH = 'SEARCH',
  MENU = 'MENU',
  MANAGEMENT = 'MANAGEMENT',
  FAMILY_PORTAL = 'FAMILY_PORTAL',
  JITSI_BRIDGE = 'JITSI_BRIDGE'
}

export interface Contact {
  id: string;
  name: string;
  relation: string;
  imageUrl: string;
  isOnline: boolean;
}

export interface NewsItem {
  title: string;
  source: string;
  imageUrl: string;
}

export type Persona = 'alicia' | 'zakaria';

export interface PersonaConfig {
  name: string;
  voiceName: string;
  systemInstruction: string;
}
