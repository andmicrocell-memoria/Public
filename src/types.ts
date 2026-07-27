export interface FAQ {
  id: string;
  question: string;
  answer: string;
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
}

export interface ChatSession {
  id: string;
  customerName: string;
  customerPhone: string;
  lastMessage: string;
  unreadCount: number;
  messages: ChatMessage[];
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
  
  const isCustomDomain = !window.location.hostname.includes("ais-dev") && 
                         !window.location.hostname.includes("ais-pre") && 
                         window.location.hostname !== "localhost" && 
                         window.location.hostname !== "127.0.0.1";
                         
  if (isCustomDomain) {
    return `https://ais-pre-77naa326rhnp4em4o227eb-516724062260.us-east1.run.app${cleanPath}`;
  }
  return cleanPath;
};


