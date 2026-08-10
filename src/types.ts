export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface PricingItem {
  id: string;
  category: 'iphone' | 'android' | 'notebook' | 'other';
  deviceModel: string;
  serviceName: string;
  priceEstimate: string;
  notes?: string;
}

export interface BusinessConfig {
  name: string;
  category: string;
  address: string;
  phone: string;
  businessHours: string;
  specialOffers: string;
  tone: 'professional' | 'friendly' | 'informal' | 'enthusiastic';
  faqs: FAQ[];
  testimonials?: Testimonial[];
  autoRespondWhatsApp: boolean;
  autoRespondReviews: boolean;
  whatsappAccessToken?: string;
  whatsappPhoneNumberId?: string;
  whatsappVerifyToken?: string;
  chatwootUrl?: string;
  chatwootApiAccessToken?: string;
  pricingTable?: PricingItem[];
  mutedPhones?: string[];
}

export interface Testimonial {
  id: string;
  name: string;
  role?: string;
  text: string;
  rating: number;
  avatar?: string;
  date?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'customer' | 'agent' | 'system';
  text: string;
  timestamp: string;
  status?: 'draft' | 'sent' | 'pending_approval';
  mediaUrl?: string;
  mediaType?: 'image' | 'audio' | 'document';
  fileName?: string;
  audioDuration?: number;
}

export interface ChatSession {
  id: string;
  customerName: string;
  customerPhone: string;
  lastMessage: string;
  unreadCount: number;
  messages: ChatMessage[];
  tags?: string[];
  notes?: string;
  isReal?: boolean;
}

export interface GoogleReview {
  id: string;
  authorName: string;
  authorPhoto?: string;
  rating: number;
  comment: string;
  publishDate: string;
  aiResponse?: string;
  responseStatus: 'unanswered' | 'draft' | 'published';
}

export interface AgentLog {
  id: string;
  timestamp: string;
  type: 'whatsapp_received' | 'whatsapp_sent' | 'review_received' | 'review_replied' | 'system';
  description: string;
  meta?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  publishedAt: string;
  views: number;
  readTime: string;
}

/**
 * Retorna a URL completa da API se estiver rodando em ambiente estático externo (como Netlify ou Firebase Hosting),
 * apontando diretamente para o servidor Cloud Run do AI Studio que possui o banco de dados e motor de IA.
 */
export const getApiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return cleanPath;
};


