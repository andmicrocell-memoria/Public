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
  Globe
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
    pricingTable: defaultPricingTableList
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
      ]
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
      ]
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
      ]
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

  const [reviews, setReviews] = useState<GoogleReview[]>(() => {
    const saved = localStorage.getItem("and_microcell_reviews");
    return saved ? JSON.parse(saved) : defaultReviews;
  });

  const [logs, setLogs] = useState<AgentLog[]>(() => {
    const saved = localStorage.getItem("and_microcell_logs");
    return saved ? JSON.parse(saved) : defaultLogs;
  });

  // 3. UI State Managers
  const [activeTab, setActiveTab] = useState<'dashboard' | 'whatsapp' | 'google' | 'settings' | 'integration' | 'blog' | 'pricing'>('dashboard');
  const [isViewingPublicSite, setIsViewingPublicSite] = useState(() => {
    const isAiStudio = window.location.hostname.includes("run.app") || 
                       window.location.hostname.includes("localhost") || 
                       window.location.hostname.includes("127.0.0.1") ||
                       window.location.hostname.includes("stackblitz");

    // De maneira nenhuma exibe o app zetachatia em domínios customizados (como app.andmicrocell.com.br ou www.andmicrocell.com.br)
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

  // Sync with server on mount
  useEffect(() => {
    const isCustomDomain = !window.location.hostname.includes("ais-dev") && 
                           !window.location.hostname.includes("ais-pre") && 
                           window.location.hostname !== "localhost" && 
                           window.location.hostname !== "127.0.0.1";

    if (isCustomDomain) {
      console.log("Loading config directly from Firestore client-side...");
      const configDocRef = doc(db, "config", "business");
      getDoc(configDocRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            const serverData = snapshot.data();
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
              setConfig(serverData as any);
            }
          } else {
            console.warn("No business config document found in Firestore, falling back to static config");
            setConfig(staticConfig as any);
          }
          setHasLoadedServerConfig(true);
        })
        .catch((err) => {
          console.error("Error loading config directly from Firestore:", err);
          setConfig(staticConfig as any);
          setHasLoadedServerConfig(true);
        });
    } else {
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
    }

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
    
    const isCustomDomain = !window.location.hostname.includes("ais-dev") && 
                           !window.location.hostname.includes("ais-pre") && 
                           window.location.hostname !== "localhost" && 
                           window.location.hostname !== "127.0.0.1";

    if (isCustomDomain) {
      console.log("Saving config directly to Firestore client-side...");
      const configDocRef = doc(db, "config", "business");
      setDoc(configDocRef, config)
        .then(() => console.log("Config saved to Firestore successfully!"))
        .catch(err => console.error("Error saving config directly to Firestore:", err));
    } else {
      // Save to server
      fetch(getApiUrl("/api/config"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      }).catch(err => console.error("Error saving server config:", err));
    }
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

    addLog("whatsapp_received", `Mensagem do cliente no WhatsApp`, `${currentSession.customerName}: "${textToSend.substring(0, 30)}..."`);

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

  const selectedSession = sessions.find(s => s.id === selectedSessionId) || sessions[0];

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
                onClick={() => setActiveTab('whatsapp')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  activeTab === 'whatsapp'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
                id="btn-nav-whatsapp"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat do WhatsApp</span>
                </div>
                {sessions.some(s => s.unreadCount > 0) && (
                  <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse" id="unread-pill">
                    {sessions.reduce((acc, s) => acc + s.unreadCount, 0)}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('google')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  activeTab === 'google'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
                id="btn-nav-google"
              >
                <div className="flex items-center gap-3">
                  <Star className="w-4 h-4" />
                  <span>Google Avaliações</span>
                </div>
                {reviews.filter(r => r.responseStatus === 'unanswered').length > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold" id="pending-reviews-pill">
                    {reviews.filter(r => r.responseStatus === 'unanswered').length}
                  </span>
                )}
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
                  Ativar API Oficial
                  <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">Nova</span>
                </span>
              </button>
            </nav>
          </div>

          {/* Quick Config Widget */}
          <div className="p-5 rounded-2xl bg-[#0b101d] border border-slate-800/60 flex flex-col gap-4" id="sidebar-quick-config">
            <h4 className="text-slate-400 text-[10px] font-mono font-bold uppercase tracking-wider px-2" id="quick-config-title">Ações Rápidas IA</h4>
            
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/50" id="toggle-whatsapp-container">
              <div>
                <p className="text-xs font-semibold text-slate-200">Auto-WhatsApp</p>
                <p className="text-[10px] text-slate-500">Responde sem aprovar</p>
              </div>
              <button
                onClick={() => handleSaveConfig({ autoRespondWhatsApp: !config.autoRespondWhatsApp })}
                className={`w-10 h-5.5 rounded-full p-0.5 transition-colors cursor-pointer ${config.autoRespondWhatsApp ? 'bg-indigo-600' : 'bg-slate-800'}`}
                id="btn-toggle-auto-whatsapp"
              >
                <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${config.autoRespondWhatsApp ? 'translate-x-4.5' : ''}`}></div>
              </button>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/50" id="toggle-reviews-container">
              <div>
                <p className="text-xs font-semibold text-slate-200">Auto-Avaliações</p>
                <p className="text-[10px] text-slate-500">Gera resposta direta</p>
              </div>
              <button
                onClick={() => handleSaveConfig({ autoRespondReviews: !config.autoRespondReviews })}
                className={`w-10 h-5.5 rounded-full p-0.5 transition-colors cursor-pointer ${config.autoRespondReviews ? 'bg-indigo-600' : 'bg-slate-800'}`}
                id="btn-toggle-auto-reviews"
              >
                <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${config.autoRespondReviews ? 'translate-x-4.5' : ''}`}></div>
              </button>
            </div>
          </div>

          {/* Simulate External Events Panel */}
          <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800/80" id="simulation-box">
            <div className="flex items-center gap-1.5 mb-3 px-2" id="simulation-header">
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <h4 className="text-slate-400 text-[10px] font-mono font-bold uppercase tracking-wider" id="simulation-title">Gerador de Eventos</h4>
            </div>
            <div className="flex flex-col gap-2.5" id="simulation-btns">
              <button
                onClick={() => {
                  const names = ["Luiz Fernando", "Aline Santos", "Gustavo Silva", "Renata Meireles"];
                  const selectedName = names[Math.floor(Math.random() * names.length)];
                  const questions = [
                    "Vocês dão desconto para trocar tela de iPhone?",
                    "Consertam conector de carga?",
                    "Fazem formatação de notebook?",
                    "Vocês buscam o celular em casa?"
                  ];
                  const selectedMsg = questions[Math.floor(Math.random() * questions.length)];
                  handleSimulateNewChat(selectedName, `+55 11 99${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`, selectedMsg);
                }}
                className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[11px] font-medium text-slate-300 transition-colors flex items-center justify-between cursor-pointer"
                id="btn-sim-chat"
              >
                <span>Simular Chat no WhatsApp</span>
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              </button>

              <button
                onClick={() => {
                  const authors = ["Beatriz Costa", "Fernando Andrade", "Juliana Ribeiro", "Pedro Henrique"];
                  const selectedAuthor = authors[Math.floor(Math.random() * authors.length)];
                  const badComments = [
                    "Tentei ligar e demorou para responder.",
                    "O preço cobrado foi acima da média.",
                    "A loja é um pouco difícil de estacionar."
                  ];
                  const goodComments = [
                    "Atendimento impecável! Resolveram o problema no mesmo dia.",
                    "Ótimo serviço, preço justo e equipe atenciosa.",
                    "Muito satisfeito com a rapidez e a garantia dada no conserto!"
                  ];
                  const score = Math.random() > 0.3 ? (Math.random() > 0.4 ? 5 : 4) : (Math.random() > 0.5 ? 3 : 2);
                  const selectedComment = score >= 4 
                    ? goodComments[Math.floor(Math.random() * goodComments.length)]
                    : badComments[Math.floor(Math.random() * badComments.length)];
                  
                  handleSimulateNewReview(score, selectedComment, selectedAuthor);
                }}
                className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[11px] font-medium text-slate-300 transition-colors flex items-center justify-between cursor-pointer"
                id="btn-sim-review"
              >
                <span>Simular Avaliação Google</span>
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              </button>
            </div>
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="dashboard-metrics">
                  <div className="p-5 rounded-2xl bg-[#0b101d] border border-slate-800/60" id="metric-1">
                    <p className="text-slate-500 text-xs font-mono uppercase tracking-wider" id="metric-1-lbl">Atendimentos IA</p>
                    <div className="flex items-baseline gap-2 mt-2" id="metric-1-val-group">
                      <span className="text-3xl font-display font-black text-white" id="metric-1-val">42</span>
                      <span className="text-emerald-500 text-xs font-semibold font-mono" id="metric-1-pct">+12%</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1" id="metric-1-desc">Automáticos ou Assistidos</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#0b101d] border border-slate-800/60" id="metric-2">
                    <p className="text-slate-500 text-xs font-mono uppercase tracking-wider" id="metric-2-lbl">Avaliações Google</p>
                    <div className="flex items-baseline gap-2 mt-2" id="metric-2-val-group">
                      <span className="text-3xl font-display font-black text-white" id="metric-2-val">{reviews.length}</span>
                      <span className="text-amber-500 text-xs font-semibold font-mono" id="metric-2-avg">4.6 ★</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1" id="metric-2-desc">Avaliação média do perfil</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#0b101d] border border-slate-800/60" id="metric-3">
                    <p className="text-slate-500 text-xs font-mono uppercase tracking-wider" id="metric-3-lbl">Respondidas pela IA</p>
                    <div className="flex items-baseline gap-2 mt-2" id="metric-3-val-group">
                      <span className="text-3xl font-display font-black text-white" id="metric-3-val">
                        {reviews.filter(r => r.responseStatus === 'published').length}
                      </span>
                      <span className="text-slate-400 text-xs font-mono" id="metric-3-slash">/{reviews.length}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1" id="metric-3-desc">Respostas públicas no GMB</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#0b101d] border border-slate-800/60" id="metric-4">
                    <p className="text-slate-500 text-xs font-mono uppercase tracking-wider" id="metric-4-lbl">FAQs Ativas</p>
                    <div className="flex items-baseline gap-2 mt-2" id="metric-4-val-group">
                      <span className="text-3xl font-display font-black text-white" id="metric-4-val">{config.faqs.length}</span>
                      <span className="text-indigo-400 text-xs font-mono font-semibold" id="metric-4-cap">Conhecimento</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1" id="metric-4-desc">Base de respostas mapeadas</p>
                  </div>
                </div>

                {/* Dashboard Inner Core Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-core">
                  {/* Central status card */}
                  <div className="lg:col-span-2 p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950/20 border border-slate-800/80 flex flex-col justify-between gap-6" id="dashboard-status-banner">
                    <div id="status-banner-header">
                      <div className="flex items-center gap-2 mb-2" id="ai-status-header">
                        <Bot className="text-indigo-400 w-5 h-5 animate-bounce" />
                        <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider font-mono">Status do Agente Inteligente</span>
                      </div>
                      <h3 className="font-display font-bold text-2xl text-white tracking-tight" id="status-banner-title">
                        Agente pronto e vigiando canais de atendimento
                      </h3>
                      <p className="text-slate-400 text-sm mt-2 leading-relaxed" id="status-banner-text">
                        A inteligência artificial da <strong>AndMicrocell</strong> está conectada às avaliações públicas do Google Meu Negócio e atende simulações de WhatsApp em tempo real. Seus FAQs cadastrados alimentam o contexto cognitivo do Gemini.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="status-banner-checks">
                      <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-start gap-3" id="check-1">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">Integração WhatsApp</h4>
                          <p className="text-[10px] text-slate-400 mt-1">Conectado. Modo: {config.autoRespondWhatsApp ? "Automação Completa" : "Copiloto (Aprovação prévia)"}</p>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-start gap-3" id="check-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">Google Meu Negócio</h4>
                          <p className="text-[10px] text-slate-400 mt-1">Sincronizado. {reviews.length} avaliações lidas | {reviews.filter(r => r.responseStatus === 'unanswered').length} pendentes</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800 flex items-center justify-between" id="status-banner-action-footer">
                      <div className="flex items-center gap-2" id="status-tag">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" id="pulse-dot"></div>
                        <span className="text-xs font-mono text-slate-400">Atividade em tempo real ativa</span>
                      </div>
                      <button
                        onClick={() => setActiveTab('whatsapp')}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all flex items-center gap-1 cursor-pointer"
                        id="btn-goto-simulator"
                      >
                        <span>Abrir Simulador WhatsApp</span>
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

            {activeTab === 'whatsapp' && (
              <motion.div
                key="whatsapp-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
                id="whatsapp-tab-panel"
              >
                {/* Chat Session List */}
                <div className="p-5 rounded-3xl bg-[#0b101d] border border-slate-800/60 flex flex-col gap-4" id="chat-session-list">
                  <h3 className="font-display font-semibold text-base text-white px-1" id="sessions-list-title">Conversas Ativas</h3>
                  
                  <div className="flex flex-col gap-2 overflow-y-auto max-h-[500px]" id="sessions-scroll">
                    {sessions.map((sess) => {
                      const isSelected = sess.id === selectedSessionId;
                      return (
                        <button
                          key={sess.id}
                          onClick={() => {
                            setSelectedSessionId(sess.id);
                            // Mark unread as read
                            setSessions(prev => prev.map(s => s.id === sess.id ? { ...s, unreadCount: 0 } : s));
                          }}
                          className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-start justify-between gap-3 cursor-pointer ${
                            isSelected 
                              ? 'bg-indigo-600/10 border-indigo-500/50' 
                              : 'bg-slate-900/40 border-slate-800 hover:bg-slate-900 hover:border-slate-700/60'
                          }`}
                          id={`session-btn-${sess.id}`}
                        >
                          <div className="min-w-0" id={`session-btn-content-${sess.id}`}>
                            <div className="flex items-center gap-2" id={`session-user-row-${sess.id}`}>
                              <p className="text-xs font-bold text-slate-200 truncate" id={`session-name-${sess.id}`}>{sess.customerName}</p>
                              {sess.unreadCount > 0 && (
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" id={`unread-dot-${sess.id}`}></span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5" id={`session-phone-${sess.id}`}>{sess.customerPhone}</p>
                            <p className="text-xs text-slate-400 mt-2 truncate font-medium" id={`session-last-msg-${sess.id}`}>{sess.lastMessage}</p>
                          </div>
                          
                          <ChevronRight className="w-4 h-4 text-slate-600 shrink-0 mt-1" id={`session-arrow-${sess.id}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Simulated Phone WhatsApp Chatbox */}
                <div className="md:col-span-2 flex flex-col rounded-3xl bg-slate-950 border border-slate-850 overflow-hidden min-h-[500px]" id="whatsapp-simulator">
                  {/* Mock Phone Header */}
                  <div className="px-5 py-4 bg-[#0c1221] border-b border-slate-850 flex items-center justify-between" id="mock-phone-header">
                    <div className="flex items-center gap-3.5" id="mock-user-info">
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold" id="mock-avatar">
                        {selectedSession?.customerName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-100" id="mock-user-name">{selectedSession?.customerName}</h4>
                        <div className="flex items-center gap-1.5" id="mock-user-status-container">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" id="mock-user-dot"></span>
                          <span className="text-[10px] font-mono text-slate-400" id="mock-user-status">Online no WhatsApp</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5" id="mock-phone-meta">
                      <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400" id="mock-phone-lbl">
                        Simulador WhatsApp
                      </span>
                    </div>
                  </div>

                  {/* Messages Window */}
                  <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#090d16] min-h-[300px]" id="chat-messages-box">
                    <div className="text-center" id="chat-system-date">
                      <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-850 text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">
                        Hoje
                      </span>
                    </div>

                    {selectedSession?.messages.map((msg) => {
                      const isCustomer = msg.sender === "customer";
                      const isSystem = msg.sender === "system";

                      if (isSystem) {
                        return (
                          <div key={msg.id} className="text-center" id={`chat-sys-msg-${msg.id}`}>
                            <span className="px-3 py-1.5 rounded bg-slate-900/60 text-[10px] text-slate-400 inline-block max-w-sm">
                              {msg.text}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
                          id={`chat-msg-wrapper-${msg.id}`}
                        >
                          <div className="flex items-start gap-2 max-w-[85%]" id={`chat-msg-block-${msg.id}`}>
                            {!isCustomer && (
                              <div className="w-6 h-6 rounded-full bg-indigo-600/20 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-500/20" id={`chat-msg-bot-${msg.id}`}>
                                <Bot className="w-3.5 h-3.5 text-indigo-400" />
                              </div>
                            )}

                            <div>
                              <div
                                className={`p-3.5 rounded-2xl text-sm ${
                                  isCustomer
                                    ? 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                                    : msg.status === 'pending_approval'
                                      ? 'bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 rounded-tr-none'
                                      : 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/5'
                                }`}
                                id={`chat-msg-bubble-${msg.id}`}
                              >
                                {msg.text}
                                
                                {/* IA Metadata inside chat */}
                                {msg.status === 'pending_approval' && (
                                  <div className="mt-3 pt-2.5 border-t border-indigo-500/20 flex items-center justify-between gap-4" id={`chat-draft-actions-${msg.id}`}>
                                    <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                      <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
                                      Rascunho Inteligente IA
                                    </span>
                                    <div className="flex items-center gap-1.5" id={`chat-draft-btns-${msg.id}`}>
                                      <button
                                        onClick={() => handleRejectDraft(msg.id)}
                                        className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-semibold text-rose-400 transition-colors cursor-pointer"
                                        id={`btn-reject-draft-${msg.id}`}
                                      >
                                        Descartar
                                      </button>
                                      <button
                                        onClick={() => handleApproveDraft(msg.id)}
                                        className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-[10px] font-semibold text-white transition-colors flex items-center gap-1 cursor-pointer"
                                        id={`btn-approve-draft-${msg.id}`}
                                      >
                                        <Check className="w-3 h-3 text-white" />
                                        Aprovar e Enviar
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <span className="text-[9px] text-slate-500 font-mono mt-1 block px-1" id={`chat-msg-time-${msg.id}`}>
                                {msg.timestamp} {msg.status === 'pending_approval' ? '• Aguardando revisão' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {isAiAnswering && (
                      <div className="flex items-center gap-2 text-indigo-400 text-xs px-2 animate-pulse" id="ai-typing-loader">
                        <Bot className="w-4 h-4 animate-bounce" />
                        <span className="font-medium">
                          {typingStatus === "generating" 
                            ? "Agente IA está elaborando a resposta com o Gemini..." 
                            : `${config.name.split(" - ")[0]} está digitando...`}
                        </span>
                      </div>
                    )}

                    <div ref={chatEndRef} id="chat-end-anchor"></div>
                  </div>

                  {/* Suggest Test Prompts Pill Section */}
                  <div className="px-5 py-3.5 bg-[#0b0f19]/60 border-t border-slate-850/80" id="suggest-prompts-bar">
                    <p className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider mb-2 px-1" id="suggest-title">
                      💡 Perguntas de teste do Cliente (Clique para simular):
                    </p>
                    <div className="flex flex-wrap gap-2" id="suggest-pills">
                      {suggestedQuestions.map((q, index) => (
                        <button
                          key={index}
                          onClick={() => handleSendCustomerMessage(q)}
                          disabled={isAiAnswering}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs text-slate-300 hover:text-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
                          id={`btn-suggest-${index}`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message Input Form */}
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!isAiAnswering && whatsappInputValue.trim()) {
                        handleSendCustomerMessage();
                      }
                    }}
                    className="p-4 bg-[#0c1221] border-t border-slate-850 flex gap-2.5" 
                    id="chat-input-area"
                  >
                    <input
                      type="text"
                      value={whatsappInputValue}
                      onChange={(e) => setWhatsappInputValue(e.target.value)}
                      placeholder="Simule a resposta do cliente aqui e envie..."
                      disabled={isAiAnswering}
                      className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      id="chat-text-input"
                    />
                    <button
                      type="submit"
                      disabled={isAiAnswering || !whatsappInputValue.trim()}
                      className="px-4.5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium text-sm transition-colors duration-150 flex items-center justify-center cursor-pointer"
                      id="chat-send-btn"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {activeTab === 'google' && (
              <motion.div
                key="google-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
                id="google-tab-panel"
              >
                {/* GMB Banner Status */}
                <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-6" id="gmb-overview-card">
                  <div id="gmb-overview-left">
                    <div className="flex items-center gap-2 mb-2" id="gmb-badge-row">
                      <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">Google Meu Negócio Sincronizado</span>
                    </div>
                    <h3 className="font-display font-bold text-xl text-white" id="gmb-card-title">{config.name}</h3>
                    <p className="text-xs text-slate-400 mt-1" id="gmb-card-desc">Sincronização em tempo real das avaliações do seu perfil comercial.</p>
                  </div>

                  <div className="flex gap-4" id="gmb-overview-stats">
                    <div className="px-4 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-center" id="gmb-stat-1">
                      <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider" id="gmb-stat-1-lbl">Score Geral</p>
                      <p className="text-lg font-bold text-white mt-1" id="gmb-stat-1-val">4.6 ★</p>
                    </div>
                    <div className="px-4 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-center" id="gmb-stat-2">
                      <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider" id="gmb-stat-2-lbl">Não Respondidas</p>
                      <p className="text-lg font-bold text-rose-400 mt-1" id="gmb-stat-2-val">
                        {reviews.filter(r => r.responseStatus === 'unanswered').length}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Manual Review Entry Form */}
                <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-850" id="manual-review-form-card">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="manual-review-header">
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">Recebeu uma avaliação real no Google Meu Negócio?</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Adicione aqui a avaliação real (como a de 5 estrelas que você recebeu essa semana) para gerar rascunhos de resposta personalizados com a IA.</p>
                    </div>
                    <button 
                      onClick={() => setShowAddReviewForm(!showAddReviewForm)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all shadow-md hover:shadow-indigo-600/10 cursor-pointer flex items-center justify-center gap-2 self-start sm:self-auto" 
                      id="btn-toggle-add-review"
                    >
                      <Plus className={`w-4 h-4 transition-transform ${showAddReviewForm ? 'rotate-45' : ''}`} />
                      <span>{showAddReviewForm ? "Fechar" : "Inserir Avaliação"}</span>
                    </button>
                  </div>

                  <AnimatePresence>
                    {showAddReviewForm && (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!customReviewAuthor.trim()) return;
                          handleSimulateNewReview(customReviewRating, customReviewComment, customReviewAuthor);
                          setCustomReviewAuthor("");
                          setCustomReviewComment("");
                          setCustomReviewRating(5);
                          setShowAddReviewForm(false);
                        }}
                        className="mt-6 pt-6 border-t border-slate-800/60 space-y-4 overflow-hidden"
                        id="form-add-review"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="review-fields-row">
                          <div className="space-y-1.5" id="field-author">
                            <label className="text-xs text-slate-400 font-semibold">Nome do Cliente *</label>
                            <input
                              type="text"
                              required
                              value={customReviewAuthor}
                              onChange={(e) => setCustomReviewAuthor(e.target.value)}
                              placeholder="Ex: Beatriz Costa"
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                              id="input-review-author"
                            />
                          </div>

                          <div className="space-y-1.5" id="field-stars">
                            <label className="text-xs text-slate-400 font-semibold">Classificação (Estrelas)</label>
                            <div className="flex items-center gap-1.5 h-9" id="stars-selector">
                              {[1, 2, 3, 4, 5].map((starNum) => (
                                <button
                                  type="button"
                                  key={starNum}
                                  onClick={() => setCustomReviewRating(starNum)}
                                  className="p-1 hover:scale-110 transition-transform cursor-pointer"
                                  id={`btn-star-select-${starNum}`}
                                >
                                  <Star
                                    className={`w-5 h-5 ${starNum <= customReviewRating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5" id="field-comment">
                          <label className="text-xs text-slate-400 font-semibold">Comentário / Texto da Avaliação</label>
                          <textarea
                            value={customReviewComment}
                            onChange={(e) => setCustomReviewComment(e.target.value)}
                            placeholder="Cole o comentário da avaliação recebida para a IA analisar e responder..."
                            rows={3}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 resize-none"
                            id="input-review-comment"
                          />
                        </div>

                        <div className="flex justify-end pt-2" id="review-form-actions">
                          <button
                            type="submit"
                            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-colors cursor-pointer flex items-center gap-1.5"
                            id="btn-submit-review"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Adicionar Avaliação no Painel
                          </button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>

                {/* Reviews List */}
                <div className="space-y-4" id="reviews-feed">
                  <h3 className="font-display font-semibold text-base text-white px-1" id="reviews-title">Avaliações do Perfil ({reviews.length})</h3>

                  <div className="space-y-4" id="reviews-list-container">
                    {reviews.map((rev) => (
                      <div key={rev.id} className="p-6 rounded-2xl bg-[#0b101d] border border-slate-800/80 flex flex-col gap-4" id={`review-card-${rev.id}`}>
                        <div className="flex items-start justify-between gap-4" id={`review-top-${rev.id}`}>
                          <div className="flex items-center gap-3" id={`review-user-${rev.id}`}>
                            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300" id={`review-avatar-${rev.id}`}>
                              {rev.authorName.charAt(0)}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-200" id={`review-author-${rev.id}`}>{rev.authorName}</h4>
                              <p className="text-[10px] text-slate-500 font-mono" id={`review-date-${rev.id}`}>{rev.publishDate}</p>
                            </div>
                          </div>

                          <div className="flex gap-0.5" id={`review-stars-${rev.id}`}>
                            {[1, 2, 3, 4, 5].map((starNum) => (
                              <Star
                                key={starNum}
                                className={`w-4 h-4 ${starNum <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`}
                                id={`review-star-${rev.id}-${starNum}`}
                              />
                            ))}
                          </div>
                        </div>

                        <p className="text-slate-300 text-sm leading-relaxed px-1" id={`review-comment-${rev.id}`}>
                          {rev.comment ? `"${rev.comment}"` : <span className="text-slate-500 italic">O cliente não escreveu um comentário, apenas avaliou com estrelas.</span>}
                        </p>

                        {/* AI Reply Space */}
                        <div className="pt-2" id={`review-reply-section-${rev.id}`}>
                          {rev.responseStatus === 'unanswered' ? (
                            <button
                              onClick={() => handleGenerateReviewReply(rev.id)}
                              disabled={isGeneratingReviewReply !== null}
                              className="px-4 py-2 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/30 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                              id={`btn-gen-reply-${rev.id}`}
                            >
                              {isGeneratingReviewReply === rev.id ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Gerando Rascunho Gemini...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                                  <span>Gerar Resposta com IA</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800" id={`review-reply-box-${rev.id}`}>
                              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/60 mb-3" id={`review-reply-header-${rev.id}`}>
                                <div className="flex items-center gap-1.5" id={`review-reply-badge-container-${rev.id}`}>
                                  <Bot className="w-4 h-4 text-purple-400" id={`review-reply-bot-icon-${rev.id}`} />
                                  <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider" id={`review-reply-badge-${rev.id}`}>
                                    {rev.responseStatus === 'draft' ? 'Rascunho de IA gerado' : 'Resposta publicada no GMB'}
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono text-slate-500" id={`review-reply-time-badge-${rev.id}`}>Gemini v3.5</span>
                              </div>

                              <p className="text-slate-300 text-xs leading-relaxed" id={`review-reply-text-${rev.id}`}>{rev.aiResponse}</p>

                              {rev.responseStatus === 'draft' && (
                                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2" id={`review-reply-actions-${rev.id}`}>
                                  <button
                                    onClick={() => handleDeleteReviewReply(rev.id)}
                                    className="px-3 py-1.5 rounded-lg hover:bg-slate-850 text-xs font-semibold text-rose-400 transition-colors cursor-pointer"
                                    id={`btn-del-reply-${rev.id}`}
                                  >
                                    Descartar
                                  </button>
                                  <button
                                    onClick={() => handlePublishReviewReply(rev.id)}
                                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                                    id={`btn-pub-reply-${rev.id}`}
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    Aprovar e Publicar
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
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
                        value={config.name}
                        onChange={(e) => handleSaveConfig({ name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                        id="input-company-name"
                      />
                    </div>

                    <div id="fld-cat">
                      <label className="block text-xs font-mono text-slate-400 mb-1.5">Categoria / Segmento</label>
                      <input
                        type="text"
                        value={config.category}
                        onChange={(e) => handleSaveConfig({ category: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                        id="input-company-category"
                      />
                    </div>

                    <div id="fld-phone">
                      <label className="block text-xs font-mono text-slate-400 mb-1.5">WhatsApp / Telefone</label>
                      <input
                        type="text"
                        value={config.phone}
                        onChange={(e) => handleSaveConfig({ phone: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                        id="input-company-phone"
                      />
                    </div>

                    <div id="fld-hours">
                      <label className="block text-xs font-mono text-slate-400 mb-1.5">Horários de Atendimento</label>
                      <input
                        type="text"
                        value={config.businessHours}
                        onChange={(e) => handleSaveConfig({ businessHours: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                        id="input-company-hours"
                      />
                    </div>

                    <div className="md:col-span-2" id="fld-addr">
                      <label className="block text-xs font-mono text-slate-400 mb-1.5">Endereço Físico</label>
                      <input
                        type="text"
                        value={config.address}
                        onChange={(e) => handleSaveConfig({ address: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                        id="input-company-address"
                      />
                    </div>

                    <div className="md:col-span-2" id="fld-offers">
                      <label className="block text-xs font-mono text-slate-400 mb-1.5">Ofertas Especiais / Promoções</label>
                      <textarea
                        value={config.specialOffers}
                        onChange={(e) => handleSaveConfig({ specialOffers: e.target.value })}
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
                          const isSelected = config.tone === t.id;
                          return (
                            <button
                              key={t.id}
                              onClick={() => handleSaveConfig({ tone: t.id as any })}
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
                      Conectar Conta Oficial do WhatsApp Cloud API
                    </h3>
                    <p className="text-xs text-slate-400 mt-1" id="integration-subtitle">
                      Transforme o assistente virtual em um funcionário real. Siga o passo a passo oficial da Meta Developer para receber mensagens de clientes reais e respondê-los automaticamente no seu número comercial.
                    </p>
                  </div>

                  {/* Standalone/Fullscreen Suggestion Callout Banner */}
                  <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3.5 text-slate-200" id="standalone-recommendation-banner">
                    <div className="flex items-center gap-2" id="recommendation-header">
                      <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">Recomendação de Configuração</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed" id="recommendation-body">
                      Percebeu que preencheu as credenciais aqui na aba lateral do AI Studio e os dados parecem não persistir ou salvar? 
                      Isso ocorre porque a visualização padrão roda dentro de um <strong>iFrame protegido do Google</strong>, o que pode bloquear cookies, permissões externas de segurança e sincronização de dados localmente.
                    </p>
                    <p className="text-xs font-semibold text-amber-300" id="recommendation-call-to-action">
                      Para realizar o procedimento de validação, salvar suas chaves de API e testar o Webhook com segurança total na Meta, recomendamos abrir a aplicação solta em tela cheia:
                    </p>
                    <div className="pt-1.5 flex flex-col sm:flex-row items-center gap-4.5" id="recommendation-actions">
                      <a
                        href={window.location.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 cursor-pointer"
                        id="btn-open-standalone-tab"
                      >
                        <Globe className="w-4 h-4 text-slate-950" />
                        <span>Abrir ZetaChat AI Solto em Nova Aba ↗</span>
                      </a>
                      <span className="text-[10px] text-slate-500 font-mono" id="recommendation-note">
                        (A visualização lateral atual servirá apenas como demonstrativo em tempo real)
                      </span>
                    </div>
                  </div>

                  {/* Webhook Endpoint Copy Box */}
                  <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-4" id="webhook-copy-box">
                    <p className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Passo 1: Configure o Webhook no Portal de Desenvolvedores da Meta
                    </p>
                    
                    <div className="space-y-4">
                      {tunnelUrl ? (
                        <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                          <span className="text-[11px] font-semibold text-emerald-400 block flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                            Opção 1: URL de Túnel Público (RECOMENDADA e Ativa agora!)
                          </span>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Como a visualização padrão do AI Studio possui bloqueio de segurança contra acessos externos de robôs, nós ativamos um **Túnel Público Aberto** para você. Use esta URL na Meta para que a verificação funcione na hora e as mensagens cheguem em tempo real!
                          </p>
                          <div className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 mt-2" id="webhook-url-tunnel">
                            <span className="truncate flex-1 select-all text-[11px] text-emerald-300 font-semibold">
                              {tunnelUrl}/api/webhook/whatsapp
                            </span>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(`${tunnelUrl}/api/webhook/whatsapp`);
                                alert("URL de Túnel Público copiada para a área de transferência!");
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[10px] text-white font-sans font-medium transition-colors cursor-pointer"
                              id="btn-copy-webhook-url-tunnel"
                            >
                              Copiar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                          <span className="text-[11px] font-semibold text-amber-400 block">Carregando Túnel de Conexão...</span>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Aguarde um instante para que possamos conectar o seu servidor a um endereço público seguro para a Meta.
                          </p>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-800/60">
                        <span className="text-[11px] font-semibold text-slate-400 block">Opção 2: URL de Produção do AI Studio</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Esta é a URL interna do projeto. Nota: ela requer login com sua conta do Google e é bloqueada pela Meta por segurança. Recomendamos utilizar a **Opção 1** para testes e uso real.
                        </p>
                        <div className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 mt-1.5" id="webhook-url-prod">
                          <span className="truncate flex-1 select-all text-[11px]">
                            {window.location.origin.includes("-dev-") 
                              ? window.location.origin.replace("-dev-", "-pre-") 
                              : window.location.origin}/api/webhook/whatsapp
                          </span>
                          <button 
                            onClick={() => {
                              const publicUrl = window.location.origin.includes("-dev-") 
                                ? window.location.origin.replace("-dev-", "-pre-") 
                                : window.location.origin;
                              navigator.clipboard.writeText(`${publicUrl}/api/webhook/whatsapp`);
                              alert("URL de Produção padrão copiada!");
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-[10px] text-white font-sans font-medium transition-colors cursor-pointer"
                            id="btn-copy-webhook-url-prod"
                          >
                            Copiar
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-[10px] text-slate-400/90 pt-1 border-t border-indigo-500/10 flex items-start gap-1">
                      <span>⚠️</span>
                      <span><strong>Muito Importante na Meta:</strong> Certifique-se de assinar o campo <strong>messages</strong> na tabela de campos do Webhook no painel da Meta. Sem assinar <em>messages</em>, a Meta não nos enviará as mensagens dos clientes!</span>
                    </p>
                  </div>

                  {/* Settings Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="integration-form">
                    <div className="md:col-span-2" id="fld-verify-token">
                      <label className="block text-xs font-mono text-slate-400 mb-1.5 flex justify-between items-center">
                        <span>Token de Verificação (Verify Token)</span>
                        <span className="text-[10px] text-slate-500 font-sans">Escolha uma senha para validar o webhook</span>
                      </label>
                      <input
                        type="text"
                        value={config.whatsappVerifyToken || "zetachat_secret_token"}
                        onChange={(e) => handleSaveConfig({ whatsappVerifyToken: e.target.value })}
                        placeholder="Ex: minha_senha_secreta_whatsapp"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-sm font-mono focus:outline-none focus:border-indigo-500"
                        id="input-verify-token"
                      />
                    </div>

                    <div id="fld-phone-id">
                      <label className="block text-xs font-mono text-slate-400 mb-1.5">ID do Número de Telefone (Phone Number ID)</label>
                      <input
                        type="text"
                        value={config.whatsappPhoneNumberId || ""}
                        onChange={(e) => handleSaveConfig({ whatsappPhoneNumberId: e.target.value })}
                        placeholder="ID numérico de telefone gerado pela Meta"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                        id="input-phone-number-id"
                      />
                    </div>

                    <div id="fld-access-token">
                      <label className="block text-xs font-mono text-slate-400 mb-1.5">Token de Acesso (Permanent Access Token)</label>
                      <input
                        type="password"
                        value={config.whatsappAccessToken || ""}
                        onChange={(e) => handleSaveConfig({ whatsappAccessToken: e.target.value })}
                        placeholder="Token permanente EAAB..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                        id="input-access-token"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-400 space-y-2" id="gmb-guide-block">
                    <p className="font-semibold text-slate-300">Como obter essas credenciais oficiais da Meta?</p>
                    <ol className="list-decimal pl-4 space-y-1.5 text-[11px]">
                      <li>Acesse o portal <a href="https://developers.facebook.com/" target="_blank" className="text-indigo-400 hover:underline">Meta for Developers</a> e crie ou selecione um aplicativo de Negócios.</li>
                      <li>Adicione o produto <strong>WhatsApp</strong> ao seu aplicativo de negócios.</li>
                      <li>Vá em <strong>Configuração do WhatsApp</strong> para encontrar o seu <em>Phone Number ID</em> temporário ou permanente.</li>
                      <li>No menu lateral, vá em <strong>Webhooks</strong>, selecione <em>WhatsApp Business Account</em>, configure a URL acima e cole o mesmo <em>Verify Token</em> digitado acima.</li>
                      <li>Inscreva-se nos campos de Webhook de <strong>messages</strong> para receber os chats.</li>
                    </ol>
                  </div>
                </div>

                {/* Webhook Live Monitor Logs */}
                <div className="p-6 rounded-3xl bg-[#0b101d] border border-slate-800/60 flex flex-col justify-between" id="webhook-logs-panel">
                  <div className="space-y-4" id="webhook-logs-header">
                    <div className="flex items-center justify-between" id="logs-title-row">
                      <div>
                        <h3 className="font-display font-semibold text-base text-white" id="webhook-logs-title">Monitor de Webhook</h3>
                        <p className="text-xs text-slate-500 mt-1" id="webhook-logs-subtitle">Transações recebidas em tempo real do WhatsApp oficial.</p>
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
                          Nenhum evento registrado ainda. Envie uma mensagem de teste no seu número do WhatsApp.
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
