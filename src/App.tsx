import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  MessageSquare,
  Star,
  Settings,
  Activity,
  Send,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Phone,
  User,
  MapPin,
  Clock,
  Briefcase,
  Sliders,
  Check,
  Bot,
  HelpCircle,
  ThumbsUp,
  MessageCircle,
  ChevronRight,
  Shield,
  Info,
  BookOpen,
  Globe,
  Volume2,
  VolumeX,
  Search,
  Tag,
  FileText,
  Paperclip,
  Image as ImageIcon,
  Mic,
  Download,
  Play,
  Share2,
  DollarSign,
  TrendingUp,
  X
} from "lucide-react";
import { 
  FAQ, 
  BusinessConfig, 
  ChatMessage, 
  ChatSession, 
  GoogleReview, 
  AgentLog,
  getApiUrl,
  Testimonial,
  PricingItem
} from "./types";
import PublicSite from "./components/PublicSite";
import BlogAdmin from "./components/BlogAdmin";
import staticConfig from "../data/config.json";
import logoUrl from "./assets/images/regenerated_image_1783646296675.png";
import { db, doc, getDoc, setDoc } from "./firebase";


export default function App() {
  // 1. Initial State Pre-Population tailored for "AndMicrocell"
  const defaultFAQList: FAQ[] = [
    {
      id: "faq-1",
      question: "Quanto tempo demora para trocar a tela do celular?",
      answer: "Geralmente realizamos a troca de tela em até 2 horas para os modelos mais comuns (iPhone, Samsung, Motorola, Xiaomi). Entre em contato para confirmar a disponibilidade da peça em estoque!"
    },
    {
      id: "faq-2",
      question: "Vocês dão garantia nos consertos?",
      answer: "Sim! Oferecemos garantia completa em todos os nossos serviços e peças substituídas. Dependendo do tipo de reparo e componente utilizado, oferecemos prazos de garantia de 90, 180 ou até 360 dias contra qualquer defeito de fabricação, assegurando total cuidado e tranquilidade para o seu aparelho."
    },
    {
      id: "faq-3",
      question: "Vocês fazem orçamento gratuito?",
      answer: "Sim! Não cobramos nenhuma taxa de avaliação. O orçamento para o conserto do seu celular, tablet ou notebook é 100% gratuito e sem compromisso."
    },
    {
      id: "faq-4",
      question: "Fazem reparos em placas e aparelhos molhados?",
      answer: "Fazemos sim! Realizamos desoxidação química profissional em aparelhos que caíram na água e também reparos avançados de microssolda em placas de celulares e notebooks. Nossa especialidade técnica é a reconstrução de placas de iPhone, solucionando falhas de carga, curto-circuito, Face ID, Wi-Fi e sinal."
    },
    {
      id: "faq-5",
      question: "Vocês consertam apenas iPhones ou atendem outras marcas?",
      answer: "Embora tenhamos uma alta especialização técnica com equipamentos dedicados para reparos avançados em placas e componentes de iPhones, nós também atendemos com o mesmo zelo e precisão as marcas Samsung, Motorola, Xiaomi, além de notebooks e tablets de diversos modelos."
    }
  ];

  const defaultTestimonialList: Testimonial[] = [
    {
      id: "t-1",
      name: "João Pedro",
      role: "Proprietário de iPhone 13 Pro",
      text: "Excelente trabalho na troca de tela do meu iPhone 13 Pro. Ficou perfeito, com True Tone ativo e me deram película de brinde. Atendimento de primeira em Caruaru!",
      rating: 5,
      avatar: "JP",
      date: "Há 2 dias"
    },
    {
      id: "t-2",
      name: "Mariana Souza",
      role: "Cliente de Caruaru",
      text: "Levei meu celular que tinha caído na água e outra assistência disse que não tinha conserto. O pessoal da AndMicrocell ressuscitou a placa! Nota 10 pelo profissionalismo e agilidade.",
      rating: 5,
      avatar: "MS",
      date: "Há 1 semana"
    },
    {
      id: "t-3",
      name: "Carlos Eduardo",
      role: "Cliente Satisfeito",
      text: "Troquei a bateria do meu aparelho. Serviço super rápido, preço justo e garantia de verdade. Recomendo demais para quem busca confiança e qualidade em Caruaru.",
      rating: 5,
      avatar: "CE",
      date: "Há 3 dias"
    },
    {
      id: "t-4",
      name: "Ana Beatriz",
      role: "Cliente",
      text: "Atendimento impecável! O orçamento é de fato gratuito e explicaram tudo certinho antes de mexer no aparelho. O celular ficou novinho e o pós-venda deles é sensacional.",
      rating: 5,
      avatar: "AB",
      date: "Há 5 dias"
    }
  ];

  const defaultPricingTableList: PricingItem[] = [
    { id: "p-1", category: "iphone", deviceModel: "iPhone 11", serviceName: "Troca de Tela Premium (OLED)", priceEstimate: "A partir de R$ 320", notes: "Tela qualidade premium com True Tone ativo naturalmente." },
    { id: "p-2", category: "iphone", deviceModel: "iPhone 11", serviceName: "Troca de Bateria Premium", priceEstimate: "A partir de R$ 180", notes: "Excelente durabilidade, similar à original de fábrica." },
    { id: "p-3", category: "iphone", deviceModel: "iPhone 12", serviceName: "Troca de Tela Premium (OLED)", priceEstimate: "A partir de R$ 550", notes: "Tela qualidade premium com True Tone ativo." },
    { id: "p-4", category: "iphone", deviceModel: "iPhone 12", serviceName: "Troca de Bateria Premium", priceEstimate: "A partir de R$ 260", notes: "Excelente durabilidade, similar à original de fábrica." },
    { id: "p-5", category: "iphone", deviceModel: "iPhone 13", serviceName: "Troca de Tela Premium (OLED)", priceEstimate: "A partir de R$ 850", notes: "Tela premium, cores e toque perfeitos." },
    { id: "p-6", category: "iphone", deviceModel: "iPhone 13", serviceName: "Troca de Bateria Premium", priceEstimate: "A partir de R$ 350", notes: "Excelente durabilidade, similar à original de fábrica." },
    { id: "p-7", category: "android", deviceModel: "Samsung Linha S (S20/S21)", serviceName: "Troca de Tela Premium", priceEstimate: "A partir de R$ 650", notes: "Qualidade premium com alta definição de toque." },
    { id: "p-8", category: "notebook", deviceModel: "Notebooks (Dell, Lenovo, HP, etc)", serviceName: "Instalação de SSD 240GB + Limpeza Interna + Formatação", priceEstimate: "A partir de R$ 220", notes: "Garante até 10x mais velocidade de inicialização." },
    { id: "p-9", category: "notebook", deviceModel: "Notebooks (Dell, Lenovo, HP, etc)", serviceName: "Instalação de SSD 480GB + Limpeza Interna + Formatação", priceEstimate: "A partir de R$ 290", notes: "Garante até 10x mais velocidade de inicialização e muito mais espaço." },
    { id: "p-10", category: "notebook", deviceModel: "Notebooks (Qualquer marca)", serviceName: "Limpeza Física Interna + Troca de Pasta Térmica Prata", priceEstimate: "R$ 100", notes: "Essencial para evitar lentidão e desligamento por superaquecimento." },
    { id: "p-11", category: "iphone", deviceModel: "iPhone (Qualquer modelo)", serviceName: "Serviço Adicional de Transplante (EEPROM ou BMS)", priceEstimate: "R$ 150 adicionais", notes: "Procedimento de micro-solda opcional para remover a mensagem de peça desconhecida." },
    { id: "p-12", category: "other", deviceModel: "Celulares (Geral)", serviceName: "Desoxidação Química Profissional (Aparelhos molhados)", priceEstimate: "A partir de R$ 120", notes: "Processo de lavagem química em cuba ultrassônica para remover oxidações." }
  ];

  const defaultBusinessConfig: BusinessConfig = {
    name: "AndMicrocell - Assistência Técnica",
    category: "Consertos em Iphones. Reparos avançados em Placas.",
    address: "Travessa das Flores, 167 Salgado - Caruaru/PE",
    phone: "+55 81 98182-6072",
    businessHours: "Segunda a Sexta: 08h às 12h e das 14h às 18h | Sábados: 09h às 13h",
    specialOffers: "Película de vidro grátis na troca de qualquer tela | Orçamento 100% gratuito!",
    tone: "friendly",
    faqs: defaultFAQList,
    testimonials: defaultTestimonialList,
    autoRespondWhatsApp: true,
    autoRespondReviews: true,
    pricingTable: defaultPricingTableList,
    mutedPhones: []
  };

  const defaultSessions: ChatSession[] = [
    {
      id: "session-1",
      customerName: "Claudio Ferreira",
      customerPhone: "+55 11 99123-4455",
      lastMessage: "Olá, gostaria de saber se trocam bateria do iPhone 11?",
      unreadCount: 1,
      messages: [
        { id: "m1", sender: "customer", text: "Olá, gostaria de saber se trocam bateria do iPhone 11?", timestamp: "18:25" }
      ],
      tags: ["Orçamento", "Novo"],
      notes: "Interessado na troca de bateria do iPhone 11 de alta capacidade. Informado o valor estimado de R$ 220,00."
    },
    {
      id: "session-2",
      customerName: "Patrícia Gomes",
      customerPhone: "+55 11 98877-6655",
      lastMessage: "Que horas vocês fecham hoje?",
      unreadCount: 0,
      messages: [
        { id: "m2", sender: "customer", text: "Olá! Tudo bem?", timestamp: "16:10" },
        { id: "m3", sender: "agent", text: "Olá, Patrícia! Tudo ótimo por aqui e com você? Como posso te ajudar hoje?", timestamp: "16:11" },
        { id: "m4", sender: "customer", text: "Que horas vocês fecham hoje?", timestamp: "16:12" }
      ],
      tags: ["Sem Resposta"],
      notes: "Cliente perguntou o horário de funcionamento. Fechamos às 18:00."
    },
    {
      id: "session-3",
      customerName: "Carlos Eduardo",
      customerPhone: "+55 11 97755-3311",
      lastMessage: "Obrigado pelas informações, amanhã levo o aparelho aí.",
      unreadCount: 0,
      messages: [
        { id: "m5", sender: "customer", text: "Vocês consertam notebook que não liga?", timestamp: "14:05" },
        { id: "m6", sender: "agent", text: "Sim, Carlos! Fazemos reparo completo em notebooks de todas as marcas (telas, teclados, placa-mãe, formatação e upgrade de SSD). O orçamento é gratuito!", timestamp: "14:07" },
        { id: "m7", sender: "customer", text: "Obrigado pelas informações, amanhã levo o aparelho aí.", timestamp: "14:10" }
      ],
      tags: ["Aparelho Pronto"],
      notes: "Notebook Dell Inspiron sem ligar. Trata-se de recondicionamento de conector Jack DC e limpeza. Retirada agendada."
    }
  ];

  const defaultReviews: GoogleReview[] = [
    {
      id: "rev-1",
      authorName: "Roberto Alencar",
      rating: 5,
      comment: "Serviço espetacular! Trocaram a tela do meu Samsung em menos de 1 hora e o atendimento foi excelente. Indico a AndMicrocell de olhos fechados!",
      publishDate: "Hoje mais cedo",
      responseStatus: "unanswered"
    },
    {
      id: "rev-2",
      authorName: "Mariana Souza",
      rating: 4,
      comment: "Muito prestativos. O notebook ficou ótimo com o SSD novo. Demorou só um pouquinho a mais do que o combinado para entregar, mas o preço foi muito justo.",
      publishDate: "Ontem",
      responseStatus: "unanswered"
    },
    {
      id: "rev-3",
      authorName: "Thiago Lima",
      rating: 2,
      comment: "Fiz um orçamento de placa e achei um pouco caro em comparação a outra loja do bairro, embora o atendimento tenha sido educado.",
      publishDate: "Há 3 dias",
      responseStatus: "unanswered"
    }
  ];

  const defaultLogs: AgentLog[] = [
    { id: "log-1", timestamp: "18:25", type: "whatsapp_received", description: "Nova mensagem de WhatsApp recebida", meta: "Claudio Ferreira (+55 11 99123-4455)" },
    { id: "log-2", timestamp: "18:00", type: "system", description: "Agente IA sincronizado com Google Meu Negócio", meta: "4 FAQs importados" },
    { id: "log-3", timestamp: "16:12", type: "whatsapp_received", description: "Mensagem recebida de Patrícia Gomes", meta: "Que horas fecham hoje?" }
  ];

  // 2. Load LocalStorage or fallback to defaults
  const [config, setConfig] = useState<BusinessConfig>(() => {
    const saved = localStorage.getItem("and_microcell_config");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.faqs) {
          parsed.faqs = parsed.faqs.map((f: any) => {
            if (f.id === "faq-2" && (f.answer.includes("90 dias contra") || f.answer.includes("completa de 90 dias"))) {
              return {
                ...f,
                answer: "Sim! Oferecemos garantia completa em todos os nossos serviços e peças substituídas. Dependendo do tipo de reparo e componente utilizado, oferecemos prazos de garantia de 90, 180 ou até 360 dias contra qualquer defeito de fabricação, assegurando total cuidado e tranquilidade para o seu aparelho."
              };
            }
            return f;
          });
        }
        if (!parsed.testimonials || parsed.testimonials.length === 0) {
          parsed.testimonials = defaultTestimonialList;
        }
        if (!parsed.pricingTable || parsed.pricingTable.length === 0) {
          parsed.pricingTable = defaultPricingTableList;
        }
        return parsed;
      } catch (e) {
        return defaultBusinessConfig;
      }
    }
    return defaultBusinessConfig;
  });

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem("and_microcell_sessions");
    return saved ? JSON.parse(saved) : defaultSessions;
  });

  const [realSessions, setRealSessions] = useState<ChatSession[]>([]);
  const [isFetchingSessions, setIsFetchingSessions] = useState(false);
  const [sessionSource, setSessionSource] = useState<'all' | 'real' | 'simulated'>('all');

  const [reviews, setReviews] = useState<GoogleReview[]>(() => {
    const saved = localStorage.getItem("and_microcell_reviews");
    return saved ? JSON.parse(saved) : defaultReviews;
  });

  const [logs, setLogs] = useState<AgentLog[]>(() => {
    const saved = localStorage.getItem("and_microcell_logs");
    return saved ? JSON.parse(saved) : defaultLogs;
  });

  // Mobile Web App specific states
  const [isMobileChatOnly, setIsMobileChatOnly] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mobile_chat_only") === "true") {
      localStorage.setItem("and_microcell_mobile_chat_only", "true");
      return true;
    }
    const saved = localStorage.getItem("and_microcell_mobile_chat_only");
    if (saved !== null) {
      return saved === "true";
    }
    const isMobileDevice = typeof window !== 'undefined' && (
      window.innerWidth <= 768 ||
      window.matchMedia('(display-mode: standalone)').matches ||
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    );
    return isMobileDevice;
  });
  const [mobileActiveSection, setMobileActiveSection] = useState<'list' | 'chat'>('list');

  // WhatsApp Advanced states (Client-ready & CRM style)
  const [soundNotificationActive, setSoundNotificationActive] = useState<boolean>(() => {
    const saved = localStorage.getItem("and_microcell_sound_notification");
    return saved !== null ? saved === "true" : true;
  });
  const [searchSessionQuery, setSearchSessionQuery] = useState<string>("");
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>("all");
  const [showAttachmentMenu, setShowAttachmentMenu] = useState<boolean>(false);
  const [showTagMenu, setShowTagMenu] = useState<boolean>(false);

  // Sound chime synthesizer using standard Web Audio API (cross-browser, lightweight, zero assets needed)
  const playNotificationSound = () => {
    if (!soundNotificationActive) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      const audioCtx = new AudioCtxClass();
      
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";

      // Perfect clean double digital chime "ding-ding" (D5 followed by A5)
      osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc1.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // A5

      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);

      osc1.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.45);
    } catch (e) {
      console.warn("AudioContext chime failed to play:", e);
    }
  };

  useEffect(() => {
    localStorage.setItem("and_microcell_sound_notification", soundNotificationActive ? "true" : "false");
  }, [soundNotificationActive]);

  // 3. UI State Managers
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings' | 'integration' | 'blog' | 'pricing'>('dashboard');
  const [crmTab, setCrmTab] = useState<'profile' | 'ai_adjust'>('profile');
  const [quickFaqQ, setQuickFaqQ] = useState("");
  const [quickFaqA, setQuickFaqA] = useState("");
  const [isViewingPublicSite, setIsViewingPublicSite] = useState(() => {
    const isAiStudio = window.location.hostname.includes("run.app") || 
                       window.location.hostname.includes("localhost") || 
                       window.location.hostname.includes("127.0.0.1") ||
                       window.location.hostname.includes("stackblitz");

    // Permite que o subdomínio 'app.andmicrocell.com.br' (ou qualquer 'app.') acesse o painel administrativo
    if (window.location.hostname.startsWith("app.")) {
      return false;
    }

    // De maneira nenhuma exibe o painel em outros domínios customizados (como www.andmicrocell.com.br ou andmicrocell.com.br)
    if (!isAiStudio) {
      return true;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("admin") === "true") {
      return false;
    }
    if (params.get("site") === "true") {
      return true;
    }

    return window.location.pathname.startsWith("/blog") || 
           window.location.pathname.startsWith("/site") || 
           window.location.pathname.startsWith("/public-site");
  });
  const [selectedSessionId, setSelectedSessionId] = useState<string>("session-1");
  const [whatsappInputValue, setWhatsappInputValue] = useState("");
  const [isAiAnswering, setIsAiAnswering] = useState(false);
  const [typingStatus, setTypingStatus] = useState<"generating" | "typing" | null>(null);
  const [activeFaqQuestion, setActiveFaqQuestion] = useState("");
  const [activeFaqAnswer, setActiveFaqAnswer] = useState("");
  const [isGeneratingReviewReply, setIsGeneratingReviewReply] = useState<string | null>(null);
  const [hasRealApiKey, setHasRealApiKey] = useState<boolean | null>(null);
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [isFetchingWebhookLogs, setIsFetchingWebhookLogs] = useState(false);
  const [tunnelUrl, setTunnelUrl] = useState<string | null>(null);
  const [hasLoadedServerConfig, setHasLoadedServerConfig] = useState(false);
  const [customReviewAuthor, setCustomReviewAuthor] = useState("");
  const [customReviewComment, setCustomReviewComment] = useState("");
  const [customReviewRating, setCustomReviewRating] = useState(5);
  const [showAddReviewForm, setShowAddReviewForm] = useState(false);
  
  // States for Pricing Table management
  const [pricingSearch, setPricingSearch] = useState("");
  const [pricingCategoryFilter, setPricingCategoryFilter] = useState<string>("all");
  const [pricingDeviceModel, setPricingDeviceModel] = useState("");
  const [pricingServiceName, setPricingServiceName] = useState("");
  const [pricingEstimate, setPricingEstimate] = useState("");
  const [pricingNotes, setPricingNotes] = useState("");
  const [pricingCategory, setPricingCategory] = useState<'iphone' | 'android' | 'notebook' | 'other'>("iphone");
  const [editingPricingId, setEditingPricingId] = useState<string | null>(null);
  
  const [activeTestimonialName, setActiveTestimonialName] = useState("");
  const [activeTestimonialRole, setActiveTestimonialRole] = useState("");
  const [activeTestimonialText, setActiveTestimonialText] = useState("");
  const [activeTestimonialRating, setActiveTestimonialRating] = useState(5);
  const [activeTestimonialDate, setActiveTestimonialDate] = useState("Recente");
  
  // Suggested test questions for quick simulation
  const suggestedQuestions = [
    "Quanto custa trocar a tela do iPhone?",
    "Vocês abrem aos sábados?",
    "Onde vocês ficam localizados?",
    "Meu celular molhou, tem conserto?"
  ];

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Local form states for company profile and Chatwoot integration
  const [localCompanyName, setLocalCompanyName] = useState("");
  const [localCompanyCategory, setLocalCompanyCategory] = useState("");
  const [localCompanyPhone, setLocalCompanyPhone] = useState("");
  const [localCompanyHours, setLocalCompanyHours] = useState("");
  const [localCompanyAddress, setLocalCompanyAddress] = useState("");
  const [localCompanyOffers, setLocalCompanyOffers] = useState("");
  const [localCompanyTone, setLocalCompanyTone] = useState<"professional" | "friendly" | "informal" | "enthusiastic">("friendly");

  const [localChatwootUrl, setLocalChatwootUrl] = useState("");
  const [localChatwootToken, setLocalChatwootToken] = useState("");

  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [isSavingChatwoot, setIsSavingChatwoot] = useState(false);
  const [showSavedCompanySuccess, setShowSavedCompanySuccess] = useState(false);
  const [showSavedChatwootSuccess, setShowSavedChatwootSuccess] = useState(false);
  const [isTestingChatwoot, setIsTestingChatwoot] = useState(false);
  const [chatwootTestResult, setChatwootTestResult] = useState<{ success: boolean; message: string; error?: string } | null>(null);

  // Synchronize local states when the configuration has finished loading
  useEffect(() => {
    if (hasLoadedServerConfig) {
      setLocalCompanyName(config.name || "");
      setLocalCompanyCategory(config.category || "");
      setLocalCompanyPhone(config.phone || "");
      setLocalCompanyHours(config.businessHours || "");
      setLocalCompanyAddress(config.address || "");
      setLocalCompanyOffers(config.specialOffers || "");
      setLocalCompanyTone(config.tone || "friendly");
      setLocalChatwootUrl(config.chatwootUrl || "https://atendimento.andmicrocell.com.br");
      setLocalChatwootToken(config.chatwootApiAccessToken || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLoadedServerConfig]);

  const handleSaveCompanyDetails = () => {
    setIsSavingCompany(true);
    setShowSavedCompanySuccess(false);

    handleSaveConfig({
      name: localCompanyName,
      category: localCompanyCategory,
      phone: localCompanyPhone,
      businessHours: localCompanyHours,
      address: localCompanyAddress,
      specialOffers: localCompanyOffers,
      tone: localCompanyTone
    });

    setTimeout(() => {
      setIsSavingCompany(false);
      setShowSavedCompanySuccess(true);
      setTimeout(() => setShowSavedCompanySuccess(false), 4000);
    }, 600);
  };

  const handleSaveChatwootDetails = () => {
    setIsSavingChatwoot(true);
    setShowSavedChatwootSuccess(false);

    const trimmedUrl = localChatwootUrl.trim();
    const sanitizedToken = localChatwootToken.trim().replace(/^Bearer\s+/i, '').replace(/^["']|["']$/g, '').trim();

    // Update local state with sanitized values too
    setLocalChatwootUrl(trimmedUrl);
    setLocalChatwootToken(sanitizedToken);

    handleSaveConfig({
      chatwootUrl: trimmedUrl,
      chatwootApiAccessToken: sanitizedToken
    });

    setTimeout(() => {
      setIsSavingChatwoot(false);
      setShowSavedChatwootSuccess(true);
      setTimeout(() => setShowSavedChatwootSuccess(false), 4000);
    }, 600);
  };

  const handleTestChatwootConnection = () => {
    setIsTestingChatwoot(true);
    setChatwootTestResult(null);

    fetch(getApiUrl("/api/chatwoot/test-connection"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatwootUrl: localChatwootUrl,
        chatwootApiAccessToken: localChatwootToken
      })
    })
      .then(res => res.json())
      .then(data => {
        setIsTestingChatwoot(false);
        if (data.success) {
          setChatwootTestResult({
            success: true,
            message: `Conexão bem sucedida! Conectado como ${data.profile?.name} (${data.profile?.email}).`
          });
        } else {
          setChatwootTestResult({
            success: false,
            message: data.error || "Falha na conexão com o Chatwoot."
          });
        }
      })
      .catch(err => {
        setIsTestingChatwoot(false);
        setChatwootTestResult({
          success: false,
          message: `Erro ao se conectar: ${err.message}`
        });
      });
  };

  // Sync with server on mount
  // Sync with server on mount
  useEffect(() => {
    fetch(getApiUrl("/api/config?t=" + Date.now()))
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("No server config");
      })
      .then(serverData => {
        if (serverData && serverData.name) {
          if (serverData.faqs) {
            serverData.faqs = serverData.faqs.map((f: any) => {
              if (f.id === "faq-2" && (f.answer.includes("90 dias contra") || f.answer.includes("completa de 90 dias"))) {
                return {
                  ...f,
                  answer: "Sim! Oferecemos garantia completa em todos os nossos serviços e peças substituídas. Dependendo do tipo de reparo e componente utilizado, oferecemos prazos de garantia de 90, 180 ou até 360 dias contra qualquer defeito de fabricação, assegurando total cuidado e tranquilidade para o seu aparelho."
                };
              }
              return f;
            });
          }
          if (!serverData.testimonials || serverData.testimonials.length === 0) {
            serverData.testimonials = defaultTestimonialList;
          }
          setConfig(serverData);
        }
        setHasLoadedServerConfig(true);
      })
      .catch((err) => {
        console.warn("Using static config fallback:", err);
        const saved = localStorage.getItem("and_microcell_config");
        if (saved) {
          try {
            setConfig(JSON.parse(saved));
          } catch (e) {
            setConfig(staticConfig as any);
          }
        } else {
          setConfig(staticConfig as any);
        }
        
        fetch(getApiUrl("/api/config"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config)
        }).catch(e => console.debug("Not running on dynamic server, skipping seed"));
        
        setHasLoadedServerConfig(true);
      });

    // Fetch tunnel URL on mount
    fetch(getApiUrl("/api/tunnel?t=" + Date.now()))
      .then(res => res.json())
      .then(data => {
        if (data && data.url) {
          setTunnelUrl(data.url);
        }
      })
      .catch(err => console.error("Error fetching tunnel URL:", err));
  }, []);

  // 4. Save to localStorage when state changes and sync to server
  useEffect(() => {
    if (!hasLoadedServerConfig) return;
    localStorage.setItem("and_microcell_config", JSON.stringify(config));
    
    // Always save directly to the server, which then writes to Firestore safely
    fetch(getApiUrl("/api/config"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config)
    }).catch(err => console.error("Error saving server config:", err));
  }, [config, hasLoadedServerConfig]);

  useEffect(() => {
    localStorage.setItem("and_microcell_sessions", JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem("and_microcell_reviews", JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem("and_microcell_logs", JSON.stringify(logs));
  }, [logs]);

  // Scroll to bottom of simulated chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, selectedSessionId]);

  // Probe API key state on server load
  useEffect(() => {
    fetch(getApiUrl("/api/health?t=" + Date.now()))
      .then(r => r.json())
      .then(() => {
        // Just verify server communication is OK
        setHasRealApiKey(true);
      })
      .catch(() => {
        setHasRealApiKey(false);
      });
  }, []);

  const fetchWebhookLogs = async () => {
    setIsFetchingWebhookLogs(true);
    try {
      const res = await fetch(getApiUrl("/api/webhook/logs?t=" + Date.now()));
      if (res.ok) {
        const data = await res.json();
        setWebhookLogs(data);
      }
    } catch (e) {
      console.error("Error fetching webhook logs:", e);
    } finally {
      setIsFetchingWebhookLogs(false);
    }
  };

  const clearWebhookLogs = async () => {
    try {
      const res = await fetch(getApiUrl("/api/webhook/logs/clear"), { method: "POST" });
      if (res.ok) {
        fetchWebhookLogs();
      }
    } catch (e) {
      console.error("Error clearing logs:", e);
    }
  };

  const fetchRealSessions = async () => {
    setIsFetchingSessions(true);
    try {
      const res = await fetch(getApiUrl("/api/whatsapp/sessions?t=" + Date.now()));
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data)) {
          setRealSessions(data);
        }
      }
    } catch (e) {
      console.error("Error fetching real WhatsApp sessions:", e);
    } finally {
      setIsFetchingSessions(false);
    }
  };

  // Poll real WhatsApp sessions every 4 seconds to provide a true real-time dashboard experience
  useEffect(() => {
    fetchRealSessions();
    const interval = setInterval(() => {
      fetchRealSessions();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Poll webhook logs when in the integration tab
  useEffect(() => {
    if (activeTab === 'integration') {
      fetchWebhookLogs();
      const interval = setInterval(fetchWebhookLogs, 4000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // 5. Action Functions
  const addLog = (type: AgentLog['type'], description: string, meta?: string) => {
    const now = new Date();
    const timeStr = now.toTimeString().substring(0, 5);
    const newLog: AgentLog = {
      id: `log-${Date.now()}`,
      timestamp: timeStr,
      type,
      description,
      meta
    };
    setLogs(prev => [newLog, ...prev.slice(0, 29)]); // keep last 30 logs
  };

  const handleSendCustomerMessage = async (customText?: string) => {
    const textToSend = customText || whatsappInputValue;
    if (!textToSend.trim()) return;

    if (!customText) {
      setWhatsappInputValue("");
    }

    const currentSession = sessions.find(s => s.id === selectedSessionId);
    if (!currentSession) return;

    const now = new Date();
    const timeStr = now.toTimeString().substring(0, 5);
    const newCustomerMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "customer",
      text: textToSend,
      timestamp: timeStr
    };

    // Append customer message
    const updatedMessages = [...currentSession.messages, newCustomerMsg];
    
    setSessions(prev => prev.map(s => {
      if (s.id === selectedSessionId) {
        return {
          ...s,
          lastMessage: textToSend,
          unreadCount: 0,
          messages: updatedMessages
        };
      }
      return s;
    }));

    // Play chime sound
    playNotificationSound();

    addLog("whatsapp_received", `Mensagem do cliente no WhatsApp`, `${currentSession.customerName}: "${textToSend.substring(0, 30)}..."`);

    // Check if the chat is muted (silenced)
    const cleanPhoneStr = currentSession.customerPhone.replace(/\D/g, "");
    const isMuted = (config.mutedPhones || []).some(p => p.replace(/\D/g, "") === cleanPhoneStr);

    if (isMuted) {
      setTimeout(() => {
        const systemInfoMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: "system",
          text: "Robô Silenciado para esta conversa. O atendimento deve ser feito manualmente pelo WhatsApp.",
          timestamp: timeStr
        };
        setSessions(prev => prev.map(s => {
          if (s.id === selectedSessionId) {
            return {
              ...s,
              messages: [...updatedMessages, systemInfoMsg]
            };
          }
          return s;
        }));
        addLog("system", `Robô Silenciado para ${currentSession.customerName}`, "IA não respondeu para respeitar o silêncio configurado.");
      }, 500);
      return;
    }

    // Prepare AI Answer
    setIsAiAnswering(true);
    setTypingStatus("generating");

    try {
      // Call live Gemini Express backend endpoint
      const response = await fetch(getApiUrl("/api/agent/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config,
          messages: updatedMessages.map(m => ({ sender: m.sender, text: m.text }))
        })
      });

      const data = await response.json();
      const aiResponseText = data.text;

      // Handle response based on Automatic vs Assisted Mode
      const isAuto = config.autoRespondWhatsApp;
      const responseStatus: ChatMessage['status'] = isAuto ? "sent" : "pending_approval";

      // Instantly change status to typing to start progressive animation
      setTypingStatus("typing");

      // We'll add an empty placeholder message first, then fill it word-by-word
      const msgId = `msg-${Date.now() + 1}`;
      const newAiMsgPlaceholder: ChatMessage = {
        id: msgId,
        sender: "agent",
        text: "",
        timestamp: new Date().toTimeString().substring(0, 5),
        status: responseStatus
      };

      setSessions(prev => prev.map(s => {
        if (s.id === selectedSessionId) {
          return {
            ...s,
            messages: [...updatedMessages, newAiMsgPlaceholder]
          };
        }
        return s;
      }));

      // Type words progressively
      const words = aiResponseText.split(" ");
      let currentTypedText = "";
      let wordIndex = 0;

      const typingInterval = setInterval(() => {
        if (wordIndex < words.length) {
          currentTypedText += (wordIndex === 0 ? "" : " ") + words[wordIndex];
          wordIndex++;

          setSessions(prev => prev.map(s => {
            if (s.id === selectedSessionId) {
              return {
                ...s,
                lastMessage: isAuto ? currentTypedText : "Rascunho de IA gerado",
                messages: s.messages.map(m => m.id === msgId ? { ...m, text: currentTypedText } : m)
              };
            }
            return s;
          }));
        } else {
          clearInterval(typingInterval);
          setIsAiAnswering(false);
          setTypingStatus(null);

          if (isAuto) {
            addLog("whatsapp_sent", `IA respondeu automaticamente no WhatsApp`, `Para ${currentSession.customerName}`);
          } else {
            addLog("system", `Rascunho de resposta gerado pela IA`, `Aguardando aprovação para ${currentSession.customerName}`);
          }
        }
      }, 70); // 70ms per word is highly natural

    } catch (err) {
      console.error(err);
      addLog("system", "Erro ao gerar resposta com a IA", "Verifique o log do servidor.");
      setIsAiAnswering(false);
      setTypingStatus(null);
    }
  };

  const [isSendingManual, setIsSendingManual] = useState(false);

  const handleSendManualMessage = async (customText?: string) => {
    const text = customText !== undefined ? customText : whatsappInputValue;
    if (!text.trim()) return;
    const currentSession = combinedSessions.find(s => s.id === selectedSessionId);
    if (!currentSession) return;

    if (customText === undefined) {
      setWhatsappInputValue("");
    }
    setIsSendingManual(true);

    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const newManualMsg: ChatMessage = {
        id: `msg-manual-${Date.now()}`,
        sender: "agent",
        text,
        timestamp: timeStr
      };

      // Add optimistically to realSessions
      setRealSessions(prev => prev.map(s => {
        if (s.id === selectedSessionId) {
          return {
            ...s,
            lastMessage: text,
            messages: [...s.messages, newManualMsg]
          };
        }
        return s;
      }));

      // Call Express manual send route
      const response = await fetch(getApiUrl("/api/whatsapp/send"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerPhone: currentSession.customerPhone,
          text
        })
      });

      if (response.ok) {
        addLog("whatsapp_sent", `Mensagem manual enviada via painel`, `Para ${currentSession.customerName}`);
      } else {
        console.warn("Failed to send manual WhatsApp message backend");
      }
      
      // Refresh real-time sessions instantly
      fetchRealSessions();
    } catch (e) {
      console.error("Error sending manual WhatsApp message:", e);
    } finally {
      setIsSendingManual(false);
    }
  };

  const handleApproveDraft = (msgId: string) => {
    setSessions(prev => prev.map(s => {
      if (s.id === selectedSessionId) {
        const updatedMsgs = s.messages.map(m => {
          if (m.id === msgId) {
            return { ...m, status: "sent" as const };
          }
          return m;
        });
        const approvedMsg = s.messages.find(m => m.id === msgId);
        return {
          ...s,
          lastMessage: approvedMsg ? approvedMsg.text : s.lastMessage,
          messages: updatedMsgs
        };
      }
      return s;
    }));

    const currentSession = sessions.find(s => s.id === selectedSessionId);
    addLog("whatsapp_sent", `Rascunho de IA aprovado e enviado`, `Para ${currentSession?.customerName}`);
  };

  const handleRejectDraft = (msgId: string) => {
    setSessions(prev => prev.map(s => {
      if (s.id === selectedSessionId) {
        return {
          ...s,
          messages: s.messages.filter(m => m.id !== msgId)
        };
      }
      return s;
    }));
    addLog("system", `Rascunho de IA descartado pelo usuário`);
  };

  const handleToggleMuteChat = () => {
    const currentSession = sessions.find(s => s.id === selectedSessionId);
    if (!currentSession) return;
    const cleanPhoneStr = currentSession.customerPhone.replace(/\D/g, "");
    const currentlyMuted = config.mutedPhones || [];
    let updatedMuted: string[];
    if (currentlyMuted.some(p => p.replace(/\D/g, "") === cleanPhoneStr)) {
      updatedMuted = currentlyMuted.filter(p => p.replace(/\D/g, "") !== cleanPhoneStr);
      addLog("system", `Robô REATIVADO para ${currentSession.customerName}`);
    } else {
      updatedMuted = [...currentlyMuted, cleanPhoneStr];
      addLog("system", `Robô SILENCIADO para ${currentSession.customerName}`);
    }
    handleSaveConfig({ mutedPhones: updatedMuted });
  };

  const handleUpdateSessionNotes = (sessionId: string, newNotes: string) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, notes: newNotes } : s));
    setRealSessions(prev => prev.map(s => s.id === sessionId ? { ...s, notes: newNotes } : s));
  };

  const handleUpdateSessionTags = (sessionId: string, newTags: string[]) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, tags: newTags } : s));
    setRealSessions(prev => prev.map(s => s.id === sessionId ? { ...s, tags: newTags } : s));
  };

  const handleSendRichMedia = (type: "image" | "document" | "audio", mediaUrl: string, fileName: string) => {
    const currentSession = sessions.find(s => s.id === selectedSessionId) || realSessions.find(s => s.id === selectedSessionId);
    if (!currentSession) return;

    const now = new Date();
    const timeStr = now.toTimeString().substring(0, 5);
    const textMsg = type === "image" ? "📷 [Imagem]" : type === "document" ? "📄 [Documento PDF]" : "🎙️ [Áudio Gravado]";

    const newMsg: ChatMessage = {
      id: `rich-${Date.now()}`,
      sender: "agent",
      text: textMsg,
      timestamp: timeStr,
      mediaUrl,
      mediaType: type,
      fileName
    };

    if (currentSession.isReal) {
      setRealSessions(prev => prev.map(s => {
        if (s.id === selectedSessionId) {
          return {
            ...s,
            lastMessage: textMsg,
            messages: [...s.messages, newMsg]
          };
        }
        return s;
      }));
    } else {
      setSessions(prev => prev.map(s => {
        if (s.id === selectedSessionId) {
          return {
            ...s,
            lastMessage: textMsg,
            messages: [...s.messages, newMsg]
          };
        }
        return s;
      }));
    }

    addLog("whatsapp_sent", `Anexo (${type}) enviado via CRM`, `${currentSession.customerName}: "${fileName}"`);
  };

  const handleGenerateReviewReply = async (reviewId: string) => {
    const targetReview = reviews.find(r => r.id === reviewId);
    if (!targetReview) return;

    setIsGeneratingReviewReply(reviewId);
    addLog("system", `Gerando resposta automática para avaliação`, `Cliente: ${targetReview.authorName}`);

    try {
      const response = await fetch(getApiUrl("/api/agent/review-reply"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config,
          rating: targetReview.rating,
          comment: targetReview.comment,
          authorName: targetReview.authorName
        })
      });

      const data = await response.json();
      
      setReviews(prev => prev.map(r => {
        if (r.id === reviewId) {
          return {
            ...r,
            aiResponse: data.reply,
            responseStatus: "draft"
          };
        }
        return r;
      }));

      addLog("system", `Rascunho de resposta de avaliação gerado`, `Avaliação de ${targetReview.rating} estrelas`);
    } catch (err) {
      console.error(err);
      addLog("system", "Erro ao gerar resposta de avaliação");
    } finally {
      setIsGeneratingReviewReply(null);
    }
  };

  const handlePublishReviewReply = (reviewId: string) => {
    setReviews(prev => prev.map(r => {
      if (r.id === reviewId) {
        return {
          ...r,
          responseStatus: "published"
        };
      }
      return r;
    }));
    const reviewObj = reviews.find(r => r.id === reviewId);
    addLog("review_replied", `Resposta publicada no Google Meu Negócio`, `Cliente: ${reviewObj?.authorName}`);
  };

  const handleDeleteReviewReply = (reviewId: string) => {
    setReviews(prev => prev.map(r => {
      if (r.id === reviewId) {
        return {
          ...r,
          aiResponse: undefined,
          responseStatus: "unanswered"
        };
      }
      return r;
    }));
    addLog("system", `Resposta de avaliação descartada`);
  };

  // 6. Settings Form Actions
  const handleSaveConfig = (newFields: Partial<BusinessConfig>) => {
    setConfig(prev => ({ ...prev, ...newFields }));
    addLog("system", `Configurações da empresa atualizadas`);
  };

  const handleAddFaq = () => {
    if (!activeFaqQuestion.trim() || !activeFaqAnswer.trim()) return;
    const newFaq: FAQ = {
      id: `faq-${Date.now()}`,
      question: activeFaqQuestion,
      answer: activeFaqAnswer
    };
    const updatedFaqs = [...config.faqs, newFaq];
    setConfig(prev => ({ ...prev, faqs: updatedFaqs }));
    setActiveFaqQuestion("");
    setActiveFaqAnswer("");
    addLog("system", `Nova FAQ cadastrada na Base de Conhecimento`, activeFaqQuestion);
  };

  const handleDeleteFaq = (id: string) => {
    const faqObj = config.faqs.find(f => f.id === id);
    const updatedFaqs = config.faqs.filter(f => f.id !== id);
    setConfig(prev => ({ ...prev, faqs: updatedFaqs }));
    addLog("system", `FAQ removida da Base de Conhecimento`, faqObj?.question);
  };

  const handleAddTestimonial = () => {
    if (!activeTestimonialName.trim() || !activeTestimonialText.trim()) return;
    const initials = activeTestimonialName
      .trim()
      .split(/\s+/)
      .map(n => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    const newTestimonial: Testimonial = {
      id: `t-${Date.now()}`,
      name: activeTestimonialName,
      role: activeTestimonialRole.trim() ? activeTestimonialRole : "Cliente",
      text: activeTestimonialText,
      rating: activeTestimonialRating,
      avatar: initials || "C",
      date: activeTestimonialDate || "Recente"
    };

    const currentTestimonials = config.testimonials || [];
    const updatedTestimonials = [...currentTestimonials, newTestimonial];
    setConfig(prev => ({ ...prev, testimonials: updatedTestimonials }));
    setActiveTestimonialName("");
    setActiveTestimonialRole("");
    setActiveTestimonialText("");
    setActiveTestimonialRating(5);
    setActiveTestimonialDate("Recente");
    addLog("system", `Novo depoimento de cliente adicionado`, activeTestimonialName);
  };

  const handleDeleteTestimonial = (id: string) => {
    const currentTestimonials = config.testimonials || [];
    const testimonialObj = currentTestimonials.find(t => t.id === id);
    const updatedTestimonials = currentTestimonials.filter(t => t.id !== id);
    setConfig(prev => ({ ...prev, testimonials: updatedTestimonials }));
    addLog("system", `Depoimento de cliente removido`, testimonialObj?.name);
  };

  const handleSavePricingItem = () => {
    if (!pricingDeviceModel.trim() || !pricingServiceName.trim() || !pricingEstimate.trim()) return;
    
    const table = config.pricingTable || [];
    
    if (editingPricingId) {
      const updatedTable = table.map(item => {
        if (item.id === editingPricingId) {
          return {
            ...item,
            category: pricingCategory,
            deviceModel: pricingDeviceModel,
            serviceName: pricingServiceName,
            priceEstimate: pricingEstimate,
            notes: pricingNotes
          };
        }
        return item;
      });
      setConfig(prev => ({ ...prev, pricingTable: updatedTable }));
      addLog("system", `Preço atualizado para ${pricingDeviceModel}`, pricingServiceName);
      setEditingPricingId(null);
    } else {
      const newItem: PricingItem = {
        id: `p-${Date.now()}`,
        category: pricingCategory,
        deviceModel: pricingDeviceModel,
        serviceName: pricingServiceName,
        priceEstimate: pricingEstimate,
        notes: pricingNotes
      };
      setConfig(prev => ({ ...prev, pricingTable: [...table, newItem] }));
      addLog("system", `Novo preço cadastrado para ${pricingDeviceModel}`, pricingServiceName);
    }
    
    setPricingDeviceModel("");
    setPricingServiceName("");
    setPricingEstimate("");
    setPricingNotes("");
    setPricingCategory("iphone");
  };

  const handleDeletePricingItem = (id: string) => {
    const table = config.pricingTable || [];
    const itemObj = table.find(item => item.id === id);
    const updatedTable = table.filter(item => item.id !== id);
    setConfig(prev => ({ ...prev, pricingTable: updatedTable }));
    addLog("system", `Serviço removido da tabela de preços`, itemObj?.deviceModel);
  };

  const handleStartEditPricingItem = (item: PricingItem) => {
    setEditingPricingId(item.id);
    setPricingCategory(item.category);
    setPricingDeviceModel(item.deviceModel);
    setPricingServiceName(item.serviceName);
    setPricingEstimate(item.priceEstimate);
    setPricingNotes(item.notes || "");
  };

  const handleCancelEditPricingItem = () => {
    setEditingPricingId(null);
    setPricingDeviceModel("");
    setPricingServiceName("");
    setPricingEstimate("");
    setPricingNotes("");
    setPricingCategory("iphone");
  };

  const handleSimulateNewReview = (rating: number, comment: string, author: string) => {
    const newRev: GoogleReview = {
      id: `rev-${Date.now()}`,
      authorName: author,
      rating,
      comment,
      publishDate: "Agora mesmo",
      responseStatus: "unanswered"
    };
    setReviews(prev => [newRev, ...prev]);
    addLog("review_received", `Nova avaliação recebida no Google Meu Negócio`, `${author}: ${rating} estrelas`);
  };

  const handleSimulateNewChat = (name: string, phone: string, initialMessage: string) => {
    const newSessionId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newSessionId,
      customerName: name,
      customerPhone: phone,
      lastMessage: initialMessage,
      unreadCount: 1,
      messages: [
        { id: `m-${Date.now()}`, sender: "customer", text: initialMessage, timestamp: new Date().toTimeString().substring(0, 5) }
      ]
    };
    setSessions(prev => [newSession, ...prev]);
    setSelectedSessionId(newSessionId);
    setActiveTab("whatsapp");
    addLog("whatsapp_received", `Nova conversa iniciada no WhatsApp`, `${name} (${phone})`);
  };

  // Combine real and simulated sessions
  const combinedSessions = [
    ...realSessions.map(s => ({ ...s, isReal: true })),
    ...sessions.map(s => ({ ...s, isReal: false }))
  ];

  // Filter based on selected source, search query and CRM tag
  const displayedSessions = combinedSessions.filter(s => {
    // 1. Filter by source (real vs simulated)
    if (sessionSource === 'real' && !s.isReal) return false;
    if (sessionSource === 'simulated' && s.isReal) return false;

    // 2. Filter by search query
    if (searchSessionQuery.trim()) {
      const q = searchSessionQuery.toLowerCase();
      const matchName = s.customerName.toLowerCase().includes(q);
      const matchPhone = s.customerPhone.replace(/\D/g, "").includes(q.replace(/\D/g, "")) || s.customerPhone.includes(q);
      if (!matchName && !matchPhone) return false;
    }

    // 3. Filter by tag
    if (selectedTagFilter !== 'all') {
      const contactTags = s.tags || [];
      if (!contactTags.includes(selectedTagFilter)) return false;
    }

    return true;
  });

  const selectedSession = combinedSessions.find(s => s.id === selectedSessionId) || displayedSessions[0] || combinedSessions[0];

  if (isViewingPublicSite) {
    const isAiStudio = window.location.hostname.includes("run.app") || 
                       window.location.hostname.includes("localhost") || 
                       window.location.hostname.includes("127.0.0.1") ||
                       window.location.hostname.includes("stackblitz");
    
    const showBackBanner = isAiStudio;

    return (
      <PublicSite 
        config={config} 
        onBackToAdmin={showBackBanner ? (() => setIsViewingPublicSite(false)) : undefined} 
      />
    );
  }

  if (isMobileChatOnly) {
    return (
      <div className="h-[100dvh] max-h-[100dvh] bg-[#090e17] text-slate-100 font-sans flex flex-col overflow-hidden" id="mobile-chat-app-root">
        {/* Mobile Header */}
        <header className="bg-[#0b101d] border-b border-slate-800/80 px-4 py-3 shrink-0 flex items-center justify-between z-50" id="mobile-header">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
              <img 
                src={logoUrl} 
                alt="AndMicrocell Logo" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer" 
              />
            </div>
            <div className="min-w-0">
              <h1 className="font-display font-extrabold text-sm text-white tracking-tight flex items-center gap-1.5 truncate">
                AndMicrocell Chat 📱
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium truncate">WhatsApp Profissional</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={fetchRealSessions}
              disabled={isFetchingSessions}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Sincronizar Mensagens"
            >
              <RefreshCw className={`w-4 h-4 ${isFetchingSessions ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
            <button
              onClick={() => {
                setIsMobileChatOnly(false);
                localStorage.setItem("and_microcell_mobile_chat_only", "false");
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white cursor-pointer flex items-center gap-1"
              title="Voltar ao Painel Geral"
            >
              <span>Painel</span>
              <span className="text-xs">🖥️</span>
            </button>
          </div>
        </header>

        {/* Mobile Body Content */}
        <main className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
          {mobileActiveSection === 'list' ? (
            /* CONVERSATION LIST VIEW */
            <div className="flex-1 flex flex-col min-h-0 bg-[#070b12]" id="mobile-chat-list-view">
              {/* Quick Filters */}
              <div className="p-2.5 bg-[#0b101d] border-b border-slate-800/60 shrink-0">
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800/40">
                  <button
                    onClick={() => setSessionSource('all')}
                    className={`py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                      sessionSource === 'all'
                        ? 'bg-slate-900 text-white border border-slate-800 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Todas ({combinedSessions.length})
                  </button>
                  <button
                    onClick={() => setSessionSource('real')}
                    className={`py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      sessionSource === 'real'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Reais ({realSessions.length})
                  </button>
                  <button
                    onClick={() => setSessionSource('simulated')}
                    className={`py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                      sessionSource === 'simulated'
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Testes ({sessions.length})
                  </button>
                </div>
              </div>

              {/* List Scroll Area */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {displayedSessions.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs font-medium">
                    Nenhuma conversa encontrada nesta aba.
                  </div>
                ) : (
                  displayedSessions.map((sess) => {
                    const isMuted = (config.mutedPhones || []).some(
                      p => p.replace(/\D/g, "") === sess.customerPhone.replace(/\D/g, "")
                    );

                    return (
                      <button
                        key={sess.id}
                        onClick={() => {
                          setSelectedSessionId(sess.id);
                          setMobileActiveSection('chat');
                          if (sess.isReal) {
                            setRealSessions(prev => prev.map(s => s.id === sess.id ? { ...s, unreadCount: 0 } : s));
                          } else {
                            setSessions(prev => prev.map(s => s.id === sess.id ? { ...s, unreadCount: 0 } : s));
                          }
                          setTimeout(() => {
                            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
                          }, 100);
                        }}
                        className="w-full p-3.5 rounded-2xl border text-left transition-all flex items-start justify-between gap-3 bg-[#0d1321]/90 border-slate-800/80 hover:bg-[#11192b] active:bg-[#151e33] cursor-pointer shadow-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs font-bold text-slate-100 truncate">{sess.customerName}</p>
                            
                            {sess.isReal ? (
                              <span className="text-[9px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">
                                Real
                              </span>
                            ) : (
                              <span className="text-[9px] bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">
                                Teste
                              </span>
                            )}

                            {sess.unreadCount > 0 && (
                              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                            )}
                            
                            {isMuted && (
                              <span className="flex items-center gap-0.5 text-[9px] bg-rose-500/15 border border-rose-500/30 text-rose-400 px-1.5 py-0.5 rounded font-semibold shrink-0" title="Robô Silenciado">
                                <VolumeX className="w-2.5 h-2.5" /> Silenciado
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{sess.customerPhone}</p>
                          <p className="text-xs text-slate-300 mt-1.5 truncate font-medium">{sess.lastMessage || "Sem mensagens"}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 mt-1" />
                      </button>
                    );
                  })
                )}
              </div>

              {/* Bottom mode indicator */}
              <div className="p-2 bg-[#0b101d] border-t border-slate-800/60 text-center shrink-0">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Aplicativo de Celular Ativo
                </span>
              </div>
            </div>
          ) : (
            /* ACTIVE CHAT DIALOG VIEW */
            <div className="flex-1 flex flex-col min-h-0 bg-[#070b12]" id="mobile-chat-dialog-view">
              {/* Chat Header (Shrink-0 at top of flex) */}
              <div className="p-2.5 bg-[#0b101d] border-b border-slate-800/80 flex items-center justify-between gap-2 shrink-0 z-10">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={() => setMobileActiveSection('list')}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white mr-1 flex items-center gap-1 text-xs font-bold cursor-pointer shrink-0"
                  >
                    Voltar
                  </button>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{selectedSession?.customerName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{selectedSession?.customerPhone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Quick Mute Toggle Right on Header */}
                  <button
                    onClick={async () => {
                      if (!selectedSession) return;
                      const cleanNumber = selectedSession.customerPhone.replace(/\D/g, "");
                      const isCurrentlyMuted = (config.mutedPhones || []).some(p => p.replace(/\D/g, "") === cleanNumber);
                      let newMutedList = [...(config.mutedPhones || [])];
                      if (isCurrentlyMuted) {
                        newMutedList = newMutedList.filter(p => p.replace(/\D/g, "") !== cleanNumber);
                        addLog("system", `Robô Reativado para +${cleanNumber}`, "Respostas automáticas de IA liberadas.");
                      } else {
                        newMutedList.push(selectedSession.customerPhone);
                        addLog("system", `Robô Silenciado para +${cleanNumber}`, "Respostas automáticas desativadas temporariamente.");
                      }
                      await handleSaveConfig({ mutedPhones: newMutedList });
                    }}
                    className={`p-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center ${
                      (config.mutedPhones || []).some(p => p.replace(/\D/g, "") === selectedSession?.customerPhone?.replace(/\D/g, ""))
                        ? "bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30"
                        : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                    title={(config.mutedPhones || []).some(p => p.replace(/\D/g, "") === selectedSession?.customerPhone?.replace(/\D/g, "")) ? "Robô silenciado. Clique para reativar" : "Clique para silenciar o Robô para este contato"}
                  >
                    <VolumeX className="w-4 h-4" />
                  </button>

                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                    selectedSession?.isReal
                      ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                      : "bg-indigo-500/15 border border-indigo-500/30 text-indigo-400"
                  }`}>
                    {selectedSession?.isReal ? "Real" : "Teste"}
                  </span>
                </div>
              </div>

              {/* Messages Area (Flex-1 scrollable) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                {(!selectedSession?.messages || selectedSession.messages.length === 0) ? (
                  <div className="text-center text-slate-500 text-xs py-10">
                    Nenhuma mensagem nesta conversa.
                  </div>
                ) : (
                  selectedSession.messages.map((msg: any, idx: number) => {
                    const isCustomer = msg.sender === "customer";
                    return (
                      <div
                        key={msg.id || idx}
                        className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl p-3 shadow-md ${
                            isCustomer
                              ? 'bg-slate-900 text-slate-100 rounded-tl-sm border border-slate-800'
                              : 'bg-emerald-600 text-white rounded-tr-sm'
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span className={`text-[9px] font-mono ${isCustomer ? 'text-slate-400' : 'text-emerald-100'}`}>
                              {msg.timestamp || "09:00"}
                            </span>
                            {!isCustomer && (
                              <Check className="w-3 h-3 text-emerald-100 shrink-0" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef}></div>
              </div>

              {/* Mobile Quick Replies Menu (Shrink-0 above input) */}
              <div className="bg-[#090e17] border-t border-slate-800/60 px-3 py-2 flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none shrink-0">
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mr-1 shrink-0">
                  ⚡ Rápidas:
                </p>
                <button
                  onClick={() => setWhatsappInputValue("A formatação sem backup fica por R$ 90,00, e com backup completo fica por R$ 110,00. Qual opção você prefere?")}
                  className="px-3 py-1.5 rounded-full bg-[#11192e] border border-slate-800 text-xs text-slate-200 shrink-0 cursor-pointer hover:bg-slate-800 active:bg-slate-700"
                >
                  R$ 90 / R$ 110 Formatação
                </button>
                <button
                  onClick={() => setWhatsappInputValue("Olá! Seja bem-vindo à AndMicrocell. Poderia nos informar a marca, modelo e o defeito do seu aparelho para fazermos um orçamento?")}
                  className="px-3 py-1.5 rounded-full bg-[#11192e] border border-slate-800 text-xs text-slate-200 shrink-0 cursor-pointer hover:bg-slate-800 active:bg-slate-700"
                >
                  Pedir Modelo/Defeito
                </button>
                <button
                  onClick={() => setWhatsappInputValue("Seu aparelho já está pronto e testado! Pode vir retirar na nossa loja quando desejar. Ficamos no aguardo.")}
                  className="px-3 py-1.5 rounded-full bg-[#11192e] border border-slate-800 text-xs text-slate-200 shrink-0 cursor-pointer hover:bg-slate-800 active:bg-slate-700"
                >
                  Aparelho Pronto ✅
                </button>
              </div>

              {/* Mobile Input form (Shrink-0 at bottom) */}
              <div className="p-2.5 bg-[#0b101d] border-t border-slate-800/80 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (isAiAnswering || isSendingManual) return;
                    if (!whatsappInputValue.trim()) return;

                    if (selectedSession?.isReal) {
                      handleSendManualMessage();
                    } else {
                      handleSendCustomerMessage();
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={whatsappInputValue}
                    onChange={(e) => setWhatsappInputValue(e.target.value)}
                    placeholder={selectedSession?.isReal ? "Enviar resposta oficial..." : "Simular resposta cliente..."}
                    disabled={isAiAnswering || isSendingManual}
                    className="flex-1 px-3.5 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-base focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all min-w-0"
                  />
                  <button
                    type="submit"
                    disabled={isAiAnswering || isSendingManual || !whatsappInputValue.trim()}
                    className="h-11 w-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium transition-colors flex items-center justify-center shrink-0 cursor-pointer shadow-md shadow-emerald-600/10"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white flex flex-col" id="app-root-container">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" id="amb-glow-1"></div>
      <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" id="amb-glow-2"></div>

      {/* Main Header */}
      <header className="border-b border-slate-800 bg-[#0b0f19]/80 backdrop-blur-md sticky top-0 z-40" id="header-bar">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4" id="header-inner">
          <div className="flex items-center gap-3.5 group cursor-pointer" id="header-logo-group">
            <div className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300" id="header-badge">
              <img 
                src={logoUrl} 
                alt="AndMicrocell Logo" 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                referrerPolicy="no-referrer" 
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-extrabold text-xl tracking-tight text-white group-hover:text-indigo-400 transition-colors duration-300" id="header-app-title">
                  ZetaChat AI
                </h1>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase" id="header-beta-tag">
                  GMB + WhatsApp
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium transition-colors duration-300 group-hover:text-slate-300" id="header-app-subtitle">
                Agente Autônomo para WhatsApp & Google Meu Negócio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end" id="header-status-group">
            {/* Connection status and GMB sync badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs" id="gmb-status-badge">
              <div className="w-2 h-2 rounded-full bg-emerald-500" id="gmb-status-dot"></div>
              <span className="text-slate-300 font-mono" id="gmb-status-text">Google Business Sincronizado</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs" id="whatsapp-status-badge">
              <Bot className="w-3.5 h-3.5 text-indigo-400" id="whatsapp-bot-icon" />
              <span className="text-indigo-300 font-medium" id="whatsapp-status-text">
                IA: {config.autoRespondWhatsApp ? "Autônoma" : "Copiloto"}
              </span>
            </div>
            <button
              onClick={() => {
                setIsMobileChatOnly(true);
                localStorage.setItem("and_microcell_mobile_chat_only", "true");
                setMobileActiveSection('list');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
              id="btn-toggle-mobile-chat-header"
              title="Alternar para o modo aplicativo de chat otimizado para celulares"
            >
              <Phone className="w-3.5 h-3.5 animate-bounce" />
              <span>Modo Celular 📱</span>
            </button>
            <a
              href={window.location.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
              id="btn-open-standalone-header"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Abrir Solto (Tela Cheia) ↗</span>
            </a>
          </div>
        </div>
      </header>

      {/* Welcome & Instruction Banner */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border-b border-slate-800/80 px-4 py-3" id="welcome-banner">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs md:text-sm text-slate-300">
          <div className="flex items-center gap-2.5" id="banner-left">
            <Info className="w-4 h-4 text-indigo-400 shrink-0" id="banner-info-icon" />
            <span>
              <strong>Bem-vindo de volta!</strong> Este é o workspace inteligente da <strong>{config.name}</strong>. Todas as respostas simuladas são geradas dinamicamente usando a IA do Gemini baseadas no seu perfil e FAQs!
            </span>
          </div>
          <span className="text-slate-400 shrink-0 font-mono" id="banner-right">
            suporte@andmicrocell.com.br
          </span>
        </div>
      </div>

      {/* Main Workspace Grid */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8" id="workspace-main">
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-6" id="workspace-sidebar">
          <div className="p-5 rounded-2xl bg-[#0b101d] border border-slate-800/60" id="sidebar-nav-card">
            <h3 className="text-slate-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-3 px-2" id="nav-label">Navegação</h3>
            <nav className="flex flex-col gap-1.5" id="nav-group">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
                id="btn-nav-dashboard"
              >
                <Activity className="w-4 h-4" />
                <span>Painel Geral</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
                id="btn-nav-settings"
              >
                <Settings className="w-4 h-4" />
                <span>Base de Conhecimento</span>
              </button>

              <button
                onClick={() => setActiveTab('pricing')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  activeTab === 'pricing'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
                id="btn-nav-pricing"
              >
                <Briefcase className="w-4 h-4 text-emerald-400" />
                <span className="flex items-center gap-1.5">
                  Tabela de Preços
                  <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">IA</span>
                </span>
              </button>

              <button
                onClick={() => setActiveTab('blog')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  activeTab === 'blog'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
                id="btn-nav-blog"
              >
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>Mini-Site & Blog</span>
              </button>

              <button
                onClick={() => setActiveTab('integration')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  activeTab === 'integration'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/10'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
                id="btn-nav-integration"
              >
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="flex items-center gap-1.5">
                  Integração Chatwoot
                </span>
              </button>
            </nav>
          </div>
        </aside>

        {/* Dynamic Workspace Workspace Panels */}
        <section className="flex-1 min-w-0" id="workspace-viewport">
          <AnimatePresence mode="wait" id="tab-animate-presence">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
                id="dashboard-tab-panel"
              >
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="dashboard-metrics">
                  <div className="p-5 rounded-2xl bg-[#0b101d] border border-slate-800/60" id="metric-1">
                    <p className="text-slate-500 text-xs font-mono uppercase tracking-wider" id="metric-1-lbl">Atendimentos WhatsApp</p>
                    <div className="flex items-baseline gap-2 mt-2" id="metric-1-val-group">
                      <span className="text-3xl font-display font-black text-white" id="metric-1-val">42</span>
                      <span className="text-emerald-500 text-xs font-semibold font-mono" id="metric-1-pct">Ativo</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1" id="metric-1-desc">Mensagens respondidas via Chatwoot</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#0b101d] border border-slate-800/60" id="metric-2">
                    <p className="text-slate-500 text-xs font-mono uppercase tracking-wider" id="metric-2-lbl">FAQs Ativas</p>
                    <div className="flex items-baseline gap-2 mt-2" id="metric-2-val-group">
                      <span className="text-3xl font-display font-black text-white" id="metric-2-val">{config.faqs.length}</span>
                      <span className="text-indigo-400 text-xs font-mono font-semibold" id="metric-2-cap">Mapeadas</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1" id="metric-2-desc">Base de conhecimento ativa</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#0b101d] border border-slate-800/60" id="metric-3">
                    <p className="text-slate-500 text-xs font-mono uppercase tracking-wider" id="metric-3-lbl">Modelos de Preços</p>
                    <div className="flex items-baseline gap-2 mt-2" id="metric-3-val-group">
                      <span className="text-3xl font-display font-black text-white" id="metric-3-val">{config.prices?.length || 12}</span>
                      <span className="text-emerald-400 text-xs font-mono font-semibold" id="metric-3-cap">Orçamentos</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1" id="metric-3-desc">Modelos de serviços cadastrados</p>
                  </div>
                </div>

                {/* Dashboard Inner Core Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-core">
                  {/* Central status card */}
                  <div className="lg:col-span-2 p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950/20 border border-slate-800/80 flex flex-col justify-between gap-6" id="dashboard-status-banner">
                    <div id="status-banner-header">
                      <div className="flex items-center gap-2 mb-2" id="ai-status-header">
                        <Bot className="text-indigo-400 w-5 h-5 animate-bounce" />
                        <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider font-mono">Status do Robô de Atendimento</span>
                      </div>
                      <h3 className="font-display font-bold text-2xl text-white tracking-tight" id="status-banner-title">
                        Agente pronto e vigiando canais de atendimento
                      </h3>
                      <p className="text-slate-400 text-sm mt-2 leading-relaxed" id="status-banner-text">
                        A inteligência artificial da <strong>AndMicrocell</strong> está integrada ao seu Chatwoot oficial e atende conversas de clientes de forma 100% autônoma. Seus FAQs cadastrados alimentam o contexto cognitivo do Gemini.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4" id="status-banner-checks">
                      <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-start gap-3" id="check-1">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">Integração Chatwoot Webhook</h4>
                          <p className="text-[10px] text-slate-400 mt-1">Conectado e Ativo. Modo: {config.autoRespondWhatsApp ? "Automação Completa" : "Pausado (Apenas manual)"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800 flex items-center justify-between" id="status-banner-action-footer">
                      <div className="flex items-center gap-2" id="status-tag">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" id="pulse-dot"></div>
                        <span className="text-xs font-mono text-slate-400">Atividade em tempo real ativa</span>
                      </div>
                      <button
                        onClick={() => setActiveTab('integration')}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all flex items-center gap-1 cursor-pointer"
                        id="btn-goto-integration"
                      >
                        <span>Configurar Integração Chatwoot</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Log Card */}
                  <div className="p-5 rounded-3xl bg-[#0b101d] border border-slate-800/60 flex flex-col justify-between" id="dashboard-logs-card">
                    <div id="logs-card-header">
                      <h3 className="font-display font-semibold text-base text-white mb-4 px-1" id="logs-title">Logs Recentes do Agente</h3>
                      
                      <div className="space-y-3.5 overflow-y-auto max-h-[300px] pr-1" id="logs-list">
                        {logs.map((log) => (
                          <div key={log.id} className="text-xs border-b border-slate-800/30 pb-2.5 last:border-0" id={`log-item-${log.id}`}>
                            <div className="flex items-center justify-between gap-2" id={`log-meta-${log.id}`}>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                                log.type === 'whatsapp_received' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' :
                                log.type === 'whatsapp_sent' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10' :
                                log.type === 'review_received' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10' :
                                log.type === 'review_replied' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/10' :
                                'bg-slate-800 text-slate-400'
                              }`} id={`log-type-badge-${log.id}`}>
                                {log.type.replace('_', ' ')}
                              </span>
                              <span className="text-slate-500 font-mono text-[10px]" id={`log-time-${log.id}`}>{log.timestamp}</span>
                            </div>
                            <p className="text-slate-300 font-medium mt-1.5" id={`log-desc-${log.id}`}>{log.description}</p>
                            {log.meta && (
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate" id={`log-meta-txt-${log.id}`}>{log.meta}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => setLogs(defaultLogs)}
                      className="w-full mt-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-mono transition-colors cursor-pointer"
                      id="btn-clear-logs"
                    >
                      Resetar Histórico Logs
                    </button>
                  </div>
                </div>
              </motion.div>
            )}



            {activeTab === 'settings' && (
              <motion.div
                key="settings-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                id="settings-tab-panel"
              >
                {/* GMB Sync & Core Company Settings */}
                <div className="lg:col-span-2 p-6 rounded-3xl bg-[#0b101d] border border-slate-800/60 space-y-6" id="company-settings">
                  <div>
                    <h3 className="font-display font-semibold text-base text-white" id="settings-title">Dados da Empresa (Google Meu Negócio)</h3>
                    <p className="text-xs text-slate-500 mt-1" id="settings-subtitle">Essas informações são puxadas do Google e servem como a base de dados principal para as respostas da IA.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="settings-form">
                    <div id="fld-name">
                      <label className="block text-xs font-mono text-slate-400 mb-1.5">Nome Comercial</label>
                      <input
                        type="text"
                        value={localCompanyName}
                        onChange={(e) => setLocalCompanyName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                        id="input-company-name"
                      />
                    </div>

                    <div id="fld-cat">
                      <label className="block text-xs font-mono text-slate-400 mb-1.5">Categoria / Segmento</label>
                      <input
                        type="text"
                        value={localCompanyCategory}
                        onChange={(e) => setLocalCompanyCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                        id="input-company-category"
                      />
                    </div>

                    <div id="fld-phone">
                      <label className="block text-xs font-mono text-slate-400 mb-1.5">WhatsApp / Telefone</label>
                      <input
                        type="text"
                        value={localCompanyPhone}
                        onChange={(e) => setLocalCompanyPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                        id="input-company-phone"
                      />
                    </div>

                    <div id="fld-hours">
                      <label className="block text-xs font-mono text-slate-400 mb-1.5">Horários de Atendimento</label>
                      <input
                        type="text"
                        value={localCompanyHours}
                        onChange={(e) => setLocalCompanyHours(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                        id="input-company-hours"
                      />
                    </div>

                    <div className="md:col-span-2" id="fld-addr">
                      <label className="block text-xs font-mono text-slate-400 mb-1.5">Endereço Físico</label>
                      <input
                        type="text"
                        value={localCompanyAddress}
                        onChange={(e) => setLocalCompanyAddress(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                        id="input-company-address"
                      />
                    </div>

                    <div className="md:col-span-2" id="fld-offers">
                      <label className="block text-xs font-mono text-slate-400 mb-1.5">Ofertas Especiais / Promoções</label>
                      <textarea
                        value={localCompanyOffers}
                        onChange={(e) => setLocalCompanyOffers(e.target.value)}
                        className="w-full h-16 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 resize-none"
                        id="textarea-company-offers"
                      />
                    </div>

                    <div className="md:col-span-2" id="fld-tone">
                      <label className="block text-xs font-mono text-slate-400 mb-1.5">Tom de Voz do Agente IA</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2" id="tone-selector">
                        {[
                          { id: 'professional', label: 'Profissional', desc: 'Sério e polido' },
                          { id: 'friendly', label: 'Amigável', desc: 'Prestativo e caloroso' },
                          { id: 'informal', label: 'Informal', desc: 'Descontraído' },
                          { id: 'enthusiastic', label: 'Entusiasta', desc: 'Energético e alegre' }
                        ].map((t) => {
                          const isSelected = localCompanyTone === t.id;
                          return (
                            <button
                              key={t.id}
                              onClick={() => setLocalCompanyTone(t.id as any)}
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                isSelected 
                                  ? 'bg-indigo-600/15 border-indigo-500 text-indigo-300' 
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                              id={`btn-tone-${t.id}`}
                            >
                              <p className="text-xs font-bold">{t.label}</p>
                              <p className="text-[9px] mt-0.5 opacity-80">{t.desc}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Botão de Salvar com feedback visual claro */}
                    <div className="md:col-span-2 pt-4 flex items-center justify-between gap-4 border-t border-slate-800/40 mt-2" id="company-save-container">
                      <button
                        onClick={handleSaveCompanyDetails}
                        disabled={isSavingCompany}
                        className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                          isSavingCompany
                            ? 'bg-slate-800 text-slate-500'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/10'
                        }`}
                        id="btn-save-company-details"
                      >
                        {isSavingCompany ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" id="spin-save-company"></div>
                            <span>Salvando Alterações...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" id="svg-save-company">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Salvar Dados da Empresa</span>
                          </>
                        )}
                      </button>

                      {showSavedCompanySuccess && (
                        <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium animate-pulse" id="company-save-success-indicator">
                          <svg className="w-4 h-4 text-emerald-400 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Alterações salvas com sucesso!</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* FAQ Knowledge Base */}
                <div className="p-6 rounded-3xl bg-[#0b101d] border border-slate-800/60 flex flex-col justify-between" id="faq-settings">
                  <div className="space-y-4" id="faq-settings-header">
                    <div>
                      <h3 className="font-display font-semibold text-base text-white" id="faq-title">Perguntas Frequentes (FAQs)</h3>
                      <p className="text-xs text-slate-500 mt-1" id="faq-subtitle">Adicione as dúvidas mais comuns dos seus clientes para treinar as respostas da IA.</p>
                    </div>

                    {/* FAQ Form */}
                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3" id="faq-form">
                      <div id="fld-faq-q">
                        <input
                          type="text"
                          value={activeFaqQuestion}
                          onChange={(e) => setActiveFaqQuestion(e.target.value)}
                          placeholder="Ex: Vocês aceitam parcelamento?"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none"
                          id="input-faq-q"
                        />
                      </div>
                      <div id="fld-faq-a">
                        <textarea
                          value={activeFaqAnswer}
                          onChange={(e) => setActiveFaqAnswer(e.target.value)}
                          placeholder="Ex: Sim, parcelamos em até 12x no cartão de crédito, sendo até 3x sem juros."
                          className="w-full h-16 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none resize-none"
                          id="textarea-faq-a"
                        />
                      </div>
                      <button
                        onClick={handleAddFaq}
                        disabled={!activeFaqQuestion.trim() || !activeFaqAnswer.trim()}
                        className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-xs font-semibold text-white transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        id="btn-add-faq"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Cadastrar Dúvida</span>
                      </button>
                    </div>

                    {/* FAQ List */}
                    <div className="space-y-2.5 overflow-y-auto max-h-[250px] pr-1" id="faqs-scroll-list">
                      {config.faqs.map((faq) => (
                        <div key={faq.id} className="p-3.5 rounded-xl bg-slate-900/30 border border-slate-800/80 flex items-start justify-between gap-3" id={`faq-item-${faq.id}`}>
                          <div className="min-w-0" id={`faq-item-content-${faq.id}`}>
                            <p className="text-xs font-bold text-slate-200" id={`faq-q-text-${faq.id}`}>{faq.question}</p>
                            <p className="text-[11px] text-slate-400 mt-1 leading-normal" id={`faq-a-text-${faq.id}`}>{faq.answer}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteFaq(faq.id)}
                            className="text-slate-600 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                            id={`btn-del-faq-${faq.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setConfig(prev => ({ ...prev, faqs: defaultFAQList }));
                      addLog("system", `FAQs restauradas para o padrão`);
                    }}
                    className="w-full mt-6 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-500 hover:text-slate-300 text-xs font-mono transition-colors cursor-pointer"
                    id="btn-reset-faqs"
                  >
                    Restaurar FAQs Padrão
                  </button>
                </div>

                {/* Testimonials Knowledge Base */}
                <div className="p-6 rounded-3xl bg-[#0b101d] border border-slate-800/60 flex flex-col justify-between lg:col-span-3" id="testimonials-settings">
                  <div className="space-y-4" id="testimonials-settings-header">
                    <div>
                      <h3 className="font-display font-semibold text-base text-white flex items-center gap-2" id="testimonials-title">
                        <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                        <span>Depoimentos dos Clientes (Prova Social)</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-1" id="testimonials-subtitle">Gerencie os depoimentos positivos de clientes reais mostrados no seu site público para aumentar as vendas.</p>
                    </div>

                    {/* Testimonial Form */}
                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3" id="testimonials-form">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div id="fld-testimonial-name">
                          <label className="block text-[10px] font-mono text-slate-500 mb-1">Nome do Cliente</label>
                          <input
                            type="text"
                            value={activeTestimonialName}
                            onChange={(e) => setActiveTestimonialName(e.target.value)}
                            placeholder="Ex: João Pedro"
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none"
                            id="input-testimonial-name"
                          />
                        </div>
                        <div id="fld-testimonial-role">
                          <label className="block text-[10px] font-mono text-slate-500 mb-1">Modelo de Aparelho / Detalhe</label>
                          <input
                            type="text"
                            value={activeTestimonialRole}
                            onChange={(e) => setActiveTestimonialRole(e.target.value)}
                            placeholder="Ex: Proprietário de iPhone 13 Pro"
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none"
                            id="input-testimonial-role"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div id="fld-testimonial-rating">
                          <label className="block text-[10px] font-mono text-slate-500 mb-1">Nota da Avaliação</label>
                          <select
                            value={activeTestimonialRating}
                            onChange={(e) => setActiveTestimonialRating(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none"
                            id="select-testimonial-rating"
                          >
                            <option value={5}>5 Estrelas ★★★★★</option>
                            <option value={4}>4 Estrelas ★★★★</option>
                            <option value={3}>3 Estrelas ★★★</option>
                            <option value={2}>2 Estrelas ★★</option>
                            <option value={1}>1 Estrela ★</option>
                          </select>
                        </div>
                        <div id="fld-testimonial-date">
                          <label className="block text-[10px] font-mono text-slate-500 mb-1">Data ou Tempo Decorrido</label>
                          <input
                            type="text"
                            value={activeTestimonialDate}
                            onChange={(e) => setActiveTestimonialDate(e.target.value)}
                            placeholder="Ex: Há 2 dias, 15/05/2026"
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none"
                            id="input-testimonial-date"
                          />
                        </div>
                      </div>

                      <div id="fld-testimonial-text">
                        <label className="block text-[10px] font-mono text-slate-500 mb-1">Depoimento / Comentário do Cliente</label>
                        <textarea
                          value={activeTestimonialText}
                          onChange={(e) => setActiveTestimonialText(e.target.value)}
                          placeholder="Ex: Excelente trabalho na troca de tela do meu celular. Preço excelente e atendimento muito de confiança!"
                          className="w-full h-16 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none resize-none"
                          id="textarea-testimonial-text"
                        />
                      </div>

                      <button
                        onClick={handleAddTestimonial}
                        disabled={!activeTestimonialName.trim() || !activeTestimonialText.trim()}
                        className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-xs font-semibold text-white transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        id="btn-add-testimonial"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Cadastrar Depoimento</span>
                      </button>
                    </div>

                    {/* Testimonials List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto max-h-[300px] pr-1" id="testimonials-scroll-list">
                      {(config.testimonials || []).map((t) => (
                        <div key={t.id} className="p-3.5 rounded-xl bg-slate-900/30 border border-slate-800/80 flex items-start justify-between gap-3" id={`testimonial-item-${t.id}`}>
                          <div className="min-w-0 flex gap-3" id={`testimonial-item-content-${t.id}`}>
                            <div className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xs font-bold font-mono shrink-0">
                              {t.avatar || "C"}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-xs font-bold text-slate-200 truncate">{t.name}</p>
                                <span className="text-[9px] text-slate-500 font-mono">({t.role || 'Cliente'})</span>
                              </div>
                              <div className="flex items-center gap-0.5 mt-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`w-2.5 h-2.5 ${i < (t.rating || 5) ? "text-amber-400 fill-amber-400" : "text-slate-700"}`} 
                                  />
                                ))}
                                <span className="text-[9px] text-slate-500 ml-1.5 font-mono">{t.date || 'Recente'}</span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1.5 leading-normal italic">"{t.text}"</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteTestimonial(t.id)}
                            className="text-slate-600 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer shrink-0"
                            id={`btn-del-testimonial-${t.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setConfig(prev => ({ ...prev, testimonials: defaultTestimonialList }));
                      addLog("system", `Depoimentos de clientes restaurados para o padrão`);
                    }}
                    className="w-full mt-6 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-500 hover:text-slate-300 text-xs font-mono transition-colors cursor-pointer"
                    id="btn-reset-testimonials"
                  >
                    Restaurar Depoimentos Padrão
                  </button>
                </div>

                {/* Mobile App PWA Installation Card */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0b101d] to-[#0d162d] border border-slate-800/80 lg:col-span-3 space-y-5 shadow-lg" id="pwa-installation-card">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-widest animate-pulse">Recomendado</span>
                        <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                          <Phone className="w-5 h-5 text-emerald-400" />
                          <span>Instale o Aplicativo Oficial de Chat no Celular (Sem Loja de Apps)</span>
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400">
                        Converta o painel em um aplicativo móvel direto de chat e rode no seu smartphone exatamente como um aplicativo nativo baixado da App Store ou Play Store.
                      </p>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[10px] text-slate-400 font-mono">
                      Tecnologia PWA Ativa ✅
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                    {/* iOS Safari Instructions */}
                    <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-850/60 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-slate-900 flex items-center justify-center text-xs font-bold text-slate-300"></span>
                        <h4 className="text-xs font-bold text-slate-200">Como instalar no iPhone (Safari)</h4>
                      </div>
                      <ol className="text-xs text-slate-400 space-y-2 list-decimal list-inside pl-1 leading-relaxed">
                        <li>Abra o link do painel no navegador <strong className="text-slate-200">Safari</strong> do seu iPhone.</li>
                        <li>Toque no botão de <strong className="text-slate-200">Compartilhar</strong> (ícone de um quadrado com uma seta para cima na barra inferior).</li>
                        <li>Role a tela para baixo e selecione <strong className="text-slate-200">"Adicionar à Tela de Início"</strong>.</li>
                        <li>Confirme clicando em <strong className="text-slate-200">"Adicionar"</strong> no topo direito. Pronto! O app surgirá na sua tela principal.</li>
                      </ol>
                    </div>

                    {/* Android Chrome Instructions */}
                    <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-850/60 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-slate-900 flex items-center justify-center text-xs font-bold text-slate-300">🤖</span>
                        <h4 className="text-xs font-bold text-slate-200">Como instalar no Android (Chrome)</h4>
                      </div>
                      <ol className="text-xs text-slate-400 space-y-2 list-decimal list-inside pl-1 leading-relaxed">
                        <li>Abra o link do painel no navegador <strong className="text-slate-200">Chrome</strong> do seu celular.</li>
                        <li>Clique nos <strong className="text-slate-200">três pontinhos</strong> no canto superior direito do navegador.</li>
                        <li>Selecione a opção <strong className="text-slate-200">"Instalar aplicativo"</strong> ou <strong className="text-slate-200">"Adicionar à tela inicial"</strong>.</li>
                        <li>Clique em <strong className="text-slate-200">"Instalar"</strong>. O aplicativo será adicionado à sua tela inicial em segundos.</li>
                      </ol>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-start gap-3.5 leading-relaxed">
                    <span className="text-base shrink-0">✨</span>
                    <p>
                      <strong>Comportamento Inteligente:</strong> Ao abrir pelo ícone instalado no celular, o sistema detecta que você está no smartphone e **carrega instantaneamente apenas o app de Chat (Modo Celular)**. Caso precise ver o painel administrativo completo no celular, basta clicar no botão <strong className="underline">"Painel 🖥️"</strong> no topo da tela!
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'blog' && (
              <motion.div
                key="blog-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="w-full"
                id="blog-tab-panel"
              >
                <BlogAdmin 
                  config={config} 
                  onViewPublicSite={() => setIsViewingPublicSite(true)} 
                  addLog={addLog}
                />
              </motion.div>
            )}

            {activeTab === 'integration' && (
              <motion.div
                key="integration-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full"
                id="integration-tab-panel"
              >
                {/* Integration Credentials Setup */}
                <div className="lg:col-span-2 p-6 rounded-3xl bg-[#0b101d] border border-slate-800/60 space-y-6" id="integration-config-panel">
                  <div>
                    <h3 className="font-display font-semibold text-base text-white flex items-center gap-2" id="integration-title">
                      <Shield className="w-5 h-5 text-emerald-400 animate-pulse" />
                      Integração Oficial do Robô com o Chatwoot
                    </h3>
                    <p className="text-xs text-slate-400 mt-1" id="integration-subtitle">
                      Mantenha o seu assistente virtual de inteligência artificial conectado diretamente à sua instância do Chatwoot para responder aos seus clientes no WhatsApp de forma 100% automática.
                    </p>
                  </div>

                  {/* Webhook Endpoint Copy Box */}
                  <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-4" id="webhook-copy-box">
                    <p className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      URL do Webhook do seu Robô (Copie e configure no seu Chatwoot)
                    </p>
                    
                    <div className="space-y-4">
                      <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                        <span className="text-[11px] font-semibold text-emerald-400 block flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                          URL de Produção do Webhook
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Cole esta URL nas configurações de Webhooks do seu painel do Chatwoot para encaminhar as mensagens de entrada ao robô.
                        </p>
                        <div className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 mt-2" id="webhook-url-prod">
                          <span className="truncate flex-1 select-all text-[11px] text-emerald-300 font-semibold">
                            {window.location.origin.includes("localhost") || window.location.origin.includes("-dev-")
                              ? "https://app.andmicrocell.com.br/api/webhook/whatsapp"
                              : `${window.location.origin}/api/webhook/whatsapp`}
                          </span>
                          <button 
                            onClick={() => {
                              const publicUrl = window.location.origin.includes("localhost") || window.location.origin.includes("-dev-")
                                ? "https://app.andmicrocell.com.br/api/webhook/whatsapp"
                                : `${window.location.origin}/api/webhook/whatsapp`;
                              navigator.clipboard.writeText(publicUrl);
                              alert("URL do Webhook copiada para a área de transferência!");
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[10px] text-white font-sans font-medium transition-colors cursor-pointer"
                            id="btn-copy-webhook-url"
                          >
                            Copiar URL
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Settings Form */}
                  <div className="space-y-6" id="integration-forms">
                    {/* Chatwoot Config */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">Configurações de Conexão</h4>
                        <div className="flex items-center gap-2" id="toggle-whatsapp-integration">
                          <span className="text-[10px] font-mono text-slate-400">Responder Automaticamente</span>
                          <button
                            onClick={() => handleSaveConfig({ autoRespondWhatsApp: !config.autoRespondWhatsApp })}
                            className={`w-10 h-5.5 rounded-full p-0.5 transition-colors cursor-pointer ${config.autoRespondWhatsApp ? 'bg-indigo-600' : 'bg-slate-800'}`}
                            id="btn-toggle-auto-whatsapp-int"
                          >
                            <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${config.autoRespondWhatsApp ? 'translate-x-4.5' : ''}`}></div>
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="chatwoot-form">
                        <div id="fld-chatwoot-url" className="md:col-span-2">
                          <label className="block text-xs font-mono text-slate-400 mb-1.5 flex justify-between items-center">
                            <span>URL da sua Instância do Chatwoot</span>
                            <span className="text-[10px] text-slate-500 font-sans">Sua instalação do Chatwoot</span>
                          </label>
                          <input
                            type="text"
                            value={localChatwootUrl}
                            onChange={(e) => setLocalChatwootUrl(e.target.value)}
                            placeholder="Ex: https://atendimento.andmicrocell.com.br"
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                            id="input-chatwoot-url"
                          />
                        </div>

                        <div id="fld-chatwoot-token" className="md:col-span-2">
                          <label className="block text-xs font-mono text-slate-400 mb-1.5 flex justify-between items-center">
                            <span>Token de Acesso do Agente (api_access_token)</span>
                            <span className="text-[10px] text-slate-500 font-sans">Token para o robô poder enviar respostas</span>
                          </label>
                          <input
                            type="password"
                            value={localChatwootToken}
                            onChange={(e) => setLocalChatwootToken(e.target.value)}
                            placeholder="Insira o seu api_access_token do Chatwoot"
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                            id="input-chatwoot-token"
                          />
                          <p className="text-[10px] text-amber-500 mt-1.5 leading-relaxed" id="chatwoot-token-warning-note">
                            ⚠️ <strong>Atenção:</strong> NÃO cole o "Segredo do Webhook" aqui. Esse campo exige o seu <strong>Token de Acesso à API do Usuário</strong> pessoal, obtido no menu de Configurações de Perfil (canto inferior esquerdo no Chatwoot) rolando a tela até o final.
                          </p>
                        </div>
                      </div>

                      {/* Botão de Salvar Conexão do Chatwoot com feedback visual */}
                      <div className="pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-slate-800/40 mt-2" id="chatwoot-save-container">
                        <div className="flex flex-wrap gap-2.5">
                          <button
                            onClick={handleSaveChatwootDetails}
                            disabled={isSavingChatwoot}
                            className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                              isSavingChatwoot
                                ? 'bg-slate-800 text-slate-500'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/10'
                            }`}
                            id="btn-save-chatwoot-details"
                          >
                            {isSavingChatwoot ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" id="spin-save-chatwoot"></div>
                                <span>Salvando Integração...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" id="svg-save-chatwoot">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Salvar Configurações</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={handleTestChatwootConnection}
                            disabled={isTestingChatwoot || !localChatwootUrl || !localChatwootToken}
                            className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border ${
                              isTestingChatwoot
                                ? 'bg-slate-800 text-slate-500 border-transparent'
                                : !localChatwootUrl || !localChatwootToken
                                ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                            id="btn-test-chatwoot-details"
                          >
                            {isTestingChatwoot ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" id="spin-test-chatwoot"></div>
                                <span>Testando Conexão...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" id="svg-test-chatwoot">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span>Testar Conexão</span>
                              </>
                            )}
                          </button>
                        </div>

                        {showSavedChatwootSuccess && (
                          <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium animate-pulse" id="chatwoot-save-success-indicator">
                            <svg className="w-4 h-4 text-emerald-400 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Integração salva com sucesso!</span>
                          </div>
                        )}
                      </div>

                      {/* Resultado do Teste de Conexão */}
                      {chatwootTestResult && (
                        <div 
                          className={`p-3.5 rounded-xl text-xs flex gap-2.5 border ${
                            chatwootTestResult.success 
                              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' 
                              : 'bg-rose-950/20 border-rose-500/30 text-rose-400'
                          }`} 
                          id="chatwoot-test-result"
                        >
                          <div className="mt-0.5">
                            {chatwootTestResult.success ? (
                              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold">{chatwootTestResult.success ? "Conexão Estabelecida!" : "Erro de Conexão:"}</p>
                            <p className="mt-1 text-[11px] leading-relaxed opacity-90">{chatwootTestResult.message}</p>
                          </div>
                        </div>
                      )}

                      <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-800/30 text-xs text-slate-400 space-y-2" id="chatwoot-guide-block">
                        <p className="font-semibold text-slate-300">Como obter o Token e configurar o Chatwoot?</p>
                        <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed">
                          <li>No seu painel do Chatwoot, clique em <strong>Configurações do Perfil</strong> (no menu com o seu nome, no canto inferior esquerdo).</li>
                          <li>Role a página até o final e copie o seu **Token de Acesso à API** (Access Token).</li>
                          <li>Cole o token no campo acima.</li>
                          <li>No menu lateral do Chatwoot, acesse <strong>Integrações</strong> &gt; <strong>Webhooks</strong>.</li>
                          <li>Adicione um novo webhook contendo a **URL do Webhook do seu Robô** mostrada no topo desta seção.</li>
                          <li>Selecione exclusivamente o evento <strong>message_created</strong> e salve. Pronto! O fluxo agora é 100% direto.</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Webhook Live Monitor Logs */}
                <div className="p-6 rounded-3xl bg-[#0b101d] border border-slate-800/60 flex flex-col justify-between" id="webhook-logs-panel">
                  <div className="space-y-4" id="webhook-logs-header">
                    <div className="flex items-center justify-between" id="logs-title-row">
                      <div>
                        <h3 className="font-display font-semibold text-base text-white" id="webhook-logs-title">Monitor de Webhook</h3>
                        <p className="text-xs text-slate-500 mt-1" id="webhook-logs-subtitle">Transações processadas do Chatwoot em tempo real.</p>
                      </div>
                      <button 
                        onClick={fetchWebhookLogs}
                        disabled={isFetchingWebhookLogs}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                        id="btn-refresh-webhook-logs"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isFetchingWebhookLogs ? 'animate-spin text-indigo-400' : ''}`} />
                      </button>
                    </div>

                    <div className="space-y-2.5 overflow-y-auto max-h-[400px] pr-1 font-mono text-[11px]" id="webhook-logs-scroll">
                      {webhookLogs.length === 0 ? (
                        <div className="text-center py-8 text-slate-600 font-sans" id="no-webhook-logs">
                          Nenhum evento registrado ainda. Envie uma mensagem no seu número do WhatsApp para ver as requisições chegando.
                        </div>
                      ) : (
                        webhookLogs.map((log) => {
                          let badgeBg = 'bg-slate-900 text-slate-400';
                          if (log.direction === 'inbound') badgeBg = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                          if (log.direction === 'outbound') badgeBg = 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
                          if (log.direction === 'error') badgeBg = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';

                          return (
                            <div key={log.id} className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/50 space-y-1.5" id={`wlog-${log.id}`}>
                              <div className="flex items-center justify-between text-[10px]" id={`wlog-header-${log.id}`}>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${badgeBg}`}>
                                  {log.direction === 'inbound' ? 'Recebida' : log.direction === 'outbound' ? 'Respondida' : log.direction === 'error' ? 'Erro' : 'Sistema'}
                                </span>
                                <span className="text-slate-600">{log.timestamp}</span>
                              </div>
                              <p className="text-slate-200 font-sans leading-normal font-medium">{log.message}</p>
                              {log.details && (
                                <p className="text-slate-500 text-[10px] bg-slate-950/60 p-1.5 rounded border border-slate-900 whitespace-pre-wrap font-mono">
                                  {log.details}
                                </p>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <button
                    onClick={clearWebhookLogs}
                    className="w-full mt-6 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-500 hover:text-rose-400 text-xs font-sans font-semibold transition-colors cursor-pointer"
                    id="btn-clear-webhook-logs"
                  >
                    Limpar Transações do Webhook
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'pricing' && (
              <motion.div
                key="pricing-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full"
                id="pricing-tab-panel"
              >
                {/* Form to Add/Edit Price */}
                <div className="lg:col-span-1 p-6 rounded-3xl bg-[#0b101d] border border-slate-800/60 h-fit space-y-6" id="pricing-form-panel">
                  <div>
                    <h3 className="font-display font-semibold text-base text-white flex items-center gap-2" id="pricing-form-title">
                      <Sparkles className="w-5 h-5 text-emerald-400" />
                      {editingPricingId ? "Editar Preço de Serviço" : "Adicionar Novo Preço"}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1" id="pricing-form-subtitle">
                      Preencha os campos para alimentar o banco de dados que a IA utilizará para responder orçamentos.
                    </p>
                  </div>

                  <div className="space-y-4" id="pricing-form-body">
                    <div className="space-y-1.5" id="group-pricing-category">
                      <label className="text-xs text-slate-400 font-medium">Categoria do Aparelho</label>
                      <select
                        value={pricingCategory}
                        onChange={(e) => setPricingCategory(e.target.value as any)}
                        className="w-full bg-[#131a2c] text-slate-200 border border-slate-800 rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                        id="select-pricing-category"
                      >
                        <option value="iphone">Apple (iPhone)</option>
                        <option value="android">Celulares Android (Samsung/Motorola/etc)</option>
                        <option value="notebook">Notebooks & Computadores</option>
                        <option value="other">Outros Serviços (Desoxidação/Placas)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5" id="group-pricing-model">
                      <label className="text-xs text-slate-400 font-medium">Modelo do Aparelho</label>
                      <input
                        type="text"
                        placeholder="Ex: iPhone 11, Samsung S21, MacBook Pro 2020"
                        value={pricingDeviceModel}
                        onChange={(e) => setPricingDeviceModel(e.target.value)}
                        className="w-full bg-[#131a2c] text-slate-200 placeholder-slate-600 border border-slate-800 rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                        id="input-pricing-model"
                      />
                    </div>

                    <div className="space-y-1.5" id="group-pricing-service">
                      <label className="text-xs text-slate-400 font-medium">Serviço Realizado</label>
                      <input
                        type="text"
                        placeholder="Ex: Troca de Tela Premium (OLED), Upgrade SSD"
                        value={pricingServiceName}
                        onChange={(e) => setPricingServiceName(e.target.value)}
                        className="w-full bg-[#131a2c] text-slate-200 placeholder-slate-600 border border-slate-800 rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                        id="input-pricing-service"
                      />
                    </div>

                    <div className="space-y-1.5" id="group-pricing-estimate">
                      <label className="text-xs text-slate-400 font-medium">Estimativa de Preço / Faixa</label>
                      <input
                        type="text"
                        placeholder="Ex: A partir de R$ 320, R$ 150 - R$ 220"
                        value={pricingEstimate}
                        onChange={(e) => setPricingEstimate(e.target.value)}
                        className="w-full bg-[#131a2c] text-emerald-400 placeholder-slate-600 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold focus:ring-1 focus:ring-indigo-500 outline-none"
                        id="input-pricing-estimate"
                      />
                    </div>

                    <div className="space-y-1.5" id="group-pricing-notes">
                      <label className="text-xs text-slate-400 font-medium">Diferenciais / Notas de Qualidade (Opcional)</label>
                      <textarea
                        rows={3}
                        placeholder="Ex: Tela OLED premium, mantém True Tone ativo, inclui película de vidro de brinde e garantia de 6 meses."
                        value={pricingNotes}
                        onChange={(e) => setPricingNotes(e.target.value)}
                        className="w-full bg-[#131a2c] text-slate-200 placeholder-slate-600 border border-slate-800 rounded-xl p-3 text-xs focus:ring-1 focus:ring-indigo-500 outline-none resize-none leading-relaxed"
                        id="textarea-pricing-notes"
                      />
                    </div>

                    <div className="pt-2 flex gap-3" id="pricing-form-actions">
                      <button
                        onClick={handleSavePricingItem}
                        disabled={!pricingDeviceModel.trim() || !pricingServiceName.trim() || !pricingEstimate.trim()}
                        className="flex-1 py-3 px-4 rounded-xl text-white font-semibold text-xs shadow-lg shadow-indigo-600/10 transition-colors disabled:opacity-40 bg-indigo-600 hover:bg-indigo-500 cursor-pointer"
                        id="btn-save-pricing"
                      >
                        {editingPricingId ? "Salvar Alterações" : "Cadastrar Preço"}
                      </button>
                      {editingPricingId && (
                        <button
                          onClick={handleCancelEditPricingItem}
                          className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                          id="btn-cancel-pricing-edit"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* List and Search of Prices */}
                <div className="lg:col-span-2 p-6 rounded-3xl bg-[#0b101d] border border-slate-800/60 space-y-6" id="pricing-list-panel">
                  {/* Explanation box */}
                  <div className="p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-xs text-slate-300 leading-relaxed flex items-start gap-3" id="pricing-info-box">
                    <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-indigo-300">Como funciona a busca de preços do Robô?</p>
                      <p className="mt-1">
                        Os serviços cadastrados abaixo alimentam o banco de dados interno da Inteligência Artificial. Se o cliente <strong>insistir de verdade</strong> por um valor no WhatsApp, a Gemini IA usará essas estimativas para responder de forma honesta, combinando o preço com nossa garantia e agendando uma avaliação 100% gratuita presencial!
                      </p>
                    </div>
                  </div>

                  {/* Search & Filters */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-950/40 p-4 rounded-2xl border border-slate-900" id="pricing-search-section">
                    <div className="relative w-full sm:w-72" id="pricing-search-wrapper">
                      <input
                        type="text"
                        placeholder="Buscar por aparelho ou serviço..."
                        value={pricingSearch}
                        onChange={(e) => setPricingSearch(e.target.value)}
                        className="w-full bg-[#131a2c] text-slate-200 placeholder-slate-600 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                        id="input-pricing-search"
                      />
                      <span className="absolute left-3 top-3 text-slate-500 text-sm">🔍</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 w-full sm:w-auto" id="pricing-filters">
                      <button
                        onClick={() => setPricingCategoryFilter("all")}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                          pricingCategoryFilter === "all"
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15"
                            : "bg-slate-900 text-slate-400 hover:bg-slate-850 hover:text-slate-200"
                        }`}
                        id="btn-filter-pricing-all"
                      >
                        Todos
                      </button>
                      <button
                        onClick={() => setPricingCategoryFilter("iphone")}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                          pricingCategoryFilter === "iphone"
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15"
                            : "bg-slate-900 text-slate-400 hover:bg-slate-850 hover:text-slate-200"
                        }`}
                        id="btn-filter-pricing-iphone"
                      >
                        iPhone
                      </button>
                      <button
                        onClick={() => setPricingCategoryFilter("android")}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                          pricingCategoryFilter === "android"
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15"
                            : "bg-slate-900 text-slate-400 hover:bg-slate-850 hover:text-slate-200"
                        }`}
                        id="btn-filter-pricing-android"
                      >
                        Android
                      </button>
                      <button
                        onClick={() => setPricingCategoryFilter("notebook")}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                          pricingCategoryFilter === "notebook"
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15"
                            : "bg-slate-900 text-slate-400 hover:bg-slate-850 hover:text-slate-200"
                        }`}
                        id="btn-filter-pricing-notebook"
                      >
                        Notebook
                      </button>
                    </div>
                  </div>

                  {/* List items */}
                  <div className="space-y-3.5" id="pricing-items-container">
                    {(config.pricingTable || []).length === 0 ? (
                      <div className="text-center py-12 text-slate-600 border border-dashed border-slate-800 rounded-2xl" id="pricing-empty-state">
                        Nenhum serviço ou preço cadastrado ainda. Use o formulário ao lado para começar.
                      </div>
                    ) : (
                      (() => {
                        const filtered = (config.pricingTable || []).filter(item => {
                          const matchesSearch = item.deviceModel.toLowerCase().includes(pricingSearch.toLowerCase()) || 
                                                item.serviceName.toLowerCase().includes(pricingSearch.toLowerCase()) ||
                                                (item.notes && item.notes.toLowerCase().includes(pricingSearch.toLowerCase()));
                          const matchesCategory = pricingCategoryFilter === "all" || item.category === pricingCategoryFilter;
                          return matchesSearch && matchesCategory;
                        });

                        if (filtered.length === 0) {
                          return (
                            <div className="text-center py-12 text-slate-600" id="pricing-no-results">
                              Nenhum serviço correspondente à busca ou filtro encontrado.
                            </div>
                          );
                        }

                        return filtered.map((item) => {
                          let badgeText = "iPhone";
                          let badgeColor = "bg-sky-500/10 text-sky-400 border border-sky-500/20";
                          if (item.category === 'android') {
                            badgeText = "Android";
                            badgeColor = "bg-lime-500/10 text-lime-400 border border-lime-500/20";
                          } else if (item.category === 'notebook') {
                            badgeText = "Notebook";
                            badgeColor = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
                          } else if (item.category === 'other') {
                            badgeText = "Outro";
                            badgeColor = "bg-purple-500/10 text-purple-400 border border-purple-500/20";
                          }

                          return (
                            <div
                              key={item.id}
                              className={`p-4 rounded-2xl border transition-all ${
                                editingPricingId === item.id
                                  ? "bg-indigo-600/10 border-indigo-500"
                                  : "bg-[#131a2c]/30 border-slate-800 hover:border-slate-700"
                              }`}
                              id={`pricing-item-${item.id}`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3" id={`pricing-item-header-${item.id}`}>
                                <div className="space-y-1.5" id={`pricing-item-details-${item.id}`}>
                                  <div className="flex flex-wrap items-center gap-2" id={`pricing-item-title-row-${item.id}`}>
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${badgeColor}`}>
                                      {badgeText}
                                    </span>
                                    <h4 className="font-semibold text-xs text-white leading-none">
                                      {item.deviceModel}
                                    </h4>
                                  </div>
                                  <p className="text-sm text-slate-200 font-medium">
                                    {item.serviceName}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0 self-end sm:self-start" id={`pricing-item-actions-row-${item.id}`}>
                                  <span className="text-sm font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl">
                                    {item.priceEstimate}
                                  </span>
                                  <div className="flex gap-1" id={`pricing-item-buttons-${item.id}`}>
                                    <button
                                      onClick={() => handleStartEditPricingItem(item)}
                                      className="p-2 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white transition-colors cursor-pointer"
                                      title="Editar item"
                                      id={`btn-edit-pricing-${item.id}`}
                                    >
                                      📝
                                    </button>
                                    <button
                                      onClick={() => handleDeletePricingItem(item.id)}
                                      className="p-2 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                                      title="Excluir item"
                                      id={`btn-delete-pricing-${item.id}`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                              {item.notes && (
                                <p className="text-xs text-slate-400 mt-2 bg-[#090d16]/50 p-2.5 rounded-xl border border-slate-900/60 leading-relaxed italic" id={`pricing-item-notes-${item.id}`}>
                                  📌 {item.notes}
                                </p>
                              )}
                            </div>
                          );
                        });
                      })()
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      {/* Main Footer */}
      <footer className="border-t border-slate-800 bg-[#070b12] py-8 mt-auto" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500" id="footer-inner">
          <div className="flex items-center gap-2" id="footer-brand">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" id="footer-dot"></span>
            <p id="footer-brand-text">ZetaChat AI • Plataforma de Automação Comercial</p>
          </div>
          <div className="flex items-center gap-4 font-mono text-[10px]" id="footer-details">
            <span id="footer-status">Dev Mode: Ativo</span>
            <span id="footer-sys">Porta 3000 Ingress</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
