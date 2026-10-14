import {
  AIModelConfig,
  AIProvider,
  Conversation,
  GalleryItem,
  Message,
} from '../types';

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(endpoint, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.error || 'Something went wrong. Please try again.',
      data.details
    );
  }

  return data as T;
}

export const api = {
  // Health
  checkHealth: () => request<{ status: string; geminiActive: boolean }>('/api/health'),

  // Models
  getModels: () =>
    request<{ models: AIModelConfig[]; providers: AIProvider[] }>('/api/models'),

  toggleModel: (id: string, enabled: boolean) =>
    request<{ success: boolean; model: AIModelConfig }>(`/api/models/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    }),

  // Chat
  sendMessage: (payload: {
    messages: { role: string; content: string }[];
    attachments?: any[];
    modelId?: string;
    conversationId?: string;
    customSystemPrompt?: string;
  }) =>
    request<{ content: string; modelUsed: string; latencyMs: number }>('/api/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // HD AI Voice Synthesis (Gemini 3.8 Flash TTS / Podcast Studio Quality)
  generateSpeech: (payload: {
    text: string;
    voiceName?: string;
    character?: string;
  }) =>
    request<{
      success: boolean;
      audioUrl?: string;
      modelUsed?: string;
      voiceName?: string;
      reason?: string;
    }>('/api/voice/tts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Image Generation
  generateImage: (payload: {
    prompt: string;
    aspectRatio?: string;
    style?: string;
    quality?: string;
    negativePrompt?: string;
    userId?: string;
  }) =>
    request<{ success: boolean; image: GalleryItem; modelUsed: string; latencyMs: number }>(
      '/api/image/generate',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  // Image Editing
  editImage: (payload: {
    originalImage: string;
    instruction: string;
    toolUsed?: string;
    preserveHistory?: boolean;
    userId?: string;
  }) =>
    request<{ success: boolean; image: GalleryItem; modelUsed: string; latencyMs: number }>(
      '/api/image/edit',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  // Image Enhancement Tools (Remove BG, 4K Upscale, Lighting, Restore, Face)
  enhanceImage: (payload: {
    image: string;
    actionType: string;
    parameters?: Record<string, any>;
    userId?: string;
  }) =>
    request<{ success: boolean; image: GalleryItem; modelUsed: string; latencyMs: number }>(
      '/api/image/enhance',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  // Conversations
  getConversations: (userId?: string) =>
    request<{ conversations: Conversation[] }>(
      `/api/conversations${userId ? `?userId=${userId}` : ''}`
    ),

  getConversation: (id: string) =>
    request<{ conversation: Conversation }>(`/api/conversations/${id}`),

  createConversation: (payload: { title?: string; modelUsed?: string; userId?: string }) =>
    request<{ conversation: Conversation }>('/api/conversations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateConversation: (
    id: string,
    payload: { title?: string; messages?: Message[] }
  ) =>
    request<{ success: boolean; conversation: Conversation }>(
      `/api/conversations/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    ),

  deleteConversation: (id: string) =>
    request<{ success: boolean }>(`/api/conversations/${id}`, {
      method: 'DELETE',
    }),

  // Gallery
  getGallery: (userId?: string) =>
    request<{ items: GalleryItem[] }>(`/api/gallery${userId ? `?userId=${userId}` : ''}`),

  saveToGallery: (item: Partial<GalleryItem>) =>
    request<{ success: boolean; item: GalleryItem }>('/api/gallery', {
      method: 'POST',
      body: JSON.stringify(item),
    }),

  deleteFromGallery: (id: string) =>
    request<{ success: boolean }>(`/api/gallery/${id}`, {
      method: 'DELETE',
    }),

  // Admin Metrics
  getAdminMetrics: () =>
    request<{
      metrics: any;
      stats: {
        totalConversations: number;
        totalCreations: number;
        activeModelsCount: number;
        uptimeSeconds: number;
      };
      models: AIModelConfig[];
    }>('/api/admin/metrics'),
};
