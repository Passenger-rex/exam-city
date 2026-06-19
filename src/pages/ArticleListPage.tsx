import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, orderBy, getDocs, limit } from "firebase/firestore";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Calendar, User, ChevronRight, ChevronLeft, Search, LayoutGrid, List } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Skeleton } from "../components/Skeleton";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  author: string;
  category: string;
  image: string;
  tags?: string[];
  createdAt: any;
  views: number;
}

export default function ArticleListPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const init = async () => {
      const fetchArticles = async () => {
        try {
          const q = query(collection(db, "articles"), orderBy("createdAt", "desc"));
          const snap = await getDocs(q);
          setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() } as Article)));
        } catch (err) {
          console.error("Error fetching articles:", err);
        }
      };

      await fetchArticles();
      setLoading(false);
    };
    init();
  }, []);

  const filteredArticles = articles.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md overflow-x-hidden">
      <Navbar />
      
      {/* Hero Header */}
      <section className="pt-32 pb-12 px-6 bg-surface-dim/40 border-b border-outline-variant/30">
        <div className="max-w-7xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 hover:bg-white text-neutral-700 font-bold text-xs rounded-full transition-all mb-8 shadow-sm">
            <ChevronLeft className="w-3.5 h-3.5" />
            BACK TO HOME
          </Link>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-6xl font-black tracking-tight">
                Academic <span className="text-primary italic">Pulse</span>
              </h1>
            </div>
            <div className="w-full md:w-80 flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/60" />
                <input 
                  type="text"
                  placeholder="Search news..."
                  className="w-full pl-11 pr-4 py-3.5 bg-background border border-outline-variant rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none font-bold text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex p-1 bg-surface-dim rounded-xl border border-outline-variant/30">
                 <button 
                   onClick={() => setViewMode("grid")}
                   className={`flex-1 flex items-center justify-center py-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white shadow-sm ring-1 ring-outline-variant/30 text-primary" : "text-on-surface-variant"}`}
                 >
                   <LayoutGrid className="w-4 h-4" />
                 </button>
                 <button 
                   onClick={() => setViewMode("list")}
                   className={`flex-1 flex items-center justify-center py-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white shadow-sm ring-1 ring-outline-variant/30 text-primary" : "text-on-surface-variant"}`}
                 >
                   <List className="w-4 h-4" />
                 </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="flex flex-col">
                <Skeleton className="aspect-video w-full rounded-[2.5rem] mb-6" />
                <Skeleton className="h-4 w-1/4 rounded-full mb-3" />
                <Skeleton className="h-8 w-full rounded-lg mb-4" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-5/6 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="py-20 text-center">
            <h3 className="text-2xl font-bold mb-2">No articles found</h3>
            <p className="text-on-surface-variant">Try searching for something else like "Admission" or "JAMB".</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredArticles.map((article, idx) => (
              <motion.div 
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group flex flex-col"
              >
                <Link to={`/articles/${article.slug}`} className="block relative aspect-video rounded-[2.5rem] overflow-hidden mb-6 shadow-xl shadow-surface-dim group-hover:scale-102 transition-transform duration-500">
                  <img 
                    src={article.image || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=600"} 
                    alt={article.title} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-primary border border-white">
                      {article.category}
                    </span>
                  </div>
                </Link>
                <div className="flex items-center gap-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest mb-3">
                   <Calendar className="w-3 h-3" />
                   {article.createdAt?.toDate ? article.createdAt.toDate().toLocaleDateString() : "News"}
                   <span>•</span>
                   <span>5 min read</span>
                </div>
                <Link to={`/articles/${article.slug}`}>
                  <h3 className="text-xl md:text-2xl font-bold mb-3 leading-tight group-hover:text-primary transition-colors cursor-pointer">
                    {article.title}
                  </h3>
                </Link>
                <div className="flex flex-wrap gap-2 mb-4">
                  {article.tags?.slice(0, 3).map(tag => (
                    <span key={tag} className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">#{tag}</span>
                  ))}
                </div>
                <p className="text-on-surface-variant text-sm font-medium line-clamp-3 mb-6 leading-relaxed">
                  {article.excerpt}
                </p>
                <Link to={`/articles/${article.slug}`} className="mt-auto flex items-center gap-2 text-sm font-black text-primary hover:gap-3 transition-all">
                  READ FULL STORY <ChevronRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {filteredArticles.map((article, idx) => (
               <motion.div 
                key={article.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group flex flex-col md:flex-row gap-8 p-6 bg-surface-dim/30 border border-outline-variant/30 rounded-[2.5rem] hover:bg-white hover:shadow-xl transition-all"
               >
                 <Link to={`/articles/${article.slug}`} className="md:w-64 shrink-0 aspect-video md:aspect-square rounded-[2rem] overflow-hidden">
                   <img 
                    src={article.image || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=400"} 
                    alt={article.title} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                   />
                 </Link>
                 <div className="flex-1 flex flex-col py-2">
                   <div className="flex flex-wrap items-center gap-3 mb-4">
                     <span className="px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg">
                       {article.category}
                     </span>
                     <span className="text-[10px] font-bold text-on-surface-variant flex items-center gap-1.5">
                       <Calendar className="w-3 h-3" />
                       {article.createdAt?.toDate ? article.createdAt.toDate().toLocaleDateString() : "News"}
                     </span>
                   </div>
                   <Link to={`/articles/${article.slug}`}>
                     <h3 className="text-2xl font-black mb-2 group-hover:text-primary transition-colors">{article.title}</h3>
                   </Link>
                   <div className="flex flex-wrap gap-2 mb-4">
                     {article.tags?.slice(0, 4).map(tag => (
                       <span key={tag} className="text-[8px] font-black text-neutral-400 uppercase tracking-widest">#{tag}</span>
                     ))}
                   </div>
                   <p className="text-on-surface-variant text-sm font-medium line-clamp-2 md:line-clamp-3 mb-6 max-w-3xl leading-relaxed">
                     {article.excerpt}
                   </p>
                   <Link to={`/articles/${article.slug}`} className="mt-auto flex items-center gap-2 text-xs font-black text-primary hover:gap-3 transition-all cursor-pointer">
                      READ MORE <ChevronRight className="w-4 h-4" />
                   </Link>
                 </div>
               </motion.div>
            ))}
          </div>
        )}
      </main>

    </div>
  );
}
