export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string; // base64 or object URL
  preview?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  modelUsed?: string;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  modelUsed: string;
  messages: Message[];
}

export interface EditHistoryStep {
  id: string;
  instruction: string;
  image: string;
  timestamp: number;
  toolUsed?: string;
}

export interface GalleryItem {
  id: string;
  userId: string;
  type: 'edit' | 'generation' | 'enhancement';
  title: string;
  prompt: string;
  originalImage?: string;
  resultImage: string;
  aspectRatio?: string;
  style?: string;
  toolUsed?: string;
  createdAt: number;
  tags?: string[];
  history?: EditHistoryStep[];
}

export interface AIModelConfig {
  id: string;
  name: string;
  provider: 'Google Gemini' | 'Luna Engine' | 'Custom';
  modelId: string;
  type: 'multimodal' | 'image-generation' | 'image-editing' | 'text' | 'vision';
  canGenerateImages: boolean;
  canEditImages: boolean;
  canChat: boolean;
  canVision: boolean;
  canFiles: boolean;
  enabled: boolean;
  speed: 'Ultra-fast' | 'Balanced' | 'High-fidelity';
  description: string;
}

export interface AIProvider {
  id: string;
  name: string;
  status: 'connected' | 'unconfigured' | 'error';
  description: string;
}

export interface ToolItem {
  id: string;
  name: string;
  category: 'image-edit' | 'image-gen' | 'enhancer' | 'assistants' | 'vision';
  description: string;
  icon: string;
  badge?: string;
  presetAction?: string;
  samplePrompt?: string;
  targetView: 'create' | 'chat';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatar?: string;
  plan: 'Luna Pro' | 'Luna Enterprise' | 'Free' | 'Luna Nova Pro' | 'Free Tier';
}

export interface AssistantCharacter {
  id: string;
  name: string;
  gender: 'female' | 'male' | 'elder';
  title: string;
  avatar: string;
  description: string;
  systemPromptModifier: string;
  voicePitch: number; // 0.8 to 1.3
  voiceRate: number; // 0.9 to 1.15
  voiceName: string; // Gemini TTS prebuilt voice ('Kore', 'Puck', 'Fenrir', 'Zephyr')
  preferredVoiceKeywords: string[];
}

export type AppView = 'home' | 'chat' | 'create' | 'tools' | 'gallery' | 'history' | 'settings';
