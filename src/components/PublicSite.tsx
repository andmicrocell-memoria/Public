import React, { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  Search, 
  Clock, 
  MapPin, 
  Phone, 
  Calendar, 
  ArrowRight, 
  BookOpen, 
  Sparkles, 
  Wrench, 
  ShieldCheck, 
  Award,
  MessageSquare,
  ThumbsUp,
  ExternalLink,
  Laptop,
  Smartphone,
  Eye,
  Lock,
  Star
} from "lucide-react";
import { BlogPost, BusinessConfig, getApiUrl } from "../types";
import { db, collection, getDocs } from "../firebase";
import staticPosts from "../../data/posts.json";
import staticConfig from "../../data/config.json";
import logoUrl from "../assets/images/regenerated_image_1786322262681.png";

interface PublicSiteProps {
  config: BusinessConfig;
  onBackToAdmin?: () => void;
}

const getAdminAppUrl = (): string => {
  const hostname = window.location.hostname;
  const isAiStudio = hostname.includes("run.app") || 
                     hostname.includes("localhost") || 
                     hostname.includes("127.0.0.1") ||
                     hostname.includes("stackblitz");
                     
  if (isAiStudio) {
    return `${window.location.origin}?admin=true`;
  }
  
  if (hostname.startsWith("app.") || hostname.startsWith("painel.") || hostname.startsWith("admin.") || hostname.startsWith("zetachatia.")) {
    return `https://${hostname}`;
  }
  
  return `https://app.${hostname}`;
};

export default function PublicSite({ config, onBackToAdmin }: PublicSiteProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [activePost, setActivePost] = useState<BlogPost | null>(null);

  // Interactive repair estimator states
  const [estCategory, setEstCategory] = useState<'iphone' | 'android' | 'notebook' | 'other'>('iphone');
  const [estModel, setEstModel] = useState<string>("");
  const [estService, setEstService] = useState<string>("");
  const [estimatorTab, setEstimatorTab] = useState<'simulador' | 'diagnostico'>('simulador');
  const [diagBrand, setDiagBrand] = useState<string>("Apple (iPhone)");
  const [diagIssue, setDiagIssue] = useState<string>("Tela quebrada ou riscada");

  // Filter models based on selected category in the pricing estimator
  const availableModels = Array.from(
    new Set(
      (config.pricingTable || [])
        .filter(p => p.category === estCategory)
        .map(p => p.deviceModel)
    )
  );

  // Filter services based on category AND model in the pricing estimator
  const availableServices = (config.pricingTable || [])
    .filter(p => p.category === estCategory && p.deviceModel === estModel);

  // Auto-initialize first model and service when category or table changes
  useEffect(() => {
    const defaultModels = Array.from(
      new Set(
        (config.pricingTable || [])
          .filter(p => p.category === estCategory)
          .map(p => p.deviceModel)
      )
    );
    if (defaultModels.length > 0) {
      if (!defaultModels.includes(estModel)) {
        setEstModel(defaultModels[0]);
      }
    } else {
      setEstModel("");
    }
  }, [estCategory, config.pricingTable]);

  useEffect(() => {
    const services = (config.pricingTable || [])
      .filter(p => p.category === estCategory && p.deviceModel === estModel);
    if (services.length > 0) {
      if (!services.some(s => s.serviceName === estService)) {
        setEstService(services[0].serviceName);
      }
    } else {
      setEstService("");
    }
  }, [estModel, estCategory, config.pricingTable]);

  const selectedPricingItem = (config.pricingTable || []).find(
    p => p.category === estCategory && p.deviceModel === estModel && p.serviceName === estService
  );

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      const isCustomDomain = !window.location.hostname.includes("ais-dev") && 
                             !window.location.hostname.includes("ais-pre") && 
                             window.location.hostname !== "localhost" && 
                             window.location.hostname !== "127.0.0.1";

      if (isCustomDomain) {
        console.log("Loading posts directly from Firestore client-side...");
        const postsCol = collection(db, "posts");
        const snapshot = await getDocs(postsCol);
        const fetchedPosts: BlogPost[] = [];
        snapshot.forEach((doc) => {
          fetchedPosts.push(doc.data() as BlogPost);
        });
        // Sort posts by date or id descending to keep most recent first
        const sorted = fetchedPosts.sort((a, b) => {
          const dateA = a.publishedAt || "";
          const dateB = b.publishedAt || "";
          if (dateA !== dateB) {
            return dateB.localeCompare(dateA); // newest date first
          }
          return (b.id || "").localeCompare(a.id || ""); // fallback to ID sorting
        });
        setPosts(sorted);
        localStorage.setItem("and_microcell_posts", JSON.stringify(sorted));
      } else {
        const res = await fetch(getApiUrl(`/api/posts?t=${Date.now()}`));
        if (res.ok) {
          const data = await res.json();
          setPosts(data);
          localStorage.setItem("and_microcell_posts", JSON.stringify(data));
        } else {
          throw new Error("Server returned non-ok status");
        }
      }
    } catch (err) {
      console.warn("Error fetching posts, falling back to local storage or static posts list:", err);
      const saved = localStorage.getItem("and_microcell_posts");
      if (saved) {
        try {
          setPosts(JSON.parse(saved));
        } catch (e) {
          setPosts(staticPosts as BlogPost[]);
        }
      } else {
        setPosts(staticPosts as BlogPost[]);
      }
    } finally {
      setLoading(false);
    }
  };

  const incrementPostViews = async (postId: string) => {
    try {
      // Quietly try to hit the backend view count endpoint
      fetch(getApiUrl(`/api/posts/${postId}/view`), { method: "POST" }).catch(() => {});
      
      // Always increment in local state so the view increases immediately on screen
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, views: (p.views || 0) + 1 } : p));
    } catch (e) {
      console.debug("Post view increment server request skipped/failed:", e);
    }
  };

  const handlePostClick = (post: BlogPost) => {
    setActivePost(post);
    incrementPostViews(post.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToList = () => {
    setActivePost(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Filter posts
  const categories = ["Todas", ...Array.from(new Set(posts.map(p => p.category)))];
  
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Todas" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getWhatsAppLink = (message = "Olá, vim através do blog de vocês e gostaria de fazer um orçamento!") => {
    const cleanPhone = config.phone.replace(/[^0-9]/g, "");
    const waPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    return `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;
  };

  // Simple parser to render basic markdown-like content (paragraphs, headers, bullet points)
  const renderContent = (text: string) => {
    return text.split("\n\n").map((paragraph, index) => {
      const trimmed = paragraph.trim();
      if (trimmed.startsWith("### ")) {
        return (
          <h3 key={index} className="text-xl font-bold text-slate-900 tracking-tight mt-6 mb-3">
            {trimmed.replace("### ", "")}
          </h3>
        );
      } else if (trimmed.startsWith("## ")) {
        return (
          <h2 key={index} className="text-2xl font-bold text-slate-900 tracking-tight mt-8 mb-4">
            {trimmed.replace("## ", "")}
          </h2>
        );
      } else if (trimmed.startsWith("- ")) {
        const items = trimmed.split("\n").map(li => li.replace("- ", ""));
        return (
          <ul key={index} className="list-disc list-inside space-y-2 text-slate-600 pl-4 my-4">
            {items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        );
      } else if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
        return (
          <p key={index} className="font-bold text-slate-900 my-3">
            {trimmed.replace(/\*\*/g, "")}
          </p>
        );
      }
      
      // Inline bold replacing (simple regex fallback)
      let renderedParagraph = paragraph;
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      
      while ((match = boldRegex.exec(paragraph)) !== null) {
        // Add preceding text
        if (match.index > lastIndex) {
          parts.push(paragraph.substring(lastIndex, match.index));
        }
        // Add bold text
        parts.push(<strong key={match.index} className="font-semibold text-slate-900">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      
      if (lastIndex < paragraph.length) {
        parts.push(paragraph.substring(lastIndex));
      }

      return (
        <p key={index} className="text-slate-600 leading-relaxed text-[15px] mb-4">
          {parts.length > 0 ? parts : paragraph}
        </p>
      );
    });
  };

  const getDiagnosticAdvice = () => {
    let title = "Recomendação Técnica Geral";
    let desc = "Traga seu aparelho para uma avaliação gratuita de até 2 horas. Nossos técnicos certificados analisarão todos os componentes.";
    let urgency = "Recomendação Técnica";

    if (diagIssue === "Tela quebrada ou riscada") {
      title = "Substituição de Tela Premium";
      urgency = "Manutenção Express";
      if (diagBrand.includes("Apple") || diagBrand.includes("iPhone")) {
        desc = "As telas de iPhone exigem cuidado especial. Realizamos a troca utilizando displays premium de alta definição (OLED/Super Retina) e fazemos a gravação do chip original para manter o recurso True Tone 100% ativo. Seu Face ID e sensibilidade ao toque continuarão perfeitos!";
      } else {
        desc = "Substituímos o display do seu aparelho por componentes premium com fidelidade máxima de cores, brilho intenso e excelente resposta ao toque. O processo é rápido, seguro e inclui garantia total contra defeitos.";
      }
    } else if (diagIssue === "Bateria viciada ou não carrega") {
      title = "Substituição da Bateria de Alta Performance";
      urgency = "Manutenção Express";
      if (diagBrand.includes("Apple") || diagBrand.includes("iPhone")) {
        desc = "Substituímos a bateria por células de alta qualidade com selo de segurança. Oferecemos o serviço opcional de transplante do chip BMS original para evitar mensagens chatas de 'peça desconhecida' e manter a exibição da saúde da bateria em 100%!";
      } else {
        desc = "Instalamos baterias de alta densidade de carga com certificações rigorosas de segurança. Recupere a autonomia original do seu aparelho para passar o dia inteiro longe das tomadas com segurança absoluta.";
      }
    } else if (diagIssue === "Caiu na água (Contato com líquido)") {
      title = "Desoxidação Química Imediata";
      urgency = "Alerta Urgente";
      desc = "⚠️ ATENÇÃO: Aparelhos molhados sofrem corrosão interna imediata nos microcomponentes da placa. Não ligue o aparelho nem o coloque no arroz! O procedimento correto é a abertura imediata e desoxidação química profissional em cuba ultrassônica com álcool isopropílico. Corra contra o tempo!";
    } else if (diagIssue === "Não liga ou trava na logo (Loop infinito)") {
      title = "Análise Avançada de Placa ou Software";
      urgency = "Recomendação Técnica";
      desc = "Se o aparelho não liga ou trava no logotipo, pode ser um curto-circuito na placa, falha no sistema operacional ou falha de componentes periféricos (como câmeras ou sensores). Realizamos análise detalhada via osciloscópio, fonte de bancada e termografia gratuita para encontrar a raiz exata do problema.";
    } else if (diagIssue === "Problema no conector de carga ou botões") {
      title = "Reparo / Troca de Conector de Carga ou Flex";
      urgency = "Manutenção Express";
      desc = "Dificuldade para carregar, cabo folgado ou botões que não respondem? Substituímos o conector USB-C / Lightning ou flex de botões utilizando ferramentas de alta precisão. Devolvemos o seu aparelho carregando rápido e funcionando perfeitamente.";
    } else if (diagIssue === "Câmera embaçada ou sem foco") {
      title = "Limpeza Interna de Lente ou Troca do Módulo";
      urgency = "Manutenção Express";
      desc = "Fotos borradas, foco instável ou câmera tremendo? Muitas vezes, uma limpeza interna profissional na lente resolve. Se o estabilizador óptico de imagem estiver danificado, realizamos a troca completa do módulo de câmera original para você voltar a registrar momentos perfeitos.";
    }

    return { title, desc, urgency };
  };

  return (
    <div className="bg-slate-50 text-slate-800 antialiased min-h-screen flex flex-col font-sans" id="public-site-container">
      {/* Demo Top Alert bar to switch back to Admin */}
      {onBackToAdmin && (
        <div className="bg-slate-900 text-slate-100 text-xs py-2 px-4 flex items-center justify-between border-b border-slate-950 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Visualização de Cliente Ativa • Este é o mini-site que os seus clientes vão ver!</span>
          </div>
          <button 
            onClick={onBackToAdmin}
            className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 transition-colors cursor-pointer text-white font-semibold text-[11px] flex items-center gap-1.5"
            id="btn-return-admin"
          >
            <span>Retornar ao Painel Admin</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Main Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-neutral-100 py-4 sticky top-0 z-20" id="public-site-header">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between gap-4">
          <div 
            className="flex items-center gap-3.5 group cursor-pointer" 
            onClick={() => setActivePost(null)}
            title="Ir para o início"
          >
            <div className="h-12 flex items-center justify-center transition-all duration-300 shrink-0">
              <img 
                src={logoUrl} 
                alt="AndMicrocell Logo" 
                className="h-11 w-auto object-contain" 
                referrerPolicy="no-referrer" 
              />
            </div>
            <div>
              <h1 className="font-bold text-neutral-900 tracking-tight text-base sm:text-lg leading-tight transition-colors duration-300">
                {config.name}
              </h1>
              <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider leading-none mt-0.5">{config.category}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <a 
              href={getWhatsAppLink()} 
              target="_blank" 
              rel="noreferrer"
              className="px-5 py-2 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs tracking-wide transition-all active:scale-95 flex items-center gap-2"
              id="header-wa-btn"
            >
              <Phone className="w-3 h-3 fill-white" />
              <span>Orçamento Grátis</span>
            </a>
          </div>
        </div>
      </header>

      {/* Content wrapper */}
      <div className="flex-grow">
        {/* If viewing article detail */}
        {activePost ? (
          <main className="max-w-3xl mx-auto px-4 py-8 sm:py-12" id="public-post-detail">
            {/* Back Button */}
            <button 
              onClick={handleBackToList}
              className="flex items-center gap-2 text-slate-500 hover:text-amber-600 font-semibold text-sm mb-6 transition-colors group cursor-pointer"
              id="btn-back-to-list"
            >
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>Voltar para Dicas e Notícias</span>
            </button>

            <article className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden" id="active-article">
              {/* Cover Image */}
              <div className="h-64 sm:h-96 w-full relative">
                <img 
                  src={activePost.coverImage} 
                  alt={activePost.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1.5 rounded-full bg-amber-600 text-white text-xs font-bold shadow">
                    {activePost.category}
                  </span>
                </div>
              </div>

              {/* Main Info */}
              <div className="p-6 sm:p-10 space-y-6">
                <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {activePost.publishedAt.split("-").reverse().join("/")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {activePost.readTime} de leitura
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {activePost.views} visualizações
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  {activePost.title}
                </h1>

                <p className="text-slate-500 text-base sm:text-lg leading-relaxed italic border-l-4 border-amber-500 pl-4">
                  {activePost.excerpt}
                </p>

                {/* Body Content */}
                <div className="prose prose-amber max-w-none border-t border-slate-100 pt-6">
                  {renderContent(activePost.content)}
                </div>
              </div>
            </article>

            {/* CTA Box at bottom of article */}
            <div className="mt-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-950 to-slate-900 text-white shadow-xl border border-amber-950 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold font-mono uppercase tracking-wider">
                  Precisa de Ajuda?
                </span>
                <h4 className="text-lg sm:text-xl font-bold tracking-tight">Conserte seu celular na {config.name}</h4>
                <p className="text-xs text-slate-300 max-w-md leading-relaxed">
                  Realizamos orçamento 100% gratuito e sem compromisso para troca de tela, bateria, placa e muito mais! Retiramos e entregamos.
                </p>
              </div>
              <a 
                href={getWhatsAppLink(`Olá, gostei do artigo "${activePost.title}" e gostaria de fazer um orçamento de conserto!`)}
                target="_blank" 
                rel="noreferrer"
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all hover:scale-105 shadow-lg shadow-emerald-600/10 shrink-0 flex items-center gap-2 cursor-pointer"
                id="btn-cta-whatsapp-post"
              >
                <Phone className="w-4 h-4 fill-white" />
                <span>Iniciar Orçamento Grátis</span>
              </a>
            </div>
          </main>
        ) : (
          /* Main Landing Page + Blog Grid */
          <div id="public-landing-grid" className="relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-10 left-1/10 w-80 h-80 bg-amber-200/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute top-40 right-1/10 w-80 h-80 bg-orange-200/15 rounded-full blur-3xl pointer-events-none"></div>
            
            {/* Hero Section */}
            <section className="bg-white border-b border-neutral-100 py-20 relative">
              <div className="max-w-4xl mx-auto px-6 text-center space-y-8 relative z-10">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-50 border border-neutral-200/50 text-[11px] font-bold tracking-wide text-neutral-800 uppercase font-mono shadow-2xs animate-fade-in">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <span>{config.specialOffers || "Orçamento 100% gratuito e sem compromisso!"}</span>
                </div>
                
                <div className="space-y-4">
                  <h2 className="text-4xl sm:text-6xl font-black text-neutral-900 tracking-tight leading-[1.08] max-w-3xl mx-auto">
                    AndMicrocell.<br className="hidden sm:inline" />
                    <span className="text-neutral-400 font-normal">Seu smartphone novo de novo.</span>
                  </h2>
                  <p className="text-neutral-500 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-medium">
                    Especialistas em manutenção avançada das marcas mais renomadas do mercado. Reparos com alto rigor técnico, rapidez certificada e até 360 dias de garantia completa.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4 max-w-md mx-auto">
                  <a 
                    href={getWhatsAppLink()} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Phone className="w-3.5 h-3.5 fill-white" />
                    <span>Iniciar Orçamento Grátis</span>
                  </a>
                  <a 
                    href="#repair-estimator-section" 
                    className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white hover:bg-neutral-50 text-neutral-700 font-bold text-xs tracking-wide transition-all border border-neutral-200 flex items-center justify-center gap-2 shadow-2xs"
                  >
                    <Wrench className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Simular Valores & Serviços</span>
                  </a>
                </div>

                {/* Highly Refined Feature Grid (Apple Style: No side borders, flat layout, ample breathing room) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-16 border-t border-neutral-100 max-w-3xl mx-auto" id="hero-features">
                  <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-2">
                    <div className="w-9 h-9 rounded-full bg-neutral-50 text-neutral-900 flex items-center justify-center border border-neutral-200/50">
                      <Wrench className="w-4 h-4 text-neutral-700" />
                    </div>
                    <h4 className="font-bold text-neutral-900 text-xs sm:text-sm">Orçamento Grátis</h4>
                    <p className="text-neutral-400 text-xs leading-relaxed max-w-xs font-medium">Avaliação completa sem qualquer taxa ou compromisso.</p>
                  </div>

                  <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-2">
                    <div className="w-9 h-9 rounded-full bg-neutral-50 text-neutral-900 flex items-center justify-center border border-neutral-200/50">
                      <ShieldCheck className="w-4 h-4 text-neutral-700" />
                    </div>
                    <h4 className="font-bold text-neutral-900 text-xs sm:text-sm">Garantia Estendida</h4>
                    <p className="text-neutral-400 text-xs leading-relaxed max-w-xs font-medium">De 90 a 360 dias com selo de suporte pós-reparo.</p>
                  </div>

                  <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-2">
                    <div className="w-9 h-9 rounded-full bg-neutral-50 text-neutral-900 flex items-center justify-center border border-neutral-200/50">
                      <Award className="w-4 h-4 text-neutral-700" />
                    </div>
                    <h4 className="font-bold text-neutral-900 text-xs sm:text-sm">Componentes Premium</h4>
                    <p className="text-neutral-400 text-xs leading-relaxed max-w-xs font-medium">Trabalhamos com telas e baterias de altíssima durabilidade.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Interactive Cost Estimator & Diagnostic Funnel Section */}
            <section className="bg-neutral-50/50 py-20 border-b border-neutral-100" id="repair-estimator-section">
              <div className="max-w-5xl mx-auto px-6">
                {/* Section Header */}
                <div className="text-center space-y-3 max-w-xl mx-auto mb-12">
                  <span className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-200/50 text-[10px] font-bold uppercase tracking-wider font-mono">
                    Ferramenta de Simulação
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight leading-tight">
                    Simulador & Diagnóstico Online
                  </h3>
                  <p className="text-neutral-500 text-xs sm:text-sm font-medium leading-relaxed">
                    Escolha entre simular o valor estimado do conserto ou rodar um diagnóstico rápido do sintoma do seu aparelho!
                  </p>
                </div>

                {/* Tab selector for Sales Funnel */}
                <div className="flex justify-center mb-10">
                  <div className="inline-flex rounded-full bg-neutral-100 p-1 border border-neutral-250/30">
                    <button
                      type="button"
                      onClick={() => setEstimatorTab('simulador')}
                      className={`px-6 py-2 rounded-full text-xs font-bold tracking-wide transition-all cursor-pointer ${
                        estimatorTab === 'simulador'
                          ? 'bg-neutral-900 text-white shadow-sm'
                          : 'text-neutral-500 hover:text-neutral-900'
                      }`}
                    >
                      Simulador de Preços
                    </button>
                    <button
                      type="button"
                      onClick={() => setEstimatorTab('diagnostico')}
                      className={`px-6 py-2 rounded-full text-xs font-bold tracking-wide transition-all cursor-pointer ${
                        estimatorTab === 'diagnostico'
                          ? 'bg-neutral-900 text-white shadow-sm'
                          : 'text-neutral-500 hover:text-neutral-900'
                      }`}
                    >
                      Diagnóstico Inteligente
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-neutral-150 shadow-2xs p-6 sm:p-10">
                  {estimatorTab === 'simulador' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start animate-fade-in">
                      {/* Stepper Form */}
                      <div className="lg:col-span-7 space-y-8">
                        {/* Step 1: Category selection */}
                        <div className="space-y-3">
                          <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block font-mono">
                            1. Tipo de Aparelho
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                              { id: 'iphone', label: 'iPhone', icon: Smartphone },
                              { id: 'android', label: 'Android', icon: Smartphone },
                              { id: 'notebook', label: 'Notebook', icon: Laptop },
                              { id: 'other', label: 'Outros', icon: Wrench }
                            ].map((catOpt) => {
                              const IconComp = catOpt.icon;
                              const isSel = estCategory === catOpt.id;
                              return (
                                <button
                                  key={catOpt.id}
                                  type="button"
                                  onClick={() => {
                                    setEstCategory(catOpt.id as any);
                                  }}
                                  className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 text-center cursor-pointer ${
                                    isSel
                                      ? 'border-neutral-950 bg-neutral-950 text-white shadow-sm'
                                      : 'border-neutral-200 hover:border-neutral-300 text-neutral-500 hover:text-neutral-800 bg-white'
                                  }`}
                                >
                                  <IconComp className={`w-4 h-4 ${isSel ? 'text-white' : 'text-neutral-400'}`} />
                                  <span className="text-xs font-bold tracking-tight">{catOpt.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Step 2: Model selection */}
                        <div className="space-y-3">
                          <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block font-mono">
                            2. Selecione o Modelo
                          </label>
                          {availableModels.length === 0 ? (
                            <p className="text-xs text-neutral-400 italic">Nenhum modelo cadastrado para esta categoria.</p>
                          ) : (
                            <select
                              value={estModel}
                              onChange={(e) => setEstModel(e.target.value)}
                              className="w-full p-3.5 rounded-xl border border-neutral-200 bg-white text-neutral-800 text-xs focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all font-semibold cursor-pointer"
                            >
                              {availableModels.map(modelName => (
                                <option key={modelName} value={modelName}>{modelName}</option>
                              ))}
                            </select>
                          )}
                        </div>

                        {/* Step 3: Service selection */}
                        <div className="space-y-3">
                          <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block font-mono">
                            3. Escolha o Conserto / Serviço
                          </label>
                          {availableServices.length === 0 ? (
                            <p className="text-xs text-neutral-400 italic">Nenhum serviço cadastrado para este modelo.</p>
                          ) : (
                            <select
                              value={estService}
                              onChange={(e) => setEstService(e.target.value)}
                              className="w-full p-3.5 rounded-xl border border-neutral-200 bg-white text-neutral-800 text-xs focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all font-semibold cursor-pointer"
                            >
                              {availableServices.map(srv => (
                                <option key={srv.id} value={srv.serviceName}>{srv.serviceName}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>

                      {/* Estimation Card Display */}
                      <div className="lg:col-span-5 h-full">
                        <div className="p-6 rounded-2xl bg-neutral-950 text-white flex flex-col justify-between h-full min-h-[320px] shadow-sm relative overflow-hidden">
                          {/* Absolute accent inside the dark card */}
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
                          
                          <div className="space-y-6 relative z-10">
                            <div className="flex items-center gap-2">
                              <Wrench className="w-4 h-4 text-emerald-400 animate-pulse" />
                              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 font-mono">Orçamento Estimado</span>
                            </div>

                            {selectedPricingItem ? (
                              <div className="space-y-4">
                                <div className="border-b border-white/10 pb-3">
                                  <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-mono">Aparelho Selecionado</p>
                                  <h4 className="text-sm font-extrabold text-white mt-0.5">{selectedPricingItem.deviceModel}</h4>
                                </div>

                                <div className="border-b border-white/10 pb-3">
                                  <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-mono">Serviço Escolhido</p>
                                  <p className="text-xs text-neutral-200 mt-0.5 font-bold">{selectedPricingItem.serviceName}</p>
                                </div>

                                <div>
                                  <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-mono">Custo Estimado do Conserto</p>
                                  <p className="text-3xl font-black text-emerald-400 tracking-tight mt-1">
                                    {selectedPricingItem.priceEstimate}
                                  </p>
                                </div>

                                {selectedPricingItem.notes && (
                                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-neutral-300 leading-relaxed font-medium">
                                    <span className="font-bold text-amber-400 block mb-0.5">Observações Técnicas:</span>
                                    {selectedPricingItem.notes}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-4 py-8 text-center">
                                <Smartphone className="w-8 h-8 text-neutral-700 mx-auto" />
                                <p className="text-xs text-neutral-400 font-medium leading-relaxed max-w-xs mx-auto">
                                  Não encontrou seu modelo específico ou reparo na lista? Sem problemas! Nós consertamos quase qualquer aparelho.
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="pt-6 border-t border-white/10 mt-6 shrink-0 font-medium relative z-10">
                            <a
                              href={getWhatsAppLink(
                                selectedPricingItem
                                  ? `Olá! Gostaria de agendar o conserto do meu ${selectedPricingItem.deviceModel} (${selectedPricingItem.serviceName}) pelo valor estimado de ${selectedPricingItem.priceEstimate}.`
                                  : `Olá! Gostaria de solicitar um orçamento personalizado para o meu aparelho que não encontrei na lista do site.`
                              )}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
                            >
                              <Phone className="w-4 h-4 fill-white" />
                              <span>Aprovar & Agendar Reparo</span>
                            </a>
                            <p className="text-[10px] text-neutral-500 text-center mt-3 leading-relaxed font-medium">
                              O orçamento final é confirmado presencialmente de forma gratuita antes de qualquer execução.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start animate-fade-in">
                      {/* Brand & Issue Selectors */}
                      <div className="lg:col-span-7 space-y-8">
                        {/* Brand Select */}
                        <div className="space-y-3">
                          <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block font-mono">
                            1. Qual a marca do seu aparelho?
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            {["Apple (iPhone)", "Samsung", "Motorola", "Xiaomi", "Outra Marca"].map((brand) => {
                              const isSel = diagBrand === brand;
                              return (
                                <button
                                  key={brand}
                                  type="button"
                                  onClick={() => setDiagBrand(brand)}
                                  className={`p-3.5 rounded-xl border text-xs font-bold tracking-tight transition-all text-center cursor-pointer ${
                                    isSel
                                      ? "border-neutral-950 bg-neutral-950 text-white font-bold"
                                      : "border-neutral-200 hover:border-neutral-300 text-neutral-500 bg-white"
                                  }`}
                                >
                                  {brand}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Issue Select */}
                        <div className="space-y-3">
                          <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block font-mono">
                            2. Qual é o principal problema/sintoma?
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {[
                              "Tela quebrada ou riscada",
                              "Bateria viciada ou não carrega",
                              "Caiu na água (Contato com líquido)",
                              "Não liga ou trava na logo (Loop infinito)",
                              "Problema no conector de carga ou botões",
                              "Câmera embaçada ou sem foco"
                            ].map((issue) => {
                              const isSel = diagIssue === issue;
                              return (
                                <button
                                  key={issue}
                                  type="button"
                                  onClick={() => setDiagIssue(issue)}
                                  className={`p-3.5 rounded-xl border text-left text-xs font-bold tracking-tight transition-all cursor-pointer flex items-center justify-between ${
                                    isSel
                                      ? "border-neutral-950 bg-neutral-950 text-white font-bold"
                                      : "border-neutral-200 hover:border-neutral-300 text-neutral-500 bg-white"
                                  }`}
                                >
                                  <span>{issue}</span>
                                  {isSel && <div className="w-2 h-2 rounded-full bg-emerald-400"></div>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Diagnostic Advice Display */}
                      <div className="lg:col-span-5 h-full">
                        <div className="p-6 rounded-2xl bg-neutral-950 text-white flex flex-col justify-between h-full min-h-[350px] shadow-sm relative overflow-hidden">
                          {/* Absolute accent inside the dark card */}
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

                          <div className="space-y-5 relative z-10">
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider font-mono ${
                                getDiagnosticAdvice().urgency === "Alerta Urgente"
                                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                  : getDiagnosticAdvice().urgency === "Manutenção Express"
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              }`}>
                                {getDiagnosticAdvice().urgency}
                              </span>
                              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 font-mono">Diagnóstico Virtual</span>
                            </div>

                            <div className="space-y-3">
                              <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-mono">Análise Prévia do {diagBrand}</p>
                              <h4 className="text-base font-extrabold text-white leading-tight">
                                {getDiagnosticAdvice().title}
                              </h4>
                              <p className="text-xs text-neutral-300 leading-relaxed font-medium pt-1">
                                {getDiagnosticAdvice().desc}
                              </p>
                            </div>
                          </div>

                          <div className="pt-6 border-t border-white/10 mt-6 shrink-0 font-medium relative z-10">
                            <a
                              href={getWhatsAppLink(
                                `Olá! Usei o Diagnóstico Rápido no site para o meu ${diagBrand} com o sintoma: "${diagIssue}". Gostaria de agendar uma avaliação gratuita sem compromisso!`
                              )}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
                            >
                              <Phone className="w-4 h-4 fill-white" />
                              <span>Solicitar Avaliação Grátis</span>
                            </a>
                            <p className="text-[10px] text-neutral-500 text-center mt-3 leading-relaxed font-medium">
                              Nossos orçamentos presenciais em Caruaru são 100% gratuitos e levam até 2 horas.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Sales Funnel: How it works section */}
            <section className="bg-white py-20 border-b border-neutral-100" id="how-it-works-section">
              <div className="max-w-5xl mx-auto px-6 space-y-16">
                {/* Section Header */}
                <div className="text-center space-y-3 max-w-2xl mx-auto">
                  <span className="text-[10px] font-bold text-neutral-800 uppercase tracking-widest font-mono bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200/50">Atendimento</span>
                  <h2 className="text-2xl sm:text-4xl font-black text-neutral-900 tracking-tight leading-tight">Como funciona o nosso conserto</h2>
                  <p className="text-neutral-500 text-xs sm:text-sm font-medium leading-relaxed">
                    Nossa assistência é projetada com alto rigor operacional para garantir rapidez, total segurança e conveniência do início ao fim.
                  </p>
                </div>

                {/* Steps Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  {[
                    {
                      step: "01",
                      title: "Agendamento",
                      badge: "WhatsApp",
                      desc: "Consulte nosso simulador ou mande uma mensagem. Agendamos a entrega presencial ou acionamos o sistema Leva e Traz."
                    },
                    {
                      step: "02",
                      title: "Laudo Gratuito",
                      badge: "Em até 2 horas",
                      desc: "Técnicos seniores realizam a perícia minuciosa do aparelho sem cobrar taxa de diagnóstico ou orçamento."
                    },
                    {
                      step: "03",
                      title: "Reparo de Elite",
                      badge: "Peças Premium",
                      desc: "Consertamos o dispositivo no mesmo dia usando componentes rigorosamente testados de máxima durabilidade."
                    },
                    {
                      step: "04",
                      title: "Entrega Certificada",
                      badge: "Até 360 Dias",
                      desc: "Você recebe o celular totalmente limpo, testado com checklist rigoroso e termo de garantia estendida."
                    }
                  ].map((item, idx) => (
                    <div 
                      key={idx} 
                      className="flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-4">
                        <div className="flex items-end justify-between border-b border-neutral-100 pb-3">
                          <span className="text-4xl font-black text-neutral-200 font-mono leading-none">{item.step}</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-neutral-50 border border-neutral-200/50 text-[9px] font-bold tracking-wider uppercase text-neutral-600">
                            {item.badge}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-bold text-neutral-900 text-sm sm:text-base tracking-tight">{item.title}</h4>
                          <p className="text-neutral-400 text-xs leading-relaxed font-medium">{item.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Blog & News Section */}
            <section className="bg-neutral-50/30 py-20 border-b border-neutral-100" id="blog-section">
              <div className="max-w-5xl mx-auto px-6 space-y-10">
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-neutral-800 uppercase tracking-wider font-mono bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200/50">Conteúdo</span>
                    <h2 className="text-2xl sm:text-3.5xl font-black text-neutral-900 tracking-tight leading-none pt-1">Dicas & Novidades</h2>
                    <p className="text-neutral-500 text-xs sm:text-sm font-medium leading-relaxed max-w-lg">
                      Orientações técnicas exclusivas elaboradas por especialistas para aumentar a vida útil dos seus aparelhos.
                    </p>
                  </div>

                  {/* Search bar */}
                  <div className="relative w-full sm:w-72 shrink-0">
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      placeholder="Buscar artigos..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white border border-neutral-200 text-xs focus:outline-none focus:border-neutral-900 text-neutral-800 font-medium placeholder-neutral-400 transition-all shadow-3xs"
                    />
                  </div>
                </div>

                {/* Category filters */}
                <div className="flex flex-wrap items-center gap-1.5 border-b border-neutral-100 pb-5">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4.5 py-1.5 rounded-full text-xs font-bold tracking-tight transition-all cursor-pointer ${
                        selectedCategory === cat 
                          ? "bg-neutral-900 text-white shadow-2xs" 
                          : "bg-white border border-neutral-200 hover:border-neutral-300 text-neutral-600"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Grid List */}
                {loading ? (
                  <div className="text-center py-20 text-neutral-400 space-y-3">
                    <div className="w-6 h-6 rounded-full border-2 border-neutral-900 border-t-transparent animate-spin mx-auto"></div>
                    <p className="text-xs font-semibold">Buscando dicas exclusivas para você...</p>
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div className="text-center py-20 rounded-2xl bg-white border border-neutral-150">
                    <p className="text-neutral-400 text-xs font-bold">Nenhum artigo encontrado para a pesquisa.</p>
                    <button 
                      onClick={() => { setSearchQuery(""); setSelectedCategory("Todas"); }}
                      className="mt-3 text-neutral-900 hover:underline text-xs font-bold cursor-pointer"
                    >
                      Limpar Filtros e Mostrar Todos
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredPosts.map((post) => (
                      <article 
                        key={post.id} 
                        className="bg-white rounded-2xl border border-neutral-150 overflow-hidden flex flex-col hover:shadow-2xs transition-all group cursor-pointer"
                      >
                        {/* Image wrapper */}
                        <div className="h-48 w-full overflow-hidden relative" onClick={() => handlePostClick(post)}>
                          <img 
                            src={post.coverImage} 
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                          />
                          <div className="absolute top-3 left-3">
                            <span className="px-2.5 py-1 rounded-full bg-neutral-950/80 backdrop-blur-md text-white text-[9px] font-bold tracking-wider uppercase font-mono">
                              {post.category}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <span className="text-[10px] font-mono font-bold text-neutral-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {post.publishedAt.split("-").reverse().join("/")}
                              <span className="text-neutral-300">•</span>
                              <Clock className="w-3 h-3" />
                              {post.readTime}
                            </span>
                            
                            <h4 
                              onClick={() => handlePostClick(post)}
                              className="font-bold text-neutral-900 text-sm sm:text-base leading-snug hover:text-neutral-500 transition-colors line-clamp-2"
                            >
                              {post.title}
                            </h4>

                            <p className="text-xs text-neutral-400 leading-relaxed font-medium line-clamp-2">
                              {post.excerpt}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                            <button 
                              onClick={() => handlePostClick(post)}
                              className="text-neutral-900 hover:text-neutral-700 font-bold text-xs flex items-center gap-1 group/btn"
                            >
                              <span>Ler Artigo</span>
                              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                            </button>
                            
                            <span className="text-[10px] font-medium text-neutral-400 flex items-center gap-1 font-mono">
                              <Eye className="w-3 h-3" />
                              {post.views || 0}
                            </span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Testimonials (Depoimentos) Section */}
            <section className="bg-white py-20 border-b border-neutral-100 relative overflow-hidden" id="public-testimonials-section">
              <div className="max-w-5xl mx-auto px-6 space-y-16 relative z-10">
                {/* Section Header */}
                <div className="text-center space-y-3 max-w-2xl mx-auto">
                  <span className="text-[10px] font-bold text-neutral-800 uppercase tracking-widest font-mono bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200/50">Avaliações</span>
                  <h2 className="text-2xl sm:text-4xl font-black text-neutral-900 tracking-tight leading-tight">O que dizem nossos clientes</h2>
                  <p className="text-neutral-500 text-xs sm:text-sm font-medium leading-relaxed">
                    A excelência em assistência técnica atestada por quem confia em nosso serviço.
                  </p>
                </div>

                {/* Grid List */}
                {!config.testimonials || config.testimonials.length === 0 ? (
                  <div className="text-center py-10 text-neutral-400 text-xs">
                    Nenhum depoimento cadastrado no momento.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {config.testimonials.map((t) => (
                      <div 
                        key={t.id} 
                        className="bg-neutral-50/50 p-6 rounded-2xl border border-neutral-150 transition-all flex flex-col justify-between"
                        id={`public-testimonial-${t.id}`}
                      >
                        <div className="space-y-4">
                          {/* Stars */}
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-3.5 h-3.5 ${i < (t.rating || 5) ? "text-amber-400 fill-amber-400" : "text-neutral-200"}`} 
                              />
                            ))}
                          </div>

                          {/* Testimonial text */}
                          <p className="text-neutral-600 text-xs sm:text-sm leading-relaxed italic font-medium">
                            "{t.text}"
                          </p>
                        </div>

                        {/* Customer profile */}
                        <div className="flex items-center gap-3 pt-5 mt-5 border-t border-neutral-200/50">
                          <div className="w-9 h-9 rounded-full bg-neutral-900 text-white font-extrabold text-xs tracking-wider flex items-center justify-center font-mono shrink-0">
                            {t.avatar || (t.name ? t.name.split(" ").map(n => n[0]).join("").substring(0,2).toUpperCase() : "C")}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-neutral-900 text-xs sm:text-sm truncate">{t.name}</h4>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-neutral-400 font-bold uppercase tracking-wider">
                              <span className="truncate">{t.role || "Cliente"}</span>
                              <span>•</span>
                              <span className="shrink-0 font-mono">{t.date || "Recente"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Stats badge to reinforce credibility */}
                <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 pt-8 border-t border-neutral-100 max-w-3xl mx-auto" id="credibility-stats">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-50 text-neutral-900 flex items-center justify-center shrink-0 border border-neutral-200/50">
                      <Star className="w-4 h-4 fill-neutral-800 text-neutral-800" />
                    </div>
                    <div>
                      <p className="font-bold text-neutral-900 text-sm leading-none">4.9 / 5.0</p>
                      <p className="text-[10px] text-neutral-400 font-bold mt-1">Média de satisfação geral</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-50 text-neutral-900 flex items-center justify-center shrink-0 border border-neutral-200/50">
                      <ThumbsUp className="w-4 h-4 text-neutral-800 fill-neutral-800/10" />
                    </div>
                    <div>
                      <p className="font-bold text-neutral-900 text-sm leading-none">100%</p>
                      <p className="text-[10px] text-neutral-400 font-bold mt-1">Garantia pós-reparo</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-50 text-neutral-900 flex items-center justify-center shrink-0 border border-neutral-200/50">
                      <MessageSquare className="w-4 h-4 text-neutral-800 fill-neutral-800/10" />
                    </div>
                    <div>
                      <p className="font-bold text-neutral-900 text-sm leading-none">Suporte Real</p>
                      <p className="text-[10px] text-neutral-400 font-bold mt-1">Via WhatsApp 24h/7</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Dedicated FAQ Section */}
            <section className="bg-neutral-50/50 py-20 border-b border-neutral-100" id="faq-section">
              <div className="max-w-3xl mx-auto px-6 space-y-12">
                <div className="text-center space-y-3 max-w-xl mx-auto">
                  <span className="text-[10px] font-bold text-neutral-800 uppercase tracking-wider font-mono bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200/50">FAQ</span>
                  <h2 className="text-2xl sm:text-3.5xl font-black text-neutral-900 tracking-tight leading-tight">Perguntas Frequentes</h2>
                  <p className="text-neutral-500 text-xs sm:text-sm font-medium leading-relaxed">
                    Tire suas principais dúvidas sobre o nosso processo de diagnóstico, prazo de reparo e termos de garantia.
                  </p>
                </div>

                <div className="space-y-4 font-sans" id="landing-faq-list">
                  {config.faqs && config.faqs.slice(0, 5).map((faq) => (
                    <div key={faq.id} className="p-5 rounded-2xl bg-white border border-neutral-150 space-y-1.5 shadow-3xs" id={`faq-public-${faq.id}`}>
                      <h4 className="font-bold text-neutral-900 text-xs sm:text-sm leading-snug">{faq.question}</h4>
                      <p className="text-xs text-neutral-400 leading-relaxed font-medium">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Public Footer with integrated Contact and Address Details */}
      <footer className="bg-neutral-950 text-neutral-400 py-16 mt-auto border-t border-neutral-900 text-xs font-medium" id="public-footer">
        <div className="max-w-5xl mx-auto px-6 space-y-12">
          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            {/* Column 1: Brand & Bio */}
            <div className="md:col-span-4 space-y-4">
              <div 
                className="flex items-center gap-3 group cursor-pointer inline-flex" 
                onClick={() => { setActivePost(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                title="Voltar ao início"
              >
                <div className="h-10 px-3 py-1 bg-white rounded-xl flex items-center justify-center transition-transform duration-300 shadow-sm shrink-0">
                  <img 
                    src={logoUrl} 
                    alt="AndMicrocell Logo" 
                    className="h-8 w-auto object-contain" 
                    referrerPolicy="no-referrer" 
                  />
                </div>
                <span className="font-black text-white text-base tracking-tight transition-colors duration-300">
                  {config.name}
                </span>
              </div>
              <p className="text-neutral-500 text-xs leading-relaxed max-w-xs">
                Especialistas em manutenção avançada de smartphones e notebooks. Reparos rápidos de alta precisão com componentes premium e até 360 dias de garantia.
              </p>
            </div>

            {/* Column 2: Location/Address details */}
            <div className="md:col-span-4 space-y-3">
              <h4 className="text-white font-bold tracking-wider text-[10px] uppercase font-mono">Nosso Endereço</h4>
              <div className="flex items-start gap-2.5 text-neutral-400">
                <MapPin className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="leading-relaxed text-xs font-semibold">{config.address}</p>
                  <p className="text-neutral-500 text-[10px] italic">Atendimento presencial e modalidade Delivery para coleta e entrega rápida.</p>
                </div>
              </div>
            </div>

            {/* Column 3: Business Hours & Phone contact */}
            <div className="md:col-span-4 space-y-3">
              <h4 className="text-white font-bold tracking-wider text-[10px] uppercase font-mono">Contato & Atendimento</h4>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 text-neutral-400">
                  <Clock className="w-4 h-4 text-neutral-500 shrink-0" />
                  <span className="text-xs font-semibold">{config.businessHours}</span>
                </div>
                <div className="flex items-center gap-2.5 text-neutral-400">
                  <Phone className="w-4 h-4 text-neutral-500 shrink-0" />
                  <span className="text-xs font-bold font-mono text-white">{config.phone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright Row */}
          <div className="pt-8 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-neutral-600 text-[11px] font-medium">
            <p>&copy; 2026 {config.name}. Todos os direitos reservados.</p>
            <div className="flex items-center gap-1.5 text-neutral-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-mono text-[10px] tracking-wider uppercase">Laboratório de Alta Precisão</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Action Button */}
      <div className="fixed bottom-6 right-6 z-50 group flex flex-col items-end">
        {/* Hover message */}
        <div className="bg-neutral-950 text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-full shadow-lg border border-neutral-850 mb-2 mr-1 scale-0 group-hover:scale-100 origin-bottom-right transition-all duration-300 pointer-events-none whitespace-nowrap">
          💬 Fale Conosco no WhatsApp
        </div>
        <a
          href={getWhatsAppLink()}
          target="_blank"
          rel="noreferrer"
          className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-md active:scale-95 transition-all duration-300 relative"
          aria-label="Fale conosco no WhatsApp"
        >
          {/* Pulsing ring animation */}
          <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-25"></span>
          <Phone className="w-5 h-5 fill-white text-white relative z-10" />
        </a>
      </div>
    </div>
  );
}
