import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Sparkles, 
  BookOpen, 
  Eye, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  Calendar, 
  ArrowUpRight,
  Globe,
  FileText,
  Clock,
  X,
  Search,
  CheckCircle2,
  Image as ImageIcon,
  Upload
} from "lucide-react";
import { BlogPost, BusinessConfig, getApiUrl } from "../types";
import { db, collection, getDocs, doc, setDoc, deleteDoc } from "../firebase";
import staticPosts from "../../data/posts.json";

const compressImage = (base64Str: string, maxWidth = 1000, quality = 0.75): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedBase64);
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

const suggestedTechTopics = [
  {
    title: "A importância de trocar a bateria do iPhone seguindo as recomendações do fabricante",
    category: "Manutenção",
    source: "Tendência TechTudo",
    icon: "🔋"
  },
  {
    title: "Reparo de placa de iPhone vs Comprar um aparelho novo: Quando realmente vale a pena?",
    category: "Manutenção",
    source: "Dica De Olho",
    icon: "🔬"
  },
  {
    title: "Celular caiu na água? Erros fatais que você deve evitar em casa (e o mito do arroz)",
    category: "Guias",
    source: "TechTudo Alerta",
    icon: "💧"
  },
  {
    title: "Por que a saúde da bateria do seu iPhone cai rápido? 5 hábitos reais que danificam a vida útil",
    category: "Dicas",
    source: "Tendência Nacional",
    icon: "📱"
  },
  {
    title: "Curto-circuito na placa do iPhone: Como a micro-soldagem avançada recupera o seu aparelho",
    category: "Manutenção",
    source: "Foco Técnico",
    icon: "⚡"
  }
];

interface BlogAdminProps {
  config: BusinessConfig;
  onViewPublicSite: () => void;
  addLog: (type: 'whatsapp_received' | 'whatsapp_sent' | 'review_received' | 'review_replied' | 'system', description: string, meta?: string) => void;
}

export default function BlogAdmin({ config, onViewPublicSite, addLog }: BlogAdminProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiCategory, setAiCategory] = useState("Dicas");
  const [searchTerm, setSearchTerm] = useState("");
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [apiKeyNotice, setApiKeyNotice] = useState<string | null>(null);

  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  // States for dynamic post ideas filtering and refresh
  const [ideas, setIdeas] = useState<any[]>(suggestedTechTopics);
  const [ideasCategoryFilter, setIdeasCategoryFilter] = useState("Todas");
  const [loadingIdeas, setLoadingIdeas] = useState(false);

  useEffect(() => {
    fetchPosts();
    fetchNewIdeas("Todas");
  }, []);

  const fetchNewIdeas = async (categoryFilter?: string) => {
    const filterToUse = categoryFilter !== undefined ? categoryFilter : ideasCategoryFilter;
    try {
      setLoadingIdeas(true);
      const res = await fetch(getApiUrl("/api/posts/ideas"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: filterToUse })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.ideas) {
          setIdeas(data.ideas);
        }
      }
    } catch (err) {
      console.error("Error fetching post ideas:", err);
    } finally {
      setLoadingIdeas(false);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const isCustomDomain = !window.location.hostname.includes("ais-dev") && 
                             !window.location.hostname.includes("ais-pre") && 
                             window.location.hostname !== "localhost" && 
                             window.location.hostname !== "127.0.0.1";

      if (isCustomDomain) {
        console.log("Admin loading posts directly from Firestore client-side...");
        const postsCol = collection(db, "posts");
        const snapshot = await getDocs(postsCol);
        const fetchedPosts: BlogPost[] = [];
        snapshot.forEach((doc) => {
          fetchedPosts.push(doc.data() as BlogPost);
        });
        const sorted = fetchedPosts.sort((a, b) => {
          const dateA = a.publishedAt || "";
          const dateB = b.publishedAt || "";
          if (dateA !== dateB) {
            return dateB.localeCompare(dateA);
          }
          return (b.id || "").localeCompare(a.id || "");
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
          throw new Error("Server error");
        }
      }
    } catch (err) {
      console.warn("Using local posts storage fallback:", err);
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

  const triggerAlert = (type: 'success' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => {
      setAlertMsg(null);
    }, 4000);
  };

  const handleCreateNew = () => {
    setApiKeyNotice(null);
    setEditingPost({
      title: "",
      category: "Dicas",
      excerpt: "",
      content: "",
      coverImage: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop",
    });
    setIsEditing(true);
  };

  const handleEdit = (post: BlogPost) => {
    setApiKeyNotice(null);
    setEditingPost(post);
    setIsEditing(true);
  };

  const handleDelete = async (postId: string) => {
    try {
      const isCustomDomain = !window.location.hostname.includes("ais-dev") && 
                             !window.location.hostname.includes("ais-pre") && 
                             window.location.hostname !== "localhost" && 
                             window.location.hostname !== "127.0.0.1";

      if (isCustomDomain) {
        console.log("Deleting post directly from Firestore client-side:", postId);
        await deleteDoc(doc(db, "posts", postId));
        setPosts(prev => {
          const updated = prev.filter(p => p.id !== postId);
          localStorage.setItem("and_microcell_posts", JSON.stringify(updated));
          return updated;
        });
        addLog("system", `Postagem excluída definitivamente (Firestore)`, `ID: ${postId}`);
        triggerAlert("success", "Postagem excluída com sucesso!");
      } else {
        const res = await fetch(getApiUrl(`/api/posts/${postId}`), { method: "DELETE" });
        if (res.ok) {
          setPosts(prev => {
            const updated = prev.filter(p => p.id !== postId);
            localStorage.setItem("and_microcell_posts", JSON.stringify(updated));
            return updated;
          });
          addLog("system", `Postagem excluída definitivamente`, `ID: ${postId}`);
          triggerAlert("success", "Postagem excluída com sucesso!");
        } else {
          throw new Error("Server error");
        }
      }
    } catch (e) {
      console.warn("Deleting post locally:", e);
      setPosts(prev => {
        const updated = prev.filter(p => p.id !== postId);
        localStorage.setItem("and_microcell_posts", JSON.stringify(updated));
        return updated;
      });
      addLog("system", `Postagem excluída localmente`, `ID: ${postId}`);
      triggerAlert("success", "Postagem excluída localmente com sucesso!");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        triggerAlert("error", "A imagem é muito grande. Escolha uma imagem de até 10MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          const compressed = await compressImage(base64String, 900, 0.7);
          setEditingPost(prev => prev ? { ...prev, coverImage: compressed } : null);
          triggerAlert("success", "Imagem carregada e otimizada com sucesso!");
        } catch (err) {
          console.error("Compression failed:", err);
          setEditingPost(prev => prev ? { ...prev, coverImage: base64String } : null);
          triggerAlert("success", "Imagem carregada com sucesso!");
        }
      };
      reader.onerror = () => {
        triggerAlert("error", "Erro ao carregar o arquivo de imagem.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost?.title || !editingPost?.content) {
      triggerAlert("error", "Título e conteúdo são obrigatórios.");
      return;
    }

    try {
      const isNew = !editingPost.id;
      
      // Se a imagem de capa for um base64 muito grande, comprime ela antes de enviar
      let finalCoverImage = editingPost.coverImage || "";
      if (finalCoverImage.startsWith("data:image/") && finalCoverImage.length > 100000) {
        try {
          finalCoverImage = await compressImage(finalCoverImage, 800, 0.6);
        } catch (compErr) {
          console.warn("Failed to compress cover image during save:", compErr);
        }
      }

      const payload = {
        ...editingPost,
        coverImage: finalCoverImage,
        id: editingPost.id || `post-${Date.now()}`,
        publishedAt: editingPost.publishedAt || new Date().toISOString().split('T')[0],
        slug: editingPost.slug || (editingPost.title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        views: editingPost.views || 0,
        readTime: editingPost.readTime || `${Math.max(1, Math.ceil((editingPost.content || "").split(/\s+/).length / 200))} min de leitura`
      };

      try {
        const isCustomDomain = !window.location.hostname.includes("ais-dev") && 
                               !window.location.hostname.includes("ais-pre") && 
                               window.location.hostname !== "localhost" && 
                               window.location.hostname !== "127.0.0.1";

        if (isCustomDomain) {
          console.log("Saving post directly to Firestore client-side:", payload.id);
          await setDoc(doc(db, "posts", payload.id), payload);
          await fetchPosts();
          setIsEditing(false);
          setEditingPost(null);
          addLog("system", isNew ? `Nova postagem publicada (Firestore): "${editingPost.title}"` : `Postagem atualizada (Firestore): "${editingPost.title}"`, `Visualizações: ${editingPost.views || 0}`);
          triggerAlert("success", isNew ? "Nova postagem publicada com sucesso!" : "Postagem atualizada com sucesso!");
          return;
        } else {
          const res = await fetch(getApiUrl("/api/posts"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              await fetchPosts();
              setIsEditing(false);
              setEditingPost(null);
              addLog("system", isNew ? `Nova postagem publicada: "${editingPost.title}"` : `Postagem atualizada: "${editingPost.title}"`, `Visualizações: ${editingPost.views || 0}`);
              triggerAlert("success", isNew ? "Nova postagem publicada com sucesso!" : "Postagem atualizada com sucesso!");
              return;
            }
          }
          throw new Error("Server returned error status");
        }
      } catch (errApi) {
        console.warn("Saving post locally:", errApi);
        setPosts(prev => {
          let updated;
          if (isNew) {
            updated = [payload as BlogPost, ...prev];
          } else {
            updated = prev.map(p => p.id === payload.id ? (payload as BlogPost) : p);
          }
          localStorage.setItem("and_microcell_posts", JSON.stringify(updated));
          return updated;
        });
        setIsEditing(false);
        setEditingPost(null);
        addLog("system", isNew ? `Nova postagem salva localmente (sem sincronização com a nuvem): "${payload.title}"` : `Postagem atualizada localmente (sem sincronização com a nuvem): "${payload.title}"`);
        triggerAlert("success", isNew ? "Nova postagem salva localmente no navegador! (Sem sincronizar com a nuvem)" : "Postagem atualizada localmente no navegador! (Sem sincronizar com a nuvem)");
      }
    } catch (e) {
      console.error(e);
      triggerAlert("error", "Erro ao salvar a postagem.");
    }
  };

  // Generate with Gemini!
  const handleGenerateWithAI = async () => {
    if (!aiPrompt) {
      triggerAlert("error", "Digite o tema/tópico para a IA escrever.");
      return;
    }

    try {
      setIsGenerating(true);
      triggerAlert("success", "O redator IA está pesquisando e redigindo o artigo. Aguarde...");
      
      try {
        const res = await fetch(getApiUrl("/api/posts/generate"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: aiPrompt, category: aiCategory })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.post) {
            setEditingPost(data.post);
            setIsEditing(true);
            setAiPrompt("");
            setApiKeyNotice(data.apiKeyNotice || null);
            addLog("system", `IA rascunhou artigo automaticamente sobre: "${aiPrompt}"`);
            triggerAlert("success", data.isSimulatedFallback ? "Rascunho inteligente gerado!" : "Artigo completo gerado com sucesso pela IA!");
          }
          return;
        }
        throw new Error("AI Server returned error");
      } catch (errApi) {
        console.warn("Generating simple fallback post locally:", errApi);
        
        const dummyPost: BlogPost = {
          id: `post-ai-${Date.now()}`,
          title: `Como resolver: ${aiPrompt.charAt(0).toUpperCase() + aiPrompt.slice(1)}`,
          slug: aiPrompt.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
          category: aiCategory,
          publishedAt: new Date().toISOString().split('T')[0],
          excerpt: `Aprenda o passo a passo essencial para identificar e solucionar problemas relacionados a "${aiPrompt}" de forma prática e segura.`,
          content: `## Introdução a: ${aiPrompt}\n\nProblemas com **${aiPrompt}** são muito comuns no dia a dia da assistência técnica de celulares e microeletrônica. Neste guia rápido, preparamos as melhores dicas e práticas para você diagnosticar e reparar esse problema.\n\n### Passo 1: Diagnóstico Visual\nSempre comece inspecionando os componentes físicos sob o microscópio. Procure por sinais de oxidação, trincas ou componentes faltantes ao redor do circuito.\n\n### Passo 2: Medições de Tensão e Corrente\nUtilize o multímetro na escala de diodo e de condução reversa para conferir se há curtos nas malhas principais de alimentação.\n\n### Passo 3: Limpeza Química e Desoxidação\nSe houver sinais de contato com água, realize uma limpeza cuidadosa na banheira de ultrassom com álcool isopropílico.\n\n### Conclusão\nRealizar diagnósticos precisos evita trocas desnecessárias de peças e valoriza o seu serviço técnico! Se precisar de suporte especializado, entre em contato com a equipe da **AndMicrocell**!`,
          coverImage: "https://images.unsplash.com/photo-1597733336794-12d05021d510?w=600&auto=format&fit=crop",
          views: 0,
          readTime: "3 min de leitura"
        };
        
        setEditingPost(dummyPost);
        setIsEditing(true);
        setAiPrompt("");
        setApiKeyNotice("O servidor de inteligência artificial de nuvem está temporariamente indisponível. Geramos um excelente rascunho técnico local para você!");
        addLog("system", `IA rascunhou artigo (fallback local) sobre: "${aiPrompt}"`);
        triggerAlert("success", "Rascunho local gerado com sucesso!");
      }
    } catch (err) {
      console.error(err);
      triggerAlert("error", "Houve uma falha na geração por IA.");
    } finally {
      setIsGenerating(false);
    }
  };

  const filtered = posts.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 w-full" id="blog-admin-root">
      
      {/* Alert Notifications Banner */}
      <AnimatePresence>
        {alertMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-xl flex items-center gap-3 border shadow-lg ${
              alertMsg.type === 'success' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}
            id="blog-alert-banner"
          >
            {alertMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span className="text-xs font-semibold">{alertMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800/50 pb-5" id="blog-header-row">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            <span>Mini-Site & Blog Manager</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Crie artigos educativos, guias de manutenção e novidades tecnológicas para fidelizar seus clientes e atrair novos através do Google.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full lg:w-auto">
          <button
            onClick={onViewPublicSite}
            className="w-1/2 lg:w-auto px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:text-white font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            id="btn-preview-public"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>Ver Site do Cliente</span>
            <ArrowUpRight className="w-3 h-3 text-slate-500" />
          </button>

          <button
            onClick={handleCreateNew}
            disabled={isEditing}
            className="w-1/2 lg:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 disabled:opacity-50"
            id="btn-new-post"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Artigo</span>
          </button>
        </div>
      </div>

      {isEditing ? (
        /* Edit or Add Post Form */
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl bg-[#0b101d] border border-slate-800/60 space-y-6"
          id="post-editor-form"
        >
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-sm text-white">
                {editingPost?.id ? "Editar Publicação" : "Escrever Nova Publicação"}
              </h3>
            </div>
            <button 
              onClick={() => { setIsEditing(false); setEditingPost(null); setApiKeyNotice(null); }}
              className="text-slate-500 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {apiKeyNotice && (
            <div className="p-3.5 bg-indigo-950/40 border border-indigo-800/40 rounded-xl flex items-start gap-2.5 text-indigo-200 text-xs">
              <AlertCircle className="w-4.5 h-4.5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-indigo-300 mb-0.5">Nota do Redator IA:</p>
                <p className="text-slate-300 leading-relaxed">{apiKeyNotice}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-mono text-slate-400 mb-1.5">Título da Publicação</label>
                <input 
                  type="text"
                  required
                  value={editingPost?.title || ""}
                  onChange={(e) => setEditingPost(prev => prev ? { ...prev, title: e.target.value } : null)}
                  placeholder="Ex: Como salvar um celular que caiu na água"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1.5">Categoria</label>
                <select
                  value={editingPost?.category || "Dicas"}
                  onChange={(e) => setEditingPost(prev => prev ? { ...prev, category: e.target.value } : null)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="Dicas">Dicas</option>
                  <option value="Guias">Guias</option>
                  <option value="Manutenção">Manutenção</option>
                  <option value="Novidades">Novidades</option>
                </select>
              </div>

              {/* Cover Image URL */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-mono text-slate-400 mb-1.5 flex justify-between items-center">
                  <span>Imagem de Capa (URL ou Arquivo)</span>
                  <span 
                    onClick={() => document.getElementById("hidden-file-input")?.click()}
                    className="text-[10px] text-indigo-400 font-sans hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" />
                    Enviar do Computador
                  </span>
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={editingPost?.coverImage || ""}
                    onChange={(e) => setEditingPost(prev => prev ? { ...prev, coverImage: e.target.value } : null)}
                    placeholder="URL ou envie um arquivo local..."
                    className="flex-grow px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <input 
                    type="file"
                    id="hidden-file-input"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById("hidden-file-input")?.click()}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Upload</span>
                  </button>
                  <div className="w-10 h-10 rounded-xl border border-slate-800 bg-slate-900/50 flex items-center justify-center overflow-hidden shrink-0">
                    {editingPost?.coverImage ? (
                      <img src={editingPost.coverImage} className="w-full h-full object-cover" onError={(e) => { (e.target as any).src = "" }} alt="" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                </div>
              </div>

              {/* Excerpt */}
              <div className="md:col-span-3">
                <label className="block text-[11px] font-mono text-slate-400 mb-1.5">Resumo Rápido (Excerpt)</label>
                <input 
                  type="text"
                  required
                  value={editingPost?.excerpt || ""}
                  onChange={(e) => setEditingPost(prev => prev ? { ...prev, excerpt: e.target.value } : null)}
                  placeholder="Resumo de 1 ou 2 frases que aparece na lista de artigos."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Content text */}
              <div className="md:col-span-3">
                <label className="block text-[11px] font-mono text-slate-400 mb-1.5 flex justify-between">
                  <span>Conteúdo Completo (Suporta Subtítulos com ###)</span>
                  <span className="text-[10px] text-slate-500 font-sans">Mencione a sua marca no final para atrair contatos!</span>
                </label>
                <textarea 
                  required
                  rows={12}
                  value={editingPost?.content || ""}
                  onChange={(e) => setEditingPost(prev => prev ? { ...prev, content: e.target.value } : null)}
                  placeholder="Escreva aqui seu artigo completo...\n\nUse ### para criar cabeçalhos de seção.\nEx:\n### 1. Desligue o aparelho imediatamente\nPara evitar curtos-circuitos, desligue o aparelho..."
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 leading-relaxed"
                ></textarea>
              </div>

            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/50">
              <button
                type="button"
                onClick={() => { setIsEditing(false); setEditingPost(null); }}
                className="px-4 py-2 rounded-xl bg-transparent hover:bg-slate-900 text-slate-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/10 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Salvar e Publicar</span>
              </button>
            </div>
          </form>
        </motion.div>
      ) : (
        /* Blog Main Dashboard layout */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="blog-admin-grid">
          
          {/* Main List Column */}
          <div className="lg:col-span-2 space-y-4" id="blog-posts-list-section">
            
            {/* Search and Quick filters */}
            <div className="flex items-center justify-between gap-4 bg-slate-950/40 p-3 rounded-2xl border border-slate-900">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="Filtrar por título ou categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800/80 text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
              <span className="text-[10px] text-slate-500 font-mono shrink-0 pr-1">
                Total: {filtered.length} artigos
              </span>
            </div>

            {loading ? (
              <div className="text-center py-20 text-slate-500 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mx-auto" />
                <p className="text-xs">Sincronizando artigos com o servidor...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 rounded-3xl bg-[#0b101d] border border-slate-800/50 text-slate-500 space-y-4">
                <BookOpen className="w-10 h-10 text-slate-700 mx-auto" />
                <div>
                  <p className="text-sm font-semibold text-slate-300">Nenhum artigo publicado ainda</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Use o painel lateral ao lado para escrever um tema ou use o assistente IA para criar seus primeiros artigos em segundos!
                  </p>
                </div>
                <button
                  onClick={handleCreateNew}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Escrever Primeiro Artigo
                </button>
              </div>
            ) : (
              /* Posts Grid */
              <div className="space-y-3.5" id="posts-list">
                {filtered.map((post) => (
                  <div 
                    key={post.id} 
                    className="p-4 rounded-2xl bg-[#0b101d] border border-slate-800/60 hover:border-slate-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    id={`post-row-${post.id}`}
                  >
                    <div className="flex items-center gap-4 min-w-0" id={`post-row-info-${post.id}`}>
                      {/* Cover preview */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-800 relative">
                        <img src={post.coverImage} className="w-full h-full object-cover" alt="" />
                      </div>

                      <div className="min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {post.category}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {post.publishedAt.split("-").reverse().join("/")}
                          </span>
                        </div>

                        <h4 className="font-semibold text-slate-200 text-xs sm:text-sm truncate pr-4">
                          {post.title}
                        </h4>

                        <p className="text-[10px] text-slate-400 truncate max-w-lg leading-normal">
                          {post.excerpt}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3.5 sm:pt-0 border-slate-800/60 shrink-0">
                      {/* Performance metrics */}
                      <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500 mr-2">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{post.views || 0} views</span>
                      </div>

                      {/* Actions */}
                      <button 
                        onClick={() => handleEdit(post)}
                        className="p-2 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
                        title="Editar Artigo"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button 
                        onClick={() => setPostToDelete(post.id)}
                        className="p-2 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-slate-800 transition-colors cursor-pointer"
                        title="Excluir Artigo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Generator Column Panel */}
          <div className="p-5 rounded-3xl bg-[#0b101d] border border-slate-800/60 flex flex-col gap-5 self-start" id="blog-ai-panel">
            <div className="space-y-1">
              <h3 className="font-display font-semibold text-sm text-white flex items-center gap-2" id="ai-panel-title">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>Gerador de Artigos IA</span>
              </h3>
              <p className="text-[11px] text-slate-400 leading-normal" id="ai-panel-subtitle">
                Crie rascunhos de publicações para o seu blog em segundos sem precisar digitar tudo. Nossa inteligência artificial pesquisa e redige para você!
              </p>
            </div>

            {/* Suggested Trending Topics list */}
            <div className="space-y-2.5 border-t border-b border-slate-800/40 py-3.5" id="ai-panel-suggestions">
              <div className="flex items-center justify-between gap-2">
                <span className="block text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                  Ideias de Post {ideasCategoryFilter !== "Todas" ? `(${ideasCategoryFilter})` : ""}:
                </span>
                
                {/* Refresh and Filter buttons */}
                <button
                  type="button"
                  onClick={() => fetchNewIdeas()}
                  disabled={loadingIdeas}
                  className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Atualizar ideias com IA"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingIdeas ? 'animate-spin text-indigo-400' : ''}`} />
                </button>
              </div>

              {/* Category Filter for Suggestions */}
              <div className="flex flex-wrap gap-1" id="ideas-category-tabs">
                {["Todas", "Dicas", "Guias", "Manutenção", "Novidades"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setIdeasCategoryFilter(cat);
                      fetchNewIdeas(cat);
                    }}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all border cursor-pointer ${
                      ideasCategoryFilter === cat
                        ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/40'
                        : 'bg-slate-950/40 text-slate-500 border-slate-900 hover:text-slate-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-2 max-h-[175px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800/60" id="ai-suggestions-list">
                {loadingIdeas ? (
                  <div className="text-center py-8 text-slate-500 space-y-1.5">
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-400 mx-auto" />
                    <p className="text-[9px] font-mono">Buscando novas ideias...</p>
                  </div>
                ) : ideas.length === 0 ? (
                  <p className="text-center py-6 text-[10px] text-slate-500 font-mono">Nenhuma ideia encontrada.</p>
                ) : (
                  ideas.map((topic, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setAiPrompt(topic.title);
                        setAiCategory(topic.category);
                      }}
                      className={`text-left p-2.5 rounded-xl border text-[11px] leading-normal transition-all duration-150 flex items-start gap-2.5 cursor-pointer ${
                        aiPrompt === topic.title
                          ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-300'
                          : 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-900 hover:border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      <span className="text-xs shrink-0 mt-0.5">{topic.icon}</span>
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold block leading-snug">{topic.title}</span>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[8px] font-bold px-1.5 py-0.5 bg-slate-900/80 text-indigo-400 rounded uppercase border border-slate-800">
                            {topic.category}
                          </span>
                          <span className="text-[8px] text-slate-500 font-mono">
                            {topic.source}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-4" id="ai-panel-inputs">
              <div id="ai-fld-prompt">
                <label className="block text-[10px] font-mono text-slate-400 mb-1.5">Sobre qual assunto quer escrever?</label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ex: Por que a tela do iPhone esquenta muito carregando? Ou 'Cuidado ao limpar a tela com álcool gel'"
                  rows={4}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 placeholder-slate-600 leading-normal resize-none"
                />
              </div>

              <div id="ai-fld-category">
                <label className="block text-[10px] font-mono text-slate-400 mb-1.5">Categoria Recomendada</label>
                <select
                  value={aiCategory}
                  onChange={(e) => setAiCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="Dicas">Dicas</option>
                  <option value="Guias">Guias</option>
                  <option value="Manutenção">Manutenção</option>
                  <option value="Novidades">Novidades</option>
                </select>
              </div>

              <button
                onClick={handleGenerateWithAI}
                disabled={isGenerating || !aiPrompt}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/10 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                id="btn-trigger-ai-generator"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Redigindo Artigo...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Gerar Artigo com IA</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-1.5 text-[10px] text-slate-500 leading-normal" id="ai-panel-notice">
              <span className="font-semibold text-slate-400 block">💡 Como funciona:</span>
              <p>
                A IA vai criar um título chamativo para redes sociais, um resumo, e um artigo estruturado focado no seu negócio de manutenção. Ao finalizar, o editor de textos será aberto para você revisar e salvar!
              </p>
            </div>
          </div>

        </div>
      )}

      {/* Modal de Confirmação de Exclusão (Funciona 100% no Iframe) */}
      {postToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-display font-bold text-lg text-white mb-2">Excluir Publicação?</h3>
            <p className="text-slate-400 text-sm mb-6">
              Tem certeza que deseja excluir esta publicação definitivamente? Esta ação removerá o artigo do site e do banco de dados e não pode ser desfeita.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setPostToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  const id = postToDelete;
                  setPostToDelete(null);
                  await handleDelete(id);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
