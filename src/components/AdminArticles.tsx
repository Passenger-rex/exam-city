import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, getDocs, orderBy, query, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { Plus, Trash2, Edit2, Check, X, FileText, Image as ImageIcon, ExternalLink } from "lucide-react";

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: string;
  category: string;
  image: string;
  createdAt: any;
}

export function AdminArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    author: "",
    category: "News",
    image: ""
  });

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const q = query(collection(db, "articles"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() } as Article)));
    } catch (err) {
      console.error(err);
    }
  };

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content) return;
    setStatus("Saving...");
    try {
      const payload = {
        ...formData,
        slug: formData.slug || generateSlug(formData.title),
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, "articles", editingId), payload);
        setStatus("Article updated!");
      } else {
        await addDoc(collection(db, "articles"), {
          ...payload,
          createdAt: serverTimestamp(),
          views: 0
        });
        setStatus("Article added!");
      }
      
      setFormData({ title: "", slug: "", content: "", excerpt: "", author: "", category: "News", image: "" });
      setEditingId(null);
      setIsAdding(false);
      fetchArticles();
    } catch (err: any) {
      setStatus("Error: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this article?")) return;
    try {
      await deleteDoc(doc(db, "articles", id));
      fetchArticles();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (article: Article) => {
    setFormData({
      title: article.title,
      slug: article.slug,
      content: article.content,
      excerpt: article.excerpt,
      author: article.author || "",
      category: article.category || "News",
      image: article.image || ""
    });
    setEditingId(article.id);
    setIsAdding(true);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black">Article Management</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">Publish educational news and study updates.</p>
        </div>
        <button 
          onClick={() => { setIsAdding(!isAdding); setEditingId(null); setFormData({ title: "", slug: "", content: "", excerpt: "", author: "", category: "News", image: "" }); }}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:scale-105 transition-all"
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isAdding ? "Cancel" : "New Article"}
        </button>
      </div>

      {status && (
        <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-2xl text-sm font-bold border border-indigo-100 dark:border-indigo-900/40">
          {status}
        </div>
      )}

      {isAdding && (
        <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-neutral-400">Title</label>
              <input 
                type="text" 
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value, slug: generateSlug(e.target.value) })}
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="JAMB 2026 Updates..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-neutral-400">Slug</label>
              <input 
                type="text" 
                value={formData.slug}
                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-neutral-400">Category</label>
              <select 
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option>News</option>
                <option>Admission</option>
                <option>Study Tips</option>
                <option>JAMB</option>
                <option>WAEC</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-neutral-400">Author</label>
              <input 
                type="text" 
                value={formData.author}
                onChange={e => setFormData({ ...formData, author: e.target.value })}
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-neutral-400">Featured Image URL</label>
            <div className="flex gap-4">
              <div className="flex-1">
                <input 
                  type="text" 
                  value={formData.image}
                  onChange={e => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://..."
                />
              </div>
              {formData.image && (
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-neutral-200">
                  <img src={formData.image} className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-neutral-400">Excerpt (Short Summary)</label>
            <textarea 
              value={formData.excerpt}
              onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
              placeholder="Short description for list view..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-neutral-400">Content (Markdown Supported)</label>
            <textarea 
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 min-h-[400px] font-mono text-sm leading-relaxed"
              placeholder="Use markdown. Double newlines for paragraphs."
            />
          </div>

          <button 
            onClick={handleSave}
            className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/20 hover:scale-102 transition-all"
          >
            {editingId ? "Update Article" : "Publish Article"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map(article => (
          <div key={article.id} className="group relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 transition-all p-4">
            <div className="aspect-video rounded-2xl bg-neutral-100 dark:bg-neutral-950 overflow-hidden mb-4 relative">
              {article.image ? (
                <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-300">
                  <ImageIcon className="w-12 h-12" />
                </div>
              )}
              <div className="absolute top-2 right-2 flex gap-2">
                <button onClick={() => handleEdit(article)} className="p-2 bg-white/90 dark:bg-neutral-800/90 rounded-lg text-indigo-600 shadow-sm hover:scale-110 transition-all">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(article.id)} className="p-2 bg-white/90 dark:bg-neutral-800/90 rounded-lg text-red-600 shadow-sm hover:scale-110 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-md">
                  {article.category}
                </span>
                <span className="text-[10px] text-neutral-400 font-bold">
                  {article.createdAt?.toDate ? article.createdAt.toDate().toLocaleDateString() : "Draft"}
                </span>
              </div>
              <h3 className="font-bold text-lg line-clamp-1">{article.title}</h3>
              <p className="text-neutral-500 text-xs line-clamp-2 leading-relaxed">
                {article.excerpt}
              </p>
              <div className="pt-4 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                    <FileText className="w-3 h-3 text-neutral-400" />
                  </div>
                  <span className="text-[10px] font-bold text-neutral-400">{article.author || "Admin"}</span>
                </div>
                <a href={`/articles/${article.slug}`} target="_blank" className="flex items-center gap-1 text-[10px] font-black text-indigo-600 hover:underline">
                  VIEW <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
