import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, getDocs, orderBy, query, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { Plus, Trash2, Edit2, Check, X, FileText, Image as ImageIcon, ExternalLink, Wand2, Share2 } from "lucide-react";
import { motion } from "motion/react";

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: string;
  category: string;
  image: string;
  tags?: string[];
  createdAt: any;
}

export function AdminArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [cliffhanger, setCliffhanger] = useState("");
  const [cliffhangerPlatform, setCliffhangerPlatform] = useState("Instagram");
  const [cliffhangerModel, setCliffhangerModel] = useState("Groq");
  const [isGeneratingCliffhanger, setIsGeneratingCliffhanger] = useState(false);
  const [showCliffhangerModal, setShowCliffhangerModal] = useState(false);
  const [selectedArticleForCliffhanger, setSelectedArticleForCliffhanger] = useState<Article | null>(null);
  const [isShared, setIsShared] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    author: "",
    category: "News",
    image: "",
    tags: [] as string[]
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("Optimizing & Uploading image...");
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        setStatus("Image inserted!");
        setFormData((prev) => ({
          ...prev,
          content: prev.content + `\n\n![${file.name}](${dataUrl})\n\n`
        }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content) return;
    setStatus("Saving...");
    try {
      const payload = {
        title: formData.title,
        slug: formData.slug || generateSlug(formData.title),
        content: formData.content,
        excerpt: formData.excerpt,
        author: formData.author,
        category: formData.category,
        image: formData.image,
        tags: formData.tags,
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
      
      setFormData({ title: "", slug: "", content: "", excerpt: "", author: "", category: "News", image: "", tags: [] });
      setEditingId(null);
      setIsAdding(false);
      setTagInput("");
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
      image: article.image || "",
      tags: article.tags || []
    });
    setEditingId(article.id);
    setIsAdding(true);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim().toUpperCase())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim().toUpperCase()]
      });
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  const generateCliffhanger = async (article: Article, platform = cliffhangerPlatform, model = cliffhangerModel) => {
    setSelectedArticleForCliffhanger(article);
    setIsGeneratingCliffhanger(true);
    setShowCliffhangerModal(true);
    try {
      const res = await fetch("/api/social-cliffhanger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: article.title,
          excerpt: article.excerpt,
          url: `${window.location.origin}/articles/${article.slug}`,
          platform,
          model
        })
      });
      const data = await res.json();
      if (res.ok) {
        setCliffhanger(data.post);
      } else {
        setCliffhanger("Error generating Social Post: " + (data.error || "Unknown"));
      }
    } catch (err) {
      setCliffhanger("Failed to connect to AI server.");
    } finally {
      setIsGeneratingCliffhanger(false);
    }
  };

  const copyCliffhanger = () => {
    navigator.clipboard.writeText(cliffhanger);
    setIsShared(true);
    setTimeout(() => setIsShared(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-neutral-900">Article Management</h2>
          <p className="text-neutral-500 font-medium">Publish educational news, admission updates, and study guides.</p>
        </div>
        <button 
          onClick={() => { 
            setIsAdding(!isAdding); 
            setEditingId(null); 
            setFormData({ title: "", slug: "", content: "", excerpt: "", author: "Exam City Editorial", category: "News", image: "", tags: [] }); 
          }}
          className={`flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black text-sm tracking-widest transition-all shadow-xl ${
            isAdding 
              ? "bg-neutral-100 text-neutral-600 hover:bg-neutral-200" 
              : "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 shadow-indigo-500/20"
          }`}
        >
          {isAdding ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {isAdding ? "CANCEL EDITING" : "PUBLISH NEW ARTICLE"}
        </button>
      </div>

      {status && (
        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl text-sm font-black border border-indigo-100 flex items-center justify-between">
          <span>{status}</span>
          <button onClick={() => setStatus("")}><X className="w-4 h-4" /></button>
        </div>
      )}

      {isAdding && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-[2rem] border border-neutral-200 shadow-xl space-y-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Headline Title</label>
                  <input 
                    type="text" 
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value, slug: generateSlug(e.target.value) })}
                    className="w-full px-6 py-4 bg-neutral-50 border border-neutral-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-lg placeholder:text-neutral-300"
                    placeholder="JAMB 2026 Registration Dates Announced..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Section / Category</label>
                    <select 
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-6 py-4 bg-neutral-50 border border-neutral-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold cursor-pointer"
                    >
                      <option>News</option>
                      <option>Admission Updates</option>
                      <option>Higher Education</option>
                      <option>Primary & Secondary</option>
                      <option>Study Tips</option>
                      <option>JAMB Guide</option>
                      <option>WAEC / NECO</option>
                      <option>Post-UTME Info</option>
                      <option>Grants & Scholarships</option>
                      <option>Career Advice</option>
                      <option>Student Life</option>
                      <option>Technology & EdTech</option>
                      <option>Opinions & Editorials</option>
                      <option>Policy & Leadership</option>
                      <option>Educator's Corner</option>
                      <option>Interviews</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Byline Author</label>
                    <input 
                      type="text" 
                      value={formData.author}
                      onChange={e => setFormData({ ...formData, author: e.target.value })}
                      className="w-full px-6 py-4 bg-neutral-50 border border-neutral-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold placeholder:text-neutral-300"
                      placeholder="Exam City Editorial"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Short Teaser (Excerpt)</label>
                  <textarea 
                    value={formData.excerpt}
                    onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                    className="w-full px-6 py-4 bg-neutral-50 border border-neutral-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-sm min-h-[100px] leading-relaxed placeholder:text-neutral-300"
                    placeholder="Briefly describe what this article covers..."
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Detailed Content (Markdown Enabled)</label>
                    <label className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold cursor-pointer hover:bg-indigo-100 transition-colors">
                      <ImageIcon className="w-4 h-4" />
                      Insert Image
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                  <p className="text-[11px] font-bold text-neutral-500 mb-2">
                    Formatting tips: **<b>bold</b>** • *<i>italic</i>* • [Link Text](https://example.com) • # Heading 1
                  </p>
                  <div className="flex flex-col lg:flex-row gap-6 items-start">
                    <textarea 
                      value={formData.content}
                      onChange={e => setFormData({ ...formData, content: e.target.value })}
                      className="w-full lg:flex-1 px-6 py-4 bg-neutral-50 border border-neutral-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-sm leading-[1.8] min-h-[500px] placeholder:text-neutral-300"
                      placeholder="Write your article here. Supports strong, headers, lists, etc."
                    />
                    <div className="w-full lg:w-64 flex-shrink-0">
                      <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-100 max-h-[500px] overflow-y-auto">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-4">TOC Preview</h4>
                        <div className="text-sm font-medium text-neutral-600 space-y-2">
                           {formData.content.split('\n')
                             .filter(line => line.match(/^(#{1,3})\s+(.+)$/))
                             .map((line, idx) => {
                               const match = line.match(/^(#{1,3})\s+(.+)$/);
                               if (!match) return null;
                               const level = match[1].length;
                               const title = match[2].replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/(\*\*|__|\*|_)(.*?)\1/g, '$2').replace(/`([^`]+)`/g, '$1');
                               return (
                                 <div key={idx} className={`${level === 1 ? 'ml-0' : level === 2 ? 'ml-3' : 'ml-6'} truncate`}>
                                   {title}
                                 </div>
                               );
                             })}
                           {!formData.content.match(/^(#{1,3})\s+(.+)$/m) && (
                             <p className="text-neutral-400 italic font-normal text-xs">No headings found in content.</p>
                           )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white p-8 rounded-[2rem] border border-neutral-200 shadow-xl space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Featured Media URL</label>
                <input 
                  type="text" 
                  value={formData.image}
                  onChange={e => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-6 py-4 bg-neutral-50 border border-neutral-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-xs"
                  placeholder="Paste image link here..."
                />
                {formData.image && (
                  <div className="aspect-video w-full rounded-xl overflow-hidden border border-neutral-100 mt-4">
                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t border-neutral-50">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Search Engine URL Slug</label>
                <input 
                  type="text" 
                  value={formData.slug}
                  onChange={e => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-6 py-4 bg-neutral-50 border border-neutral-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-xs text-neutral-500"
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-neutral-50">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Article Metadata Tags</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addTag()}
                    className="flex-1 px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-xs"
                    placeholder="Add tag..."
                  />
                  <button 
                    onClick={addTag}
                    className="px-4 py-2 bg-neutral-900 text-white rounded-xl font-black text-[10px] uppercase transition-all active:scale-95"
                  >
                    ADD
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-lg border border-indigo-100">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                  {formData.tags.length === 0 && <span className="text-[10px] font-medium text-neutral-300 italic">No tags added yet</span>}
                </div>
              </div>
            </div>

            <button 
              onClick={handleSave}
              className="group w-full py-6 bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-3xl shadow-2xl shadow-indigo-500/30 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              <Check className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {editingId ? "COMMIT CHANGES" : "PUBLISH TO HUB"}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {articles.map(article => (
          <div key={article.id} className="group flex flex-col bg-white rounded-3xl border border-neutral-200 overflow-hidden hover:shadow-2xl hover:shadow-neutral-200 transition-all duration-300">
            <div className="aspect-[16/10] bg-neutral-50 overflow-hidden relative">
              {article.image ? (
                <img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-200">
                  <ImageIcon className="w-12 h-12" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex flex-col justify-end p-5 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-2 w-full mb-2">
                  <button 
                    onClick={() => generateCliffhanger(article)}
                    className="flex-1 h-10 bg-blue-600 text-white rounded-xl font-bold text-[10px] uppercase flex items-center justify-center gap-1 hover:bg-blue-700 transition-all scale-90 group-hover:scale-100"
                    title="Generate Social Cliffhanger"
                  >
                    <Wand2 className="w-3.5 h-3.5" /> POST
                  </button>
                </div>
                <div className="flex gap-2 w-full">
                  <button 
                    onClick={() => handleEdit(article)}
                    className="flex-1 h-10 bg-white text-neutral-900 rounded-xl font-bold text-[10px] uppercase flex items-center justify-center gap-1 hover:bg-indigo-500 hover:text-white transition-all scale-90 group-hover:scale-100"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> EDIT
                  </button>
                  <button 
                    onClick={() => handleDelete(article.id)}
                    className="w-10 h-10 bg-white/20 backdrop-blur-md text-white rounded-xl flex items-center justify-center hover:bg-red-500 transition-all scale-90 group-hover:scale-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-primary text-[9px] font-black uppercase tracking-widest rounded-lg shadow-sm border border-neutral-100">
                  {article.category}
                </span>
              </div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="font-bold text-neutral-900 leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-4 h-[2.8rem]">
                {article.title}
              </h3>
              <div className="flex items-center gap-2 mb-4">
                {article.tags?.slice(0, 2).map(tag => (
                   <span key={tag} className="text-[8px] font-black text-neutral-400 uppercase tracking-widest">#{tag}</span>
                ))}
              </div>
              <div className="mt-auto pt-4 border-t border-neutral-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center">
                    <FileText className="w-3 h-3 text-neutral-400" />
                  </div>
                  <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest truncate max-w-[80px]">
                    {article.author || "Editorial"}
                  </span>
                </div>
                <a href={`/articles/${article.slug}`} target="_blank" className="flex items-center gap-1.5 text-[9px] font-black text-indigo-600 hover:underline tracking-widest">
                  LIVE HUB <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCliffhangerModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-neutral-900/60 backdrop-blur-sm overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-3xl max-h-[85vh] shadow-2xl relative flex flex-col mx-auto"
          >
            <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-neutral-100 flex items-center justify-between shrink-0 bg-white z-10 rounded-t-3xl">
              <h3 className="font-black text-xl sm:text-2xl text-neutral-900 flex items-center gap-3">
                <Wand2 className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" /> AI SOCIAL CLIFFHANGER
              </h3>
              <button
                onClick={() => setShowCliffhangerModal(false)}
                className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-500" />
              </button>
            </div>
            
            <div className="p-6 sm:p-8 overflow-y-auto flex-1">
              {isGeneratingCliffhanger ? (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mb-6" />
                  <p className="font-bold text-lg text-neutral-600">Generating the perfect cliffhanger...</p>
                </div>
              ) : (
                <div className="space-y-6 sm:space-y-8">
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-2">
                    <div className="flex-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block">Target Platform</label>
                      <select 
                        value={cliffhangerPlatform}
                        onChange={(e) => setCliffhangerPlatform(e.target.value)}
                        className="w-full px-4 py-3 sm:py-4 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-neutral-800 transition-all cursor-pointer"
                      >
                        <option>Facebook</option>
                        <option>LinkedIn</option>
                        <option>Twitter / X</option>
                        <option>Instagram</option>
                        <option>Tumblr</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block">AI Model Provider</label>
                      <select 
                        value={cliffhangerModel}
                        onChange={(e) => setCliffhangerModel(e.target.value)}
                        className="w-full px-4 py-3 sm:py-4 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-neutral-800 transition-all cursor-pointer"
                      >
                        <option>Gemini</option>
                        <option>OpenAI</option>
                        <option>Groq</option>
                        <option>Anthropic</option>
                        <option>Mistral</option>
                        <option>Together</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="p-6 md:p-8 bg-neutral-50 rounded-2xl sm:rounded-3xl border border-neutral-200 shadow-inner">
                    <p className="text-neutral-800 font-serif text-base sm:text-lg leading-relaxed whitespace-pre-wrap text-left break-words">{cliffhanger}</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end items-stretch sm:items-center pt-2">
                    <button
                      onClick={() => selectedArticleForCliffhanger && generateCliffhanger(selectedArticleForCliffhanger)}
                      className="px-6 py-4 bg-white text-neutral-700 border border-neutral-200 font-black tracking-widest text-sm rounded-xl sm:rounded-2xl hover:bg-neutral-50 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 sm:gap-3 flex-1 sm:flex-none text-center"
                    >
                      <Wand2 className="w-5 h-5 shrink-0" /> <span className="whitespace-nowrap">REGENERATE</span>
                    </button>
                    <button
                      onClick={copyCliffhanger}
                      className="px-6 py-4 bg-indigo-600 text-white font-black tracking-widest text-sm rounded-xl sm:rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 sm:gap-3 flex-1 sm:flex-none text-center"
                    >
                      {isShared ? <Check className="w-5 h-5 shrink-0" /> : <Share2 className="w-5 h-5 shrink-0" />}
                      <span className="whitespace-nowrap">{isShared ? "COPIED TO CLIPBOARD" : "COPY POST"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

