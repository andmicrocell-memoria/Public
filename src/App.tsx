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
  Pause,
  Loader2,
  Square,
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
import logoUrl from "./assets/images/regenerated_image_1786322262681.png";
import { db, doc, getDoc, setDoc } from "./firebase";

interface AudioMessageBubbleProps {
  msg: ChatMessage;
  isCustomer: boolean;
}

function AudioMessageBubble({ msg, isCustomer }: AudioMessageBubbleProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number>(() => {
    if (msg.audioDuration && msg.audioDuration > 0) return msg.audioDuration;
    return 6;
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!msg.mediaUrl) return;
    const audio = new Audio(msg.mediaUrl);
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
        setDuration(Math.round(audio.duration));
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(Math.round(audio.currentTime));
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [msg.mediaUrl]);

  const togglePlay = () => {
    if (!audioRef.current && msg.mediaUrl) {
      audioRef.current = new Audio(msg.mediaUrl);
    }
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(e => {
        console.warn("Audio playback error:", e);
        setIsPlaying(true);
        const timer = setInterval(() => {
          setCurrentTime(prev => {
            if (prev >= duration) {
              clearInterval(timer);
              setIsPlaying(false);
              return 0;
            }
            return prev + 1;
          });
        }, 1000);
      });
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : (isPlaying ? 50 : 0);

  const cleanTranscript = msg.text
    ? msg.text
        .replace(/^\[Áudio do cliente\]:\s*/i, "")
        .replace(/^\[Áudio gravado\]:\s*/i, "")
        .replace(/^🎙️\s*\[Áudio Gravado\]/i, "")
        .replace(/^🎙️\s*/i, "")
        .trim()
    : "";

  return (
    <div className="space-y-2 min-w-[210px] max-w-[280px]" id={`audio-player-${msg.id}`}>
      {/* Audio Player Row */}
      <div className="flex items-center gap-2.5 py-1">
        <button
          type="button"
          onClick={togglePlay}
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-90 cursor-pointer shadow-md ${
            isCustomer
              ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30"
              : "bg-white text-emerald-800 hover:bg-emerald-50 shadow-black/10"
          }`}
          title={isPlaying ? "Pausar áudio" : "Ouvir áudio gravado"}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        {/* Audio Waveform visualization */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-0.5 h-5">
            {[40, 75, 30, 90, 60, 100, 45, 85, 50, 95, 65, 35, 80, 55, 90, 40, 70, 95, 50, 75].map((h, i) => {
              const barPct = (i / 20) * 100;
              const isPlayed = progressPct >= barPct;
              return (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isPlayed
                      ? isCustomer
                        ? "bg-emerald-400"
                        : "bg-white"
                      : isCustomer
                      ? "bg-slate-700"
                      : "bg-emerald-300/40"
                  }`}
                  style={{ height: `${h}%` }}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono opacity-80">
            <span>{formatTime(currentTime > 0 ? currentTime : (duration || 6))}</span>
            <span className="flex items-center gap-1 font-semibold">
              <Mic className="w-2.5 h-2.5" /> Mensagem de Voz
            </span>
          </div>
        </div>
      </div>

      {/* Transcription Quote Box */}
      {cleanTranscript && cleanTranscript !== "Processando áudio com IA..." && cleanTranscript !== "Processando áudio..." && (
        <div className={`text-xs mt-1 p-2 rounded-xl border leading-relaxed ${
          isCustomer 
            ? "bg-slate-950/70 border-slate-800 text-slate-200" 
            : "bg-emerald-700/60 border-emerald-500/40 text-emerald-50"
        }`}>
          <div className="flex items-center gap-1 text-[9px] font-bold opacity-75 uppercase tracking-wider mb-0.5">
            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" /> Transcrição da Voz:
          </div>
          <p className="italic font-medium">"{cleanTranscript}"</p>
        </div>
      )}
    </div>
  );
}

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
    aiRuntimeMode: "operations_internal",
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
  const isCustomerSupportRuntime = config.aiRuntimeMode === "customer_support";

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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings' | 'integration' | 'blog' | 'agent'>('dashboard');
  const [crmTab, setCrmTab] = useState<'profile' | 'ai_adjust'>('profile');
  const [quickFaqQ, setQuickFaqQ] = useState("");
  const [quickFaqA, setQuickFaqA] = useState("");
  const [isViewingPublicSite, setIsViewingPublicSite] = useState(() => {
    const isLocalEnvironment = window.location.hostname.includes("localhost") ||
      window.location.hostname.includes("127.0.0.1");
    const isAdminHostname = window.location.hostname.startsWith("app.") ||
      window.location.hostname.startsWith("painel.");

    // Permite que os subdomínios administrativos acessem sempre o painel.
    if (isAdminHostname) {
      return false;
    }

    // Em domínios públicos fora do subdomínio administrativo, prioriza o site público.
    if (!isLocalEnvironment) {
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
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isTranscribingAudio, setIsTranscribingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<any>(null);
  const isCancelledRef = useRef<boolean>(false);
  const audioFileInputRef = useRef<HTMLInputElement>(null);
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
  const [agentCommandInput, setAgentCommandInput] = useState("");
  const [isAgentSending, setIsAgentSending] = useState(false);
  const [agentThinkingMode, setAgentThinkingMode] = useState<'operations' | 'operations_pro'>(() => {
    const saved = localStorage.getItem("andmicrocell_agent_thinking_mode");
    return saved === "operations" ? "operations" : "operations_pro";
  });
  const [agentMessages, setAgentMessages] = useState<Array<{ id: string; role: "user" | "ai" | "error"; text: string; timestamp: string }>>([
    {
      id: "agent-welcome",
      role: "ai",
      text: "Agente IA online. Envie um comando para suporte, técnico ou gestão.",
      timestamp: new Date().toTimeString().substring(0, 5)
    }
  ]);
  
  // States for Pricing Table management
  const [pricingSearch, setPricingSearch] = useState("");
  const [pricingCategoryFilter, setPricingCategoryFilter] = useState<string>("all");
  const [pricingDeviceModel, setPricingDeviceModel] = useState("");
  const [pricingServiceName, setPricingServiceName] = useState("");
  const [pricingEstimate, setPricingEstimate] = useState("");
  const [pricingNotes, setPricingNotes] = useState("");
  const [pricingCategory, setPricingCategory] = useState<'iphone' | 'android' | 'notebook' | 'other'>("iphone");
  const [editingPricingId, setEditingPricingId] = useState<string | null>(null);

  // States for Cascading Supplier Price Calculator
  const [calcCostPrice, setCalcCostPrice] = useState<string>("");
  const [calcProfitMargin, setCalcProfitMargin] = useState<number>(50);
  const [calcOpMargin, setCalcOpMargin] = useState<number>(40);
  const [calcRound, setCalcRound] = useState<boolean>(true);
  
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

  const compactAgentReply = (rawText: string) => {
    const text = (rawText || "")
      .replace(/\*\*/g, "")
      .replace(/^\s*[-*]\s+/gm, "")
      .replace(/\r/g, "")
      .trim();

    if (!text) return "Sem conteudo de resposta da IA.";

    const compact = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 18)
      .join("\n");

    return compact.length > 2600 ? `${compact.slice(0, 2600)}...` : compact;
  };

  const handleSendAgentCommand = async () => {
    const command = agentCommandInput.trim();
    if (!command || isAgentSending) return;

    const userMsg = {
      id: `agent-user-${Date.now()}`,
      role: "user" as const,
      text: command,
      timestamp: new Date().toTimeString().substring(0, 5)
    };

    const pendingMessages = [userMsg, ...agentMessages];
    setAgentMessages(pendingMessages);
    setAgentCommandInput("");
    setIsAgentSending(true);

    try {
      const payloadMessages = pendingMessages
        .filter((m) => m.role !== "error")
        .slice(0, 20)
        .reverse()
        .map((m) => ({
          sender: m.role === "user" ? "user" : "agent",
          text: m.text
        }));

      const response = await fetch(getApiUrl("/api/agent/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config,
          mode: agentThinkingMode,
          messages: payloadMessages
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Falha ao consultar IA");
      }

      const aiMsg = {
        id: `agent-ai-${Date.now()}`,
        role: "ai" as const,
        text: compactAgentReply(data?.text || "Sem conteudo de resposta da IA."),
        timestamp: new Date().toTimeString().substring(0, 5)
      };

      setAgentMessages((prev) => {
        const cleaned = prev.filter((m) => {
          if (m.role !== "error") return true;
          const txt = (m.text || "").toLowerCase();
          // Clear stale runtime errors after a successful response.
          return !(txt.includes("is not defined") || txt.includes("referenceerror"));
        });
        return [aiMsg, ...cleaned];
      });
      addLog("system", "Comando executado na aba Agente IA", command);
    } catch (error: any) {
      const errMsg = {
        id: `agent-err-${Date.now()}`,
        role: "error" as const,
        text: error?.message || "Erro ao consultar IA.",
        timestamp: new Date().toTimeString().substring(0, 5)
      };
      setAgentMessages((prev) => [errMsg, ...prev]);
    } finally {
      setIsAgentSending(false);
    }
  };

  useEffect(() => {
    localStorage.setItem("andmicrocell_agent_thinking_mode", agentThinkingMode);
  }, [agentThinkingMode]);

  // Helper to generate AI reply for a given session and message history
  const generateAiReplyForConversation = async (
    targetSessionId: string, 
    messagesForContext: ChatMessage[],
    customerName: string
  ) => {
    setIsAiAnswering(true);
    setTypingStatus("generating");

    try {
      const response = await fetch(getApiUrl("/api/agent/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config,
          messages: messagesForContext.map(m => ({ sender: m.sender, text: m.text }))
        })
      });

      const data = await response.json();
      const aiResponseText = data.text || "Olá! Como posso te ajudar na AndMicrocell?";

      const isAuto = config.autoRespondWhatsApp;
      const responseStatus: ChatMessage['status'] = isAuto ? "sent" : "pending_approval";

      setTypingStatus("typing");

      const msgId = `msg-${Date.now() + 1}`;
      const newAiMsgPlaceholder: ChatMessage = {
        id: msgId,
        sender: "agent",
        text: "",
        timestamp: new Date().toTimeString().substring(0, 5),
        status: responseStatus
      };

      setSessions(prev => prev.map(s => {
        if (s.id === targetSessionId) {
          return {
            ...s,
            messages: [...s.messages, newAiMsgPlaceholder]
          };
        }
        return s;
      }));

      const words = aiResponseText.split(" ");
      let currentTypedText = "";
      let wordIndex = 0;

      const typingInterval = setInterval(() => {
        if (wordIndex < words.length) {
          currentTypedText += (wordIndex === 0 ? "" : " ") + words[wordIndex];
          wordIndex++;

          setSessions(prev => prev.map(s => {
            if (s.id === targetSessionId) {
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
            addLog("whatsapp_sent", `IA respondeu automaticamente no WhatsApp`, `Para ${customerName}`);
          } else {
            addLog("system", `Rascunho de resposta gerado pela IA`, `Aguardando aprovação para ${customerName}`);
          }
        }
      }, 70);

    } catch (err) {
      console.error(err);
      addLog("system", "Erro ao gerar resposta com a IA", "Verifique o log do servidor.");
      setIsAiAnswering(false);
      setTypingStatus(null);
    }
  };

  // Start live Voice Recording using MediaRecorder API
  const startAudioRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Seu navegador não tem suporte a gravação direta de áudio. Você pode usar a opção de anexar arquivo de áudio.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      audioChunksRef.current = [];
      isCancelledRef.current = false;

      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        }
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach(t => t.stop());
          audioStreamRef.current = null;
        }

        if (isCancelledRef.current) {
          audioChunksRef.current = [];
          return;
        }

        const blobType = mediaRecorder.mimeType || mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: blobType });
        audioChunksRef.current = [];

        if (audioBlob.size > 0) {
          await handleSendCustomerAudio(audioBlob, recordingDuration || 4, blobType);
        }
      };

      mediaRecorder.start(250);
      setIsRecordingAudio(true);
      setRecordingDuration(0);

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error("Erro ao acessar microfone:", err);
      alert("Acesso ao microfone não autorizado. Permita o uso do microfone no seu navegador para enviar mensagens de áudio.");
      setIsRecordingAudio(false);
    }
  };

  // Stop recording and process
  const stopAudioRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    isCancelledRef.current = false;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingAudio(false);
  };

  // Cancel recording
  const cancelAudioRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    isCancelledRef.current = true;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(t => t.stop());
      audioStreamRef.current = null;
    }
    audioChunksRef.current = [];
    setIsRecordingAudio(false);
    setRecordingDuration(0);
  };

  // Handle recorded or uploaded customer audio
  const handleSendCustomerAudio = async (audioBlob: Blob, durationSec: number, mimeType: string = "audio/webm") => {
    const currentSession = sessions.find(s => s.id === selectedSessionId) || realSessions.find(s => s.id === selectedSessionId);
    if (!currentSession) return;

    const localAudioUrl = URL.createObjectURL(audioBlob);
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const audioMsgId = `audio-${Date.now()}`;

    const initialAudioMsg: ChatMessage = {
      id: audioMsgId,
      sender: "customer",
      text: "Processando áudio com IA...",
      timestamp: timeStr,
      mediaUrl: localAudioUrl,
      mediaType: "audio",
      audioDuration: durationSec || 4
    };

    const updatedMessages = [...currentSession.messages, initialAudioMsg];

    setSessions(prev => prev.map(s => {
      if (s.id === selectedSessionId) {
        return {
          ...s,
          lastMessage: "🎙️ [Mensagem de Áudio]",
          unreadCount: 0,
          messages: updatedMessages
        };
      }
      return s;
    }));

    playNotificationSound();
    setIsTranscribingAudio(true);
    addLog("whatsapp_received", `Áudio recebido no WhatsApp (${durationSec}s)`, `${currentSession.customerName}: Gravou mensagem de voz`);

    // Check if muted
    const cleanPhoneStr = currentSession.customerPhone.replace(/\D/g, "");
    const isMuted = (config.mutedPhones || []).some(p => p.replace(/\D/g, "") === cleanPhoneStr);

    // Convert Blob to Base64 for Gemini transcription
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      let transcribedText = "";
      try {
        const base64Data = reader.result as string;
        const response = await fetch(getApiUrl("/api/agent/transcribe-audio"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audioBase64: base64Data,
            mimeType: mimeType || 'audio/webm'
          })
        });

        const data = await response.json();
        transcribedText = (data.transcription || "").trim();
      } catch (err: any) {
        console.warn("Erro ao chamar API de transcrição:", err);
      }

      if (!transcribedText) {
        transcribedText = "Olá, gostaria de tirar uma dúvida sobre o conserto do meu aparelho na AndMicrocell.";
      }

      // Update message with actual transcription
      const finalAudioMsg: ChatMessage = {
        ...initialAudioMsg,
        text: transcribedText
      };

      const finalMessages = currentSession.messages.concat([finalAudioMsg]);

      setSessions(prev => prev.map(s => {
        if (s.id === selectedSessionId) {
          return {
            ...s,
            lastMessage: `🎙️ ${transcribedText}`,
            messages: s.messages.map(m => m.id === audioMsgId ? finalAudioMsg : m)
          };
        }
        return s;
      }));

      addLog("whatsapp_received", `Áudio transcrito com IA`, `Texto: "${transcribedText}"`);
      setIsTranscribingAudio(false);

      if (isMuted) {
        setTimeout(() => {
          const systemInfoMsg: ChatMessage = {
            id: `msg-${Date.now() + 1}`,
            sender: "system",
            text: "Robô Silenciado para esta conversa. O atendimento deve ser feito manualmente.",
            timestamp: timeStr
          };
          setSessions(prev => prev.map(s => {
            if (s.id === selectedSessionId) {
              return {
                ...s,
                messages: [...s.messages, systemInfoMsg]
              };
            }
            return s;
          }));
        }, 500);
        return;
      }

      // Trigger AI Answer
      await generateAiReplyForConversation(selectedSessionId, finalMessages, currentSession.customerName);
    };
  };

  // Fast simulated voice notes for instant 1-click testing
  const handleSendSimulatedAudio = async (textSpoken: string, durationSec: number = 6) => {
    const currentSession = sessions.find(s => s.id === selectedSessionId) || realSessions.find(s => s.id === selectedSessionId);
    if (!currentSession) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const audioMsgId = `audio-${Date.now()}`;

    const audioMsg: ChatMessage = {
      id: audioMsgId,
      sender: "customer",
      text: textSpoken,
      timestamp: timeStr,
      mediaType: "audio",
      audioDuration: durationSec
    };

    const updatedMessages = [...currentSession.messages, audioMsg];

    setSessions(prev => prev.map(s => {
      if (s.id === selectedSessionId) {
        return {
          ...s,
          lastMessage: `🎙️ ${textSpoken}`,
          unreadCount: 0,
          messages: updatedMessages
        };
      }
      return s;
    }));

    playNotificationSound();
    addLog("whatsapp_received", `Áudio de cliente recebido (${durationSec}s)`, `${currentSession.customerName}: "${textSpoken}"`);

    const cleanPhoneStr = currentSession.customerPhone.replace(/\D/g, "");
    const isMuted = (config.mutedPhones || []).some(p => p.replace(/\D/g, "") === cleanPhoneStr);
    if (isMuted) return;

    await generateAiReplyForConversation(selectedSessionId, updatedMessages, currentSession.customerName);
  };

  // Handle manual audio file upload from file picker
  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleSendCustomerAudio(file, 6, file.type || "audio/mp3");
    if (e.target) e.target.value = "";
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

    await generateAiReplyForConversation(selectedSessionId, updatedMessages, currentSession.customerName);
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

  const sanitizeExportFileName = (value: string) => {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "historico";
  };

  const buildMobileHistoryRows = (sourceSessions: ChatSession[]) => {
    return sourceSessions.flatMap((session) => {
      const origin = session.isReal ? "Real" : "Teste";
      const tags = (session.tags || []).join(", ");
      const notes = session.notes || "";

      if (!session.messages.length) {
        return [{
          conversa: session.customerName,
          telefone: session.customerPhone,
          origem: origin,
          remetente: "Sistema",
          horario: "-",
          tipo: "Sem mensagens",
          mensagem: session.lastMessage || "Sem histórico disponível.",
          tags,
          observacoes: notes,
        }];
      }

      return session.messages.map((message) => ({
        conversa: session.customerName,
        telefone: session.customerPhone,
        origem: origin,
        remetente: message.sender === "customer" ? "Cliente" : message.sender === "agent" ? "Agente" : "Sistema",
        horario: message.timestamp || "-",
        tipo: message.mediaType || "texto",
        mensagem: message.text || "",
        tags,
        observacoes: notes,
      }));
    });
  };

  const getMobileHistoryExportContext = () => {
    if (mobileActiveSection === "chat" && selectedSession) {
      return {
        scopeLabel: selectedSession.customerName,
        fileLabel: sanitizeExportFileName(selectedSession.customerName),
        rows: buildMobileHistoryRows([selectedSession]),
      };
    }

    const scopeLabel = sessionSource === "real"
      ? "conversas-reais"
      : sessionSource === "simulated"
      ? "conversas-de-teste"
      : "todas-as-conversas";

    return {
      scopeLabel,
      fileLabel: sanitizeExportFileName(scopeLabel),
      rows: buildMobileHistoryRows(displayedSessions),
    };
  };

  const handleExportMobileHistoryExcel = async () => {
    const { rows, scopeLabel, fileLabel } = getMobileHistoryExportContext();
    if (!rows.length) {
      window.alert("Nenhum histórico disponível para exportar em Excel.");
      return;
    }

    const { utils, writeFile } = await import("xlsx");
    const workbook = utils.book_new();
    const worksheet = utils.json_to_sheet(rows);
    worksheet["!cols"] = [
      { wch: 24 },
      { wch: 18 },
      { wch: 10 },
      { wch: 12 },
      { wch: 10 },
      { wch: 12 },
      { wch: 70 },
      { wch: 24 },
      { wch: 36 },
    ];
    utils.book_append_sheet(workbook, worksheet, "Historico");
    writeFile(workbook, `historico-${fileLabel}.xlsx`);
    addLog("system", "Histórico exportado em Excel no Modo Celular", `${scopeLabel}: ${rows.length} registros`);
  };

  const handleExportMobileHistoryPdf = async () => {
    const { rows, scopeLabel, fileLabel } = getMobileHistoryExportContext();
    if (!rows.length) {
      window.alert("Nenhum histórico disponível para exportar em PDF.");
      return;
    }

    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    let cursorY = margin;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Histórico do Modo Celular", margin, cursorY);
    cursorY += 18;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Escopo: ${scopeLabel}`, margin, cursorY);
    cursorY += 14;
    doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, margin, cursorY);
    cursorY += 22;

    rows.forEach((row) => {
      const headerLines = doc.splitTextToSize(
        `${row.conversa} | ${row.telefone} | ${row.origem} | ${row.horario}`,
        pageWidth - margin * 2
      );
      const bodyLines = doc.splitTextToSize(
        `Remetente: ${row.remetente} | Tipo: ${row.tipo}\nMensagem: ${row.mensagem}${row.tags ? `\nTags: ${row.tags}` : ""}${row.observacoes ? `\nObservações: ${row.observacoes}` : ""}`,
        pageWidth - margin * 2
      );
      const blockHeight = (headerLines.length + bodyLines.length) * 12 + 18;

      if (cursorY + blockHeight > pageHeight - margin) {
        doc.addPage();
        cursorY = margin;
      }

      doc.setFont("helvetica", "bold");
      doc.text(headerLines, margin, cursorY);
      cursorY += headerLines.length * 12;

      doc.setFont("helvetica", "normal");
      doc.text(bodyLines, margin, cursorY);
      cursorY += bodyLines.length * 12 + 8;

      doc.setDrawColor(60, 72, 88);
      doc.line(margin, cursorY, pageWidth - margin, cursorY);
      cursorY += 12;
    });

    doc.save(`historico-${fileLabel}.pdf`);
    addLog("system", "Histórico exportado em PDF no Modo Celular", `${scopeLabel}: ${rows.length} registros`);
  };

  if (isViewingPublicSite) {
    const isLocalEnvironment = window.location.hostname.includes("localhost") ||
      window.location.hostname.includes("127.0.0.1");
    
    const showBackBanner = isLocalEnvironment;

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
              <div className="px-3 py-2 bg-[#0b101d] border-b border-slate-800/60 shrink-0">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleExportMobileHistoryExcel}
                    className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-300 hover:text-white cursor-pointer flex items-center justify-center gap-2"
                    title="Exportar o histórico atual da lista em Excel"
                  >
                    <Download className="w-4 h-4" />
                    <span>Exportar Excel</span>
                  </button>
                  <button
                    onClick={handleExportMobileHistoryPdf}
                    className="px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs font-bold text-indigo-300 hover:text-white cursor-pointer flex items-center justify-center gap-2"
                    title="Exportar o histórico atual da lista em PDF"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Exportar PDF</span>
                  </button>
                </div>
              </div>

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

              <div className="px-3 py-2 bg-[#0b101d] border-b border-slate-800/60 shrink-0">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleExportMobileHistoryExcel}
                    className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-300 hover:text-white cursor-pointer flex items-center justify-center gap-2"
                    title="Exportar esta conversa em Excel"
                  >
                    <Download className="w-4 h-4" />
                    <span>Exportar Excel</span>
                  </button>
                  <button
                    onClick={handleExportMobileHistoryPdf}
                    className="px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs font-bold text-indigo-300 hover:text-white cursor-pointer flex items-center justify-center gap-2"
                    title="Exportar esta conversa em PDF"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Exportar PDF</span>
                  </button>
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
                    const isAudio = msg.mediaType === "audio" || !!msg.mediaUrl || (msg.text && (msg.text.startsWith("[Áudio") || msg.text.startsWith("🎙️")));

                    return (
                      <div
                        key={msg.id || idx}
                        className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[88%] rounded-2xl p-3 shadow-md ${
                            isCustomer
                              ? 'bg-slate-900 text-slate-100 rounded-tl-sm border border-slate-800'
                              : 'bg-emerald-600 text-white rounded-tr-sm'
                          }`}
                        >
                          {isAudio ? (
                            <AudioMessageBubble msg={msg} isCustomer={isCustomer} />
                          ) : (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                          )}
                          <div className="flex items-center justify-end gap-1 mt-1.5">
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

                {/* Transcribing Audio Indicator */}
                {isTranscribingAudio && (
                  <div className="flex justify-start">
                    <div className="p-3 rounded-2xl bg-indigo-950/70 border border-indigo-500/40 text-indigo-200 text-xs flex items-center gap-2.5 shadow-lg shadow-indigo-950/30 animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-400 shrink-0" />
                      <div>
                        <p className="font-semibold text-indigo-300">Ouvindo e transcrevendo áudio com IA...</p>
                        <p className="text-[10px] text-indigo-400/80">Convertendo voz para texto e preparando orçamento</p>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef}></div>
              </div>

              {/* Mobile Quick Replies Menu (Shrink-0 above input) */}
              <div className="bg-[#090e17] border-t border-slate-800/60 px-3 py-2 flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none shrink-0">
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
                  ⚡ Rápidas:
                </p>

                {/* Quick Simulated Audio Buttons */}
                <button
                  onClick={() => handleSendSimulatedAudio("Olá, bom dia! Gostaria de saber o valor para trocar a tela do meu iPhone 11 que quebrou.", 7)}
                  className="px-3 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-xs font-medium text-emerald-200 shrink-0 cursor-pointer hover:bg-emerald-900/60 active:scale-95 flex items-center gap-1.5 transition-all"
                  title="Simular envio de áudio: Troca de Tela iPhone 11"
                >
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  <span>🎙️ Áudio: Tela iPhone 11</span>
                </button>

                <button
                  onClick={() => handleSendSimulatedAudio("Boa tarde! Quanto fica para formatar meu notebook Dell e colocar SSD de 240GB?", 6)}
                  className="px-3 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-xs font-medium text-emerald-200 shrink-0 cursor-pointer hover:bg-emerald-900/60 active:scale-95 flex items-center gap-1.5 transition-all"
                  title="Simular envio de áudio: Formatação e SSD"
                >
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  <span>🎙️ Áudio: Formatar Notebook</span>
                </button>

                <button
                  onClick={() => handleSendSimulatedAudio("Oi, meu celular caiu na água hoje cedo e apagou. Vocês fazem reparo na placa?", 6)}
                  className="px-3 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-xs font-medium text-emerald-200 shrink-0 cursor-pointer hover:bg-emerald-900/60 active:scale-95 flex items-center gap-1.5 transition-all"
                  title="Simular envio de áudio: Celular Molhou"
                >
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  <span>🎙️ Áudio: Celular Molhou</span>
                </button>

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
                {/* Hidden Audio File Input */}
                <input
                  type="file"
                  ref={audioFileInputRef}
                  accept="audio/*"
                  className="hidden"
                  onChange={handleAudioFileUpload}
                />

                {isRecordingAudio ? (
                  /* Active Live Voice Recording Bar */
                  <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-950 border border-rose-500/40 animate-pulse">
                    <div className="flex items-center gap-2 flex-1 px-3 min-w-0">
                      <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0 animate-ping"></span>
                      <span className="text-xs font-mono font-bold text-rose-400 shrink-0">
                        {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60) < 10 ? '0' : ''}{recordingDuration % 60}
                      </span>
                      
                      {/* Animated audio bars */}
                      <div className="flex items-center gap-0.5 ml-2 h-4 overflow-hidden">
                        {[40, 85, 50, 100, 70, 35, 95, 60, 45, 90, 65, 30].map((h, i) => (
                          <div 
                            key={i} 
                            className="w-1 bg-rose-400 rounded-full animate-bounce shrink-0" 
                            style={{ height: `${h}%`, animationDelay: `${i * 90}ms`, animationDuration: '800ms' }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Cancel Recording */}
                    <button
                      type="button"
                      onClick={cancelAudioRecording}
                      className="px-3 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                      title="Cancelar gravação"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Cancelar</span>
                    </button>

                    {/* Finish and Send Audio */}
                    <button
                      type="button"
                      onClick={stopAudioRecording}
                      className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-md shadow-emerald-600/20 shrink-0"
                      title="Enviar áudio gravado"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar</span>
                    </button>
                  </div>
                ) : (
                  /* Standard Input Form */
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
                    {/* Attach Audio File from device */}
                    <button
                      type="button"
                      onClick={() => audioFileInputRef.current?.click()}
                      disabled={isAiAnswering || isSendingManual || isTranscribingAudio}
                      className="h-11 w-11 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                      title="Anexar arquivo de áudio (MP3, M4A, OGG, WAV)"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    {/* Text Input */}
                    <input
                      type="text"
                      value={whatsappInputValue}
                      onChange={(e) => setWhatsappInputValue(e.target.value)}
                      placeholder={selectedSession?.isReal ? "Enviar resposta oficial..." : "Digite ou grave um áudio..."}
                      disabled={isAiAnswering || isSendingManual || isTranscribingAudio}
                      className="flex-1 px-3.5 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-base focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all min-w-0"
                    />

                    {/* If text entered, show Send; otherwise show Microphone Recording Button! */}
                    {whatsappInputValue.trim() ? (
                      <button
                        type="submit"
                        disabled={isAiAnswering || isSendingManual}
                        className="h-11 w-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium transition-colors flex items-center justify-center shrink-0 cursor-pointer shadow-md shadow-emerald-600/10"
                        title="Enviar mensagem de texto"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={startAudioRecording}
                        disabled={isAiAnswering || isSendingManual || isTranscribingAudio}
                        className="h-11 w-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-medium transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-md shadow-emerald-600/30 ring-2 ring-emerald-500/30"
                        title="Toque para gravar mensagem de voz no WhatsApp"
                      >
                        <Mic className="w-5 h-5" />
                      </button>
                    )}
                  </form>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  const useCompactWorkspace = false;

  if (useCompactWorkspace) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white flex flex-col" id="app-root-compact">
        <header className="border-b border-slate-800 bg-[#0b0f19]/80 backdrop-blur-md sticky top-0 z-40" id="header-compact">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5" id="header-compact-logo-group">
              <div className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center" id="header-compact-badge">
                <img
                  src={logoUrl}
                  alt="AndMicrocell Logo"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h1 className="font-display font-extrabold text-xl tracking-tight text-white" id="header-compact-title">
                  ZetaChat AI
                </h1>
                <p className="text-xs text-slate-400 font-medium" id="header-compact-subtitle">
                  Workspace limpo e focado
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8" id="workspace-main-compact">
          <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-6" id="workspace-sidebar-compact">
            <div className="p-5 rounded-2xl bg-[#0b101d] border border-slate-800/60" id="sidebar-nav-card-compact">
              <h3 className="text-slate-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-3 px-2" id="nav-label-compact">Navegação</h3>
              <nav className="flex flex-col gap-1.5" id="nav-group-compact">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                  id="btn-nav-dashboard-compact"
                >
                  <Activity className="w-4 h-4" />
                  <span>Painel Geral</span>
                </button>

                <button
                  onClick={() => setActiveTab('agent')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    activeTab === 'agent'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                  id="btn-nav-agent-compact"
                >
                  <Bot className="w-4 h-4 text-emerald-400" />
                  <span>Agente IA</span>
                </button>

                <button
                  onClick={() => setActiveTab('blog')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    activeTab === 'blog'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                  id="btn-nav-blog-compact"
                >
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span>Mini Site & Blog</span>
                </button>

                <button
                  onClick={() => setActiveTab('integration')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    activeTab === 'integration'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/10'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                  id="btn-nav-integration-compact"
                >
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Integração Chatwoot</span>
                </button>
              </nav>
            </div>
          </aside>

          <section className="flex-1 min-w-0" id="workspace-viewport-compact">
            <AnimatePresence mode="wait" id="tab-animate-presence-compact">
              {activeTab === 'dashboard' && (
                <motion.div
                  key="dashboard-tab-compact"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="p-6 rounded-3xl bg-[#0b101d] border border-slate-800/60 space-y-4"
                  id="dashboard-tab-panel-compact"
                >
                  <h3 className="font-display font-semibold text-base text-white">Painel Geral</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Área simplificada temporariamente. Use a navegação ao lado para acessar Agente IA, Mini Site & Blog e Integração Chatwoot.
                  </p>
                </motion.div>
              )}

              {activeTab === 'agent' && (
                <motion.div
                  key="agent-tab-compact"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full"
                  id="agent-tab-panel-compact"
                >
                  <div className="lg:col-span-2 p-6 rounded-3xl bg-[#0b101d] border border-slate-800/60 space-y-4" id="agent-chat-card-compact">
                    <h3 className="font-display font-semibold text-base text-white flex items-center gap-2">
                      <Bot className="w-5 h-5 text-emerald-400" />
                      Central da Agente IA
                    </h3>

                    <div className="h-[360px] overflow-y-auto p-4 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-3" id="agent-messages-list-compact">
                      {agentMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-3 rounded-xl border text-sm leading-relaxed ${
                            msg.role === "user"
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                              : msg.role === "ai"
                              ? "bg-indigo-500/10 border-indigo-500/20 text-slate-100"
                              : "bg-rose-500/10 border-rose-500/20 text-rose-300"
                          }`}
                        >
                          <p>{msg.text}</p>
                          <p className="text-[10px] mt-1 opacity-70 font-mono">{msg.timestamp}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2" id="agent-input-row-compact">
                      <input
                        type="text"
                        value={agentCommandInput}
                        onChange={(e) => setAgentCommandInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSendAgentCommand();
                          }
                        }}
                        placeholder="Ex: Liste riscos operacionais e ações de hoje"
                        className="flex-1 px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                        id="input-agent-command-compact"
                      />
                      <button
                        onClick={handleSendAgentCommand}
                        disabled={isAgentSending || !agentCommandInput.trim()}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                        id="btn-send-agent-command-compact"
                      >
                        {isAgentSending ? "Enviando..." : "Enviar"}
                      </button>
                    </div>
                  </div>

                  <div className="p-6 rounded-3xl bg-[#0b101d] border border-slate-800/60 space-y-3" id="agent-guides-card-compact">
                    <h4 className="font-display font-semibold text-sm text-white">Comandos Rápidos</h4>
                    {[
                      "Resuma os incidentes críticos do dia e priorize ações.",
                      "Monte um plano de atendimento para reduzir tempo de resposta no WhatsApp.",
                      "Liste os maiores riscos da operação e a mitigação recomendada.",
                      "Crie um plano de execução para as próximas 3 horas."
                    ].map((cmd, idx) => (
                      <button
                        key={idx}
                        onClick={() => setAgentCommandInput(cmd)}
                        className="w-full text-left p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-slate-300 text-xs transition-colors cursor-pointer"
                      >
                        {cmd}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'blog' && (
                <motion.div
                  key="blog-tab-compact"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="w-full"
                  id="blog-tab-panel-compact"
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
                  key="integration-tab-compact"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="p-6 rounded-3xl bg-[#0b101d] border border-slate-800/60 space-y-6"
                  id="integration-tab-panel-compact"
                >
                  <div>
                    <h3 className="font-display font-semibold text-base text-white flex items-center gap-2">
                      <Shield className="w-5 h-5 text-emerald-400" />
                      Integração Chatwoot
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Painel reduzido para o essencial da integração.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1.5">URL da Instância do Chatwoot</label>
                      <input
                        type="text"
                        value={localChatwootUrl}
                        onChange={(e) => setLocalChatwootUrl(e.target.value)}
                        placeholder="Ex: https://atendimento.andmicrocell.com.br"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                        id="input-chatwoot-url-compact"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1.5">Token de Acesso (api_access_token)</label>
                      <input
                        type="password"
                        value={localChatwootToken}
                        onChange={(e) => setLocalChatwootToken(e.target.value)}
                        placeholder="Insira o seu token"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                        id="input-chatwoot-token-compact"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handleSaveChatwootDetails}
                        disabled={isSavingChatwoot}
                        className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isSavingChatwoot
                            ? 'bg-slate-800 text-slate-500'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        }`}
                        id="btn-save-chatwoot-details-compact"
                      >
                        {isSavingChatwoot ? "Salvando..." : "Salvar Configurações"}
                      </button>

                      <button
                        onClick={handleTestChatwootConnection}
                        disabled={isTestingChatwoot || !localChatwootUrl || !localChatwootToken}
                        className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                          isTestingChatwoot
                            ? 'bg-slate-800 text-slate-500 border-transparent'
                            : !localChatwootUrl || !localChatwootToken
                            ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                        id="btn-test-chatwoot-details-compact"
                      >
                        {isTestingChatwoot ? "Testando..." : "Testar Conexão"}
                      </button>
                    </div>

                    {chatwootTestResult && (
                      <div
                        className={`p-3.5 rounded-xl text-xs border ${
                          chatwootTestResult.success
                            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
                            : 'bg-rose-950/20 border-rose-500/30 text-rose-400'
                        }`}
                        id="chatwoot-test-result-compact"
                      >
                        <p className="font-semibold">{chatwootTestResult.success ? "Conexão Estabelecida" : "Erro de Conexão"}</p>
                        <p className="mt-1">{chatwootTestResult.message}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
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
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border ${isCustomerSupportRuntime ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
              <Shield className={`w-3.5 h-3.5 ${isCustomerSupportRuntime ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span className={`font-medium ${isCustomerSupportRuntime ? 'text-emerald-300' : 'text-amber-300'}`}>
                Modo IA: {isCustomerSupportRuntime ? "Atendimento" : "Interno"}
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
                onClick={() => setActiveTab('agent')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  activeTab === 'agent'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
                id="btn-nav-agent"
              >
                <Bot className="w-4 h-4 text-emerald-400" />
                <span className="flex items-center gap-1.5">
                  Agente IA
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



            {false && (
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
                      <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/70 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">Modo de Runtime da IA</h4>
                            <p className="text-[11px] text-slate-400 mt-1">
                              Defina se a IA fica apenas para operação interna ou se pode atender clientes no Chatwoot.
                            </p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${isCustomerSupportRuntime ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-amber-500/10 border-amber-500/20 text-amber-300'}`}>
                            {isCustomerSupportRuntime ? "ATENDIMENTO AO CLIENTE" : "OPERAÇÃO INTERNA"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            onClick={() => handleSaveConfig({ aiRuntimeMode: "operations_internal" })}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${!isCustomerSupportRuntime ? 'bg-amber-500/10 border-amber-500/30 text-amber-200' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'}`}
                          >
                            <p className="text-xs font-bold">IA Interna (Recomendado)</p>
                            <p className="text-[11px] mt-1 opacity-80">Cria, configura e propõe soluções. Não responde cliente no Chatwoot.</p>
                          </button>

                          <button
                            onClick={() => handleSaveConfig({ aiRuntimeMode: "customer_support" })}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${isCustomerSupportRuntime ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'}`}
                          >
                            <p className="text-xs font-bold">IA Atendimento (Chatwoot)</p>
                            <p className="text-[11px] mt-1 opacity-80">Permite respostas automáticas para clientes via webhook do Chatwoot.</p>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">Configurações de Conexão</h4>
                        <div className="flex items-center gap-2" id="toggle-whatsapp-integration">
                          <span className="text-[10px] font-mono text-slate-400">Responder Automaticamente</span>
                          <button
                            onClick={() => handleSaveConfig({ autoRespondWhatsApp: !config.autoRespondWhatsApp })}
                            className={`w-10 h-5.5 rounded-full p-0.5 transition-colors ${isCustomerSupportRuntime ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'} ${config.autoRespondWhatsApp ? 'bg-indigo-600' : 'bg-slate-800'}`}
                            disabled={!isCustomerSupportRuntime}
                            id="btn-toggle-auto-whatsapp-int"
                          >
                            <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${config.autoRespondWhatsApp ? 'translate-x-4.5' : ''}`}></div>
                          </button>
                        </div>
                      </div>

                      {!isCustomerSupportRuntime && (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                          O atendimento automático está bloqueado porque a IA está em modo interno. Troque para IA Atendimento para liberar respostas no Chatwoot.
                        </div>
                      )}
                      
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

            {activeTab === 'agent' && (
              <motion.div
                key="agent-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full"
                id="agent-tab-panel"
              >
                <div className="lg:col-span-2 p-6 rounded-3xl bg-[#0b101d] border border-slate-800/60 space-y-4" id="agent-chat-card">
                  <div>
                    <h3 className="font-display font-semibold text-base text-white flex items-center gap-2" id="agent-title">
                      <Bot className="w-5 h-5 text-emerald-400" />
                      Central da Agente IA
                    </h3>
                    <p className="text-xs text-slate-400 mt-1" id="agent-subtitle">
                      Use esta área para enviar comandos estratégicos e operacionais para a IA da AndMicrocell.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Nível da IA</span>
                      <button
                        onClick={() => setAgentThinkingMode("operations")}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                          agentThinkingMode === "operations"
                            ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-300"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Executor
                      </button>
                      <button
                        onClick={() => setAgentThinkingMode("operations_pro")}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                          agentThinkingMode === "operations_pro"
                            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Inteligente
                      </button>
                    </div>
                  </div>

                  <div className="h-[420px] overflow-y-auto p-4 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-3" id="agent-messages-list">
                    {agentMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-xl border text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                            : msg.role === "ai"
                            ? "bg-indigo-500/10 border-indigo-500/20 text-slate-100"
                            : "bg-rose-500/10 border-rose-500/20 text-rose-300"
                        }`}
                      >
                        <p>{msg.text}</p>
                        <p className="text-[10px] mt-1 opacity-70 font-mono">{msg.timestamp}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2" id="agent-input-row">
                    <input
                      type="text"
                      value={agentCommandInput}
                      onChange={(e) => setAgentCommandInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSendAgentCommand();
                        }
                      }}
                      placeholder="Ex: Crie um plano de atendimento para hoje com prioridades"
                      className="flex-1 px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                      id="input-agent-command"
                    />
                    <button
                      onClick={handleSendAgentCommand}
                      disabled={isAgentSending || !agentCommandInput.trim()}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                      id="btn-send-agent-command"
                    >
                      {isAgentSending ? "Enviando..." : "Enviar"}
                    </button>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-[#0b101d] border border-slate-800/60 space-y-4" id="agent-guides-card">
                  <h4 className="font-display font-semibold text-sm text-white">Comandos Rápidos</h4>
                  <div className="space-y-2">
                    {[
                      "Resuma os incidentes críticos do dia e priorize ações.",
                      "Monte um plano de atendimento para reduzir tempo de resposta no WhatsApp.",
                      "Liste os maiores riscos da operação e a mitigação recomendada.",
                      "Crie uma resposta pronta para cliente com aparelho molhado."
                    ].map((cmd, idx) => (
                      <button
                        key={idx}
                        onClick={() => setAgentCommandInput(cmd)}
                        className="w-full text-left p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-slate-300 text-xs transition-colors cursor-pointer"
                      >
                        {cmd}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {false && (
              <motion.div
                key="pricing-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full"
                id="pricing-tab-panel"
              >
                {/* Left Column: Form, Calculator and Guides */}
                <div className="lg:col-span-1 space-y-6 flex flex-col" id="pricing-left-column">
                  {/* Form to Add/Edit Price */}
                  <div className="p-6 rounded-3xl bg-[#0b101d] border border-slate-800/60 h-fit space-y-6" id="pricing-form-panel">
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

                  {/* Cascading Supplier Price Calculator */}
                  <div className="p-6 rounded-3xl bg-[#0b101d] border border-slate-800/60 space-y-5" id="pricing-calculator-panel">
                    <div>
                      <h3 className="font-display font-semibold text-sm text-white flex items-center gap-2 animate-pulse" id="pricing-calc-title">
                        <span className="text-emerald-400 text-base">💰</span>
                        Calculadora de Margem em Cascata
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-1" id="pricing-calc-subtitle">
                        Fórmula Oficial: <span className="text-indigo-400 font-mono">(Peça + {calcProfitMargin}%) + {calcOpMargin}%</span>. Evite erros de margem linear.
                      </p>
                    </div>

                    <div className="space-y-3.5" id="pricing-calc-body">
                      <div className="space-y-1.5" id="group-calc-cost">
                        <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Custo da Peça no Fornecedor (R$)</label>
                        <input
                          type="number"
                          placeholder="Ex: 100"
                          value={calcCostPrice}
                          onChange={(e) => setCalcCostPrice(e.target.value)}
                          className="w-full bg-[#131a2c] text-slate-200 placeholder-slate-600 border border-slate-800 rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                          id="input-calc-cost"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3" id="group-calc-margins">
                        <div className="space-y-1" id="group-calc-profit">
                          <label className="text-[9px] text-slate-400 font-medium">Margem de Lucro (%)</label>
                          <input
                            type="number"
                            value={calcProfitMargin}
                            onChange={(e) => setCalcProfitMargin(parseFloat(e.target.value) || 0)}
                            className="w-full bg-[#131a2c] text-slate-200 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                            id="input-calc-profit-margin"
                          />
                        </div>
                        <div className="space-y-1" id="group-calc-op">
                          <label className="text-[9px] text-slate-400 font-medium">Margem Operacional (%)</label>
                          <input
                            type="number"
                            value={calcOpMargin}
                            onChange={(e) => setCalcOpMargin(parseFloat(e.target.value) || 0)}
                            className="w-full bg-[#131a2c] text-slate-200 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                            id="input-calc-op-margin"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 bg-[#131a2c]/30 p-2 rounded-xl border border-slate-900" id="group-calc-round">
                        <input
                          type="checkbox"
                          checked={calcRound}
                          onChange={(e) => setCalcRound(e.target.checked)}
                          className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-[#131a2c] cursor-pointer"
                          id="chk-calc-round"
                        />
                        <label htmlFor="chk-calc-round" className="text-[10px] text-slate-300 cursor-pointer select-none">
                          Arredondar preço final para múltiplos de R$ 5
                        </label>
                      </div>

                      {/* Mathematics Visualization */}
                      {parseFloat(calcCostPrice) > 0 && (
                        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs space-y-2.5" id="pricing-calc-results">
                          <div className="flex justify-between items-center text-slate-400 text-[10px]" id="calc-step-1">
                            <span>Etapa 1: Custo + Lucro (+{calcProfitMargin}%):</span>
                            <span className="font-mono text-slate-200 font-medium">
                              R$ {(parseFloat(calcCostPrice) * (1 + calcProfitMargin/100)).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-slate-400 text-[10px]" id="calc-step-2">
                            <span>Etapa 2: Subtotal + Operacional (+{calcOpMargin}%):</span>
                            <span className="font-mono text-slate-200 font-medium">
                              R$ {((parseFloat(calcCostPrice) * (1 + calcProfitMargin/100)) * (1 + calcOpMargin/100)).toFixed(2)}
                            </span>
                          </div>
                          <div className="h-px bg-slate-800" />
                          <div className="flex justify-between items-center" id="calc-step-final">
                            <span className="font-semibold text-xs text-white">Preço de Venda Sugerido:</span>
                            <span className="font-extrabold text-sm text-emerald-400 font-mono">
                              R$ {calcRound 
                                ? (Math.round(((parseFloat(calcCostPrice) * (1 + calcProfitMargin/100)) * (1 + calcOpMargin/100)) / 5) * 5).toFixed(0)
                                : ((parseFloat(calcCostPrice) * (1 + calcProfitMargin/100)) * (1 + calcOpMargin/100)).toFixed(2)
                              }
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-slate-400" id="calc-step-profit">
                            <span>Lucro Bruto (Peça + Mão de Obra):</span>
                            <span className="font-bold text-emerald-500/90 font-mono">
                              + R$ {(
                                (calcRound 
                                  ? (Math.round(((parseFloat(calcCostPrice) * (1 + calcProfitMargin/100)) * (1 + calcOpMargin/100)) / 5) * 5)
                                  : ((parseFloat(calcCostPrice) * (1 + calcProfitMargin/100)) * (1 + calcOpMargin/100))
                                ) - parseFloat(calcCostPrice)
                              ).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          const costVal = parseFloat(calcCostPrice);
                          if (!costVal) return;
                          const rawP = (costVal * (1 + calcProfitMargin/100)) * (1 + calcOpMargin/100);
                          const finalP = calcRound ? Math.round(rawP / 5) * 5 : rawP;
                          setPricingEstimate(`R$ ${finalP.toFixed(0)}`);
                          
                          // Focus the device model input for smooth flow
                          const el = document.getElementById("input-pricing-model");
                          if (el) el.focus();
                        }}
                        disabled={!calcCostPrice || parseFloat(calcCostPrice) <= 0}
                        className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/15 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-1.5"
                        id="btn-apply-calc-price"
                      >
                        <span>📋</span> Aplicar Valor Calculado no Formulário
                      </button>
                    </div>
                  </div>

                  {/* Standard Pricing Guide / Cheat Sheet */}
                  <div className="p-5 rounded-3xl bg-[#0b101d] border border-slate-800/60 space-y-4" id="pricing-guide-panel">
                    <div>
                      <h4 className="font-display font-semibold text-xs text-white flex items-center gap-2" id="pricing-guide-title">
                        <span>💡</span>
                        Regras de Preços de Computadores e PCs
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5" id="pricing-guide-subtitle">
                        Diretrizes de referência rápida para preenchimento ou consulta.
                      </p>
                    </div>

                    <div className="space-y-3 text-[11px] text-slate-300 leading-relaxed" id="pricing-guide-content">
                      <div className="bg-[#131a2c]/30 p-2.5 rounded-xl border border-slate-900 space-y-1">
                        <p className="font-semibold text-white flex justify-between">
                          <span>🛠️ Manutenção Preventiva</span>
                        </p>
                        <p className="text-slate-400 text-[10px]">
                          • <strong className="text-slate-300">Notebook Básico:</strong> R$ 90<br />
                          • <strong className="text-slate-300">Notebook Gamer/Caro:</strong> Sob Consulta (maior risco técnico)<br />
                          • <strong className="text-slate-300">PC Gamer Completo:</strong> R$ 250 (gabinete 3+ fans, placa offboard, watercooler, etc.)
                        </p>
                      </div>

                      <div className="bg-[#131a2c]/30 p-2.5 rounded-xl border border-slate-900 space-y-1">
                        <p className="font-semibold text-white flex justify-between">
                          <span>💾 Formatação (Sem Backup)</span>
                        </p>
                        <p className="text-slate-400 text-[10px]">
                          • <strong className="text-slate-300">Formatação Simples:</strong> R$ 90<br />
                          • <strong className="text-slate-300">Com Backup:</strong> Ver tabela de referência (70GB a 1TB: R$ 110 - R$ 230)
                        </p>
                      </div>

                      <div className="bg-[#131a2c]/30 p-2.5 rounded-xl border border-slate-900 space-y-1">
                        <p className="font-semibold text-white flex justify-between">
                          <span>⚡ Instalação de Memória / SSD</span>
                        </p>
                        <p className="text-slate-400 text-[10px]">
                          • <strong className="text-slate-300">Aparelho Comum:</strong> R$ 60<br />
                          • <strong className="text-slate-300">Aparelho Gamer/Complexo:</strong> R$ 150 a R$ 180 (dissipadores, desmontagem robusta)
                        </p>
                      </div>
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
