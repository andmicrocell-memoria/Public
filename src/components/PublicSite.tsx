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
import logoUrl from "../assets/images/regenerated_image_1783646296675.png";

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
      <header className="bg-white border-b border-slate-200 py-4.5 sticky top-0 z-20 shadow-sm" id="public-site-header">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div 
            className="flex items-center gap-3 group cursor-pointer" 
            onClick={() => setActivePost(null)}
            title="Ir para o início"
          >
            <div className="w-12 h-12 rounded-xl bg-white overflow-hidden flex items-center justify-center shadow-md border border-slate-200/80 group-hover:scale-110 group-hover:rotate-3 group-hover:border-amber-200 group-hover:shadow-amber-500/10 transition-all duration-300 shrink-0">
              <img 
                src={logoUrl} 
                alt="AndMicrocell Logo" 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                referrerPolicy="no-referrer" 
              />
            </div>
            <div>
              <h1 className="font-extrabold text-slate-900 tracking-tight text-lg sm:text-xl leading-none group-hover:text-amber-600 transition-colors duration-300">
                {config.name}
              </h1>
              <p className="text-[11px] text-slate-500 font-medium mt-1.5 leading-none transition-colors duration-300 group-hover:text-amber-500/80">{config.category}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <a 
              href={getWhatsAppLink()} 
              target="_blank" 
              rel="noreferrer"
              className="px-4.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-600/10 hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
              id="header-wa-btn"
            >
              <Phone className="w-4 h-4 fill-white" />
              <span>Fale Conosco</span>
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
            <section className="bg-gradient-to-b from-white via-slate-50 to-slate-100/40 border-b border-slate-200 py-16 sm:py-24 relative">
              <div className="max-w-6xl mx-auto px-4 text-center space-y-6 relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-xs font-semibold animate-fade-in shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{config.specialOffers || "Orçamento 100% gratuito e sem compromisso!"}</span>
                </div>
                
                <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight max-w-3xl mx-auto">
                  Conserto Profissional de Smartphones com <span className="text-amber-600">Garantia Completa</span>
                </h2>
                
                <p className="text-slate-500 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                  Trabalhamos com manutenção avançada das marcas mais conhecidas do mercado. Troca de telas, baterias e placas com profissionais certificados e rapidez garantida.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <a 
                    href={getWhatsAppLink()} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all hover:-translate-y-0.5 shadow-lg shadow-emerald-600/15 flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4 fill-white" />
                    <span>Solicitar Orçamento Grátis</span>
                  </a>
                  <a 
                    href="#blog-section" 
                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all border border-slate-200 hover:border-slate-300 flex items-center justify-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Dicas & Notícias</span>
                  </a>
                </div>

                {/* Key value propositions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto pt-12" id="hero-features">
                  <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-start gap-4 text-left">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-950 text-sm">Avaliação Sem Custo</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-normal">Não cobramos taxa para fazer o orçamento do seu celular.</p>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-start gap-4 text-left">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-950 text-sm">Garantia de 90 a 360 Dias</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-normal">Oferecemos garantias completas de 90, 180 e 360 dias, dependendo do reparo ou peça utilizada.</p>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-start gap-4 text-left">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-950 text-sm">Peças Premium</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-normal">Trabalhamos com componentes selecionados para maior durabilidade.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Blog & News Section */}
            <section className="max-w-6xl mx-auto px-4 py-16 scroll-mt-24" id="blog-section">
              <div className="space-y-8">
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider font-mono">Nosso Blog</h3>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">Dicas & Novidades Tecnológicas</h2>
                    <p className="text-xs text-slate-500 max-w-lg leading-normal">
                      Aprenda a cuidar melhor dos seus eletrônicos com as orientações técnicas da nossa equipe.
                    </p>
                  </div>

                  {/* Search bar */}
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      placeholder="Buscar artigos..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 text-slate-700"
                    />
                  </div>
                </div>

                {/* Category filters */}
                <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200/60 pb-4">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                        selectedCategory === cat 
                          ? "bg-slate-900 text-white" 
                          : "bg-white border border-slate-200 hover:border-slate-300 text-slate-600"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Grid List */}
                {loading ? (
                  <div className="text-center py-20 text-slate-400 space-y-3">
                    <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto"></div>
                    <p className="text-xs font-medium">Buscando dicas exclusivas para você...</p>
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div className="text-center py-20 rounded-2xl bg-white border border-slate-200">
                    <p className="text-slate-400 text-sm font-medium">Nenhum artigo encontrado para a pesquisa.</p>
                    <button 
                      onClick={() => { setSearchQuery(""); setSelectedCategory("Todas"); }}
                      className="mt-3 text-indigo-600 hover:underline text-xs font-semibold cursor-pointer"
                    >
                      Limpar Filtros e Mostrar Todos
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredPosts.map((post) => (
                      <article 
                        key={post.id} 
                        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md hover:border-slate-300 transition-all group hover:-translate-y-0.5"
                      >
                        {/* Image wrapper */}
                        <div className="h-48 w-full overflow-hidden relative cursor-pointer" onClick={() => handlePostClick(post)}>
                          <img 
                            src={post.coverImage} 
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute top-3 left-3">
                            <span className="px-2 py-1 rounded bg-indigo-600 text-white text-[10px] font-bold tracking-tight uppercase shadow">
                              {post.category}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <span className="text-[10px] font-mono font-bold text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {post.publishedAt.split("-").reverse().join("/")}
                              <span className="text-slate-300">•</span>
                              <Clock className="w-3 h-3" />
                              {post.readTime}
                            </span>
                            
                            <h4 
                              onClick={() => handlePostClick(post)}
                              className="font-bold text-slate-900 text-base leading-tight hover:text-indigo-600 transition-colors cursor-pointer line-clamp-2"
                            >
                              {post.title}
                            </h4>

                            <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                              {post.excerpt}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                            <button 
                              onClick={() => handlePostClick(post)}
                              className="text-indigo-600 hover:text-indigo-500 font-bold text-xs flex items-center gap-1 group/btn cursor-pointer"
                            >
                              <span>Ler Artigo</span>
                              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                            </button>
                            
                            <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 font-mono">
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
            <section className="bg-gradient-to-b from-white to-slate-50 border-t border-slate-200/80 py-20 relative overflow-hidden" id="public-testimonials-section">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="max-w-6xl mx-auto px-4 space-y-12 relative z-10">
                {/* Section Header */}
                <div className="text-center space-y-3 max-w-2xl mx-auto">
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-widest font-mono bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 shadow-2xs">Prova Social</span>
                  <h2 className="text-2xl sm:text-4.5xl font-extrabold text-slate-950 tracking-tight">O que dizem nossos clientes</h2>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    A satisfação dos nossos clientes é o nosso maior selo de qualidade. Confira avaliações reais de quem já realizou serviços de manutenção com a gente.
                  </p>
                </div>

                {/* Grid List */}
                {!config.testimonials || config.testimonials.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    Nenhum depoimento cadastrado no momento.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {config.testimonials.map((t) => (
                      <div 
                        key={t.id} 
                        className="bg-white p-6 rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-md transition-all duration-300 relative group flex flex-col justify-between"
                        id={`public-testimonial-${t.id}`}
                      >
                        {/* Big quote mark */}
                        <span className="absolute top-4 right-5 text-amber-400/10 text-6xl font-serif select-none pointer-events-none group-hover:text-amber-400/20 transition-colors">“</span>
                        
                        <div className="space-y-4">
                          {/* Stars */}
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-3.5 h-3.5 ${i < (t.rating || 5) ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} 
                              />
                            ))}
                          </div>

                          {/* Testimonial text */}
                          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed italic relative z-10">
                            "{t.text}"
                          </p>
                        </div>

                        {/* Customer profile */}
                        <div className="flex items-center gap-3 pt-5 mt-5 border-t border-slate-100">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 text-white font-extrabold text-xs tracking-wider flex items-center justify-center font-mono shadow-md shadow-amber-500/10 shrink-0">
                            {t.avatar || (t.name ? t.name.split(" ").map(n => n[0]).join("").substring(0,2).toUpperCase() : "C")}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">{t.name}</h4>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400 font-medium">
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
                <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 pt-8 border-t border-slate-200/60 max-w-3xl mx-auto" id="credibility-stats">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100/50">
                      <Star className="w-5 h-5 fill-amber-600" />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 text-base leading-none">4.9 / 5.0</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-1">Média de satisfação geral</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100/50">
                      <ThumbsUp className="w-5 h-5 text-indigo-600 fill-indigo-600/10" />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 text-base leading-none">100%</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-1">De garantia e suporte pós-reparo</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/50">
                      <MessageSquare className="w-5 h-5 text-emerald-600 fill-emerald-600/10" />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 text-base leading-none">Suporte Real</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-1">Via WhatsApp 24h/7</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Informational Store Contact / FAQ / Location Section */}
            <section className="bg-slate-100 border-t border-slate-200 py-16">
              <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-12">
                
                {/* Store Details */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider font-mono">Nossa Loja</h3>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">Onde nos Encontrar</h2>
                  </div>

                  <p className="text-slate-500 text-xs leading-relaxed">
                    Venha nos visitar em nosso espaço físico. <span className="text-slate-400 block mt-1.5 text-[11px] font-medium italic">(Em breve: ativaremos nossa modalidade de Delivery para retirada e entrega de aparelhos no conforto da sua residência!)</span>
                  </p>

                  <div className="space-y-3 font-medium text-slate-700 text-xs">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-900">Endereço</p>
                        <p className="text-slate-500 mt-0.5">{config.address}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-900">Horário de Atendimento</p>
                        <p className="text-slate-500 mt-0.5">{config.businessHours}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-900">Telefone & WhatsApp</p>
                        <p className="text-slate-500 mt-0.5">{config.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FAQ quick widget */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider font-mono">Dúvidas Comuns</h3>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">Perguntas Frequentes</h2>
                  </div>

                  <div className="space-y-3.5" id="landing-faq-list">
                    {config.faqs && config.faqs.slice(0, 4).map((faq) => (
                      <div key={faq.id} className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-1.5" id={`faq-public-${faq.id}`}>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{faq.question}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </section>
          </div>
        )}
      </div>

      {/* Public Footer */}
      <footer className="bg-slate-950 text-slate-400 py-10 mt-auto border-t border-slate-900 text-xs" id="public-footer">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div 
            className="flex items-center gap-2.5 group cursor-pointer" 
            onClick={() => { setActivePost(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            title="Voltar ao início"
          >
            <div className="w-8 h-8 rounded bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <img 
                src={logoUrl} 
                alt="AndMicrocell Logo" 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                referrerPolicy="no-referrer" 
              />
            </div>
            <span className="font-bold text-white text-[13px] tracking-tight group-hover:text-indigo-400 transition-colors duration-300">
              {config.name}
            </span>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-slate-500">
            <a href="/politica" target="_blank" className="hover:text-indigo-400 transition-colors">Política de Privacidade</a>
            <span className="text-slate-800">|</span>
            <p className="text-slate-600 text-[11px]">&copy; 2026 {config.name}. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
