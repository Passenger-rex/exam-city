import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { motion } from "motion/react";
import { Calendar, User, Tag, ChevronLeft, Share2, Clock, Check } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import { Helmet } from "react-helmet-async";
import { Navbar } from "../components/Navbar";
import { InArticleAd } from "../components/InArticleAd";
import { Skeleton } from "../components/Skeleton";
import { Logo } from "../components/Logo";
import { ArticleComments } from "../components/ArticleComments";
import { ArticleReactions } from "../components/ArticleReactions";
import { TableOfContents } from "../components/TableOfContents";

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
  views: number;
}

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [isShared, setIsShared] = useState(false);

  useEffect(() => {
    const init = async () => {
      let currentArticle: Article | null = null;
      const fetchArticle = async () => {
        try {
          const q = query(collection(db, "articles"), where("slug", "==", slug), limit(1));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const docData = snap.docs[0];
            currentArticle = { id: docData.id, ...docData.data() } as Article;
            setArticle(currentArticle);
          }
        } catch (err) {
          console.error("Error fetching article:", err);
        }
      };

      const fetchRecent = async () => {
        try {
          const q = query(collection(db, "articles"), orderBy("createdAt", "desc"), limit(5));
          const snap = await getDocs(q);
          setRecentArticles(snap.docs.map(d => ({ id: d.id, ...d.data() } as Article)));
        } catch (err) {
          console.error("Error fetching recent articles:", err);
        }
      };

      await fetchArticle();
      
      const fetchRelated = async () => {
        if (!currentArticle) return;
        try {
          // Fetch articles in the same category
          const q = query(
            collection(db, "articles"), 
            where("category", "==", currentArticle.category), 
            limit(4)
          );
          const snap = await getDocs(q);
          const related = snap.docs
            .map(d => ({ id: d.id, ...d.data() } as Article))
            .filter(a => a.id !== currentArticle?.id) // exclude current
            .slice(0, 3); // limit to 3 visually
          setRelatedArticles(related);
        } catch (err) {
          console.error("Error fetching related articles:", err);
        }
      };

      await Promise.all([fetchRecent(), fetchRelated()]);
      setLoading(false);
    };

    init();
  }, [slug]);

  const handleShare = async () => {
    if (!article) return;
    
    const shareData = {
      title: article.title,
      text: article.excerpt,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setIsShared(true);
        setTimeout(() => setIsShared(false), 2000);
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 md:px-6 pt-24 pb-20 fade-in">
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="flex-1 max-w-4xl space-y-6">
              <Skeleton className="h-4 w-32" />
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-3/4" />
              </div>
              <div className="flex gap-4 py-6 border-y border-outline-variant/30">
                 <Skeleton className="h-10 w-10 rounded-full" />
                 <div className="space-y-2 flex-1">
                   <Skeleton className="h-4 w-32" />
                   <Skeleton className="h-3 w-24" />
                 </div>
              </div>
              <Skeleton className="aspect-video w-full rounded-2xl" />
              <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-2/3" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-black mb-4">Article Not Found</h1>
        <p className="text-on-surface-variant mb-8">The news piece you're looking for might have moved.</p>
        <Link to="/articles" className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-lg">
          Back to News
        </Link>
      </div>
    );
  }

  // Split content logic: 2 paragraphs then Ad
  // Sanitize content: ensure space after hashtags for better markdown rendering
  // Remove unwanted skeletons like | |---|---|
  // Remove promotional CTAs that might be in the content
  const sanitizedContent = article.content
    .replace(/^(#+)([^\s#])/gm, '$1 $2')
    .replace(/\|\s*\|\s*---\s*\|\s*---\s*\|/g, '')
    .replace(/Ready to success in your exams\?[\s\S]*?CREATE FREE ACCOUNT/gi, '');
  
  const paragraphs = sanitizedContent.split(/\n\s*\n|\r\n\s*\r\n/).filter(p => p.trim().length > 0);
  const firstPart = paragraphs.slice(0, 2).join("\n\n");
  const secondPart = paragraphs.slice(2).join("\n\n");

  const formattedDate = article.createdAt?.toDate 
    ? article.createdAt.toDate().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-neutral-900 font-sans">
      <Helmet>
        <title>{article.title} - Exam City</title>
        <meta name="description" content={article.excerpt || `Read about ${article.title} on Exam City`} />
        {article.image && <meta property="og:image" content={article.image} />}
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.excerpt || `Read about ${article.title} on Exam City`} />
        <link rel="canonical" href={`https://examcity.qzz.io/articles/${article.slug}`} />
      </Helmet>
      
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-28 pb-20">
        <div className="flex flex-col lg:flex-row gap-10 items-start justify-center">
          {/* Main Content */}
          <article className="w-full lg:max-w-[800px] bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="p-6 md:p-12 lg:p-14">
              <nav className="flex items-center gap-2 mb-10 text-[11px] font-bold uppercase tracking-widest overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
                <Link to="/" className="text-neutral-400 hover:text-primary transition-colors">Home</Link>
                <span className="text-neutral-300">/</span>
                <Link to="/articles" className="text-neutral-400 hover:text-primary transition-colors">News Hub</Link>
                <span className="text-neutral-300">/</span>
                <span className="text-primary truncate max-w-[200px]">{article.category || "Education"}</span>
              </nav>

              <header className="mb-12">
                <div className="flex items-center gap-4 mb-8">
                  <span className="px-4 py-1.5 bg-primary/10 text-primary text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] rounded-full border border-primary/20">
                    {article.category || "Academic Bulletin"}
                  </span>
                  <div className="h-1 w-1 bg-neutral-300 rounded-full" />
                  <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    APPROX. 6 MIN READ
                  </div>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[44px] font-black text-neutral-900 leading-[1.1] mb-10 tracking-tight font-sans">
                  {article.title}
                </h1>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 pb-10 border-b border-neutral-100">
                  <div className="flex items-center gap-5">
                    <div className="relative group">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center bg-transparent overflow-hidden ring-4 ring-neutral-50 shadow-inner">
                        <img src="/examcity_no_bg.png" alt="Exam City Logo" className="w-full h-full object-contain p-1" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full" />
                    </div>
                    <div>
                      <div className="font-extrabold text-base text-neutral-900 leading-none">
                        {article.author || "Exam City Editorial"}
                      </div>
                      <div className="text-neutral-400 text-[13px] font-bold flex items-center gap-2 mt-2">
                        <Calendar className="w-3.5 h-3.5" />
                        PUBLISHED: {formattedDate}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block mr-2">
                      <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Spread the Word</div>
                      <div className="text-xs font-bold text-neutral-900">Share this update</div>
                    </div>
                    <button 
                      onClick={handleShare}
                      className="h-12 px-8 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-opacity-90 transition-all shadow-xl shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                    >
                      {isShared ? <Check className="w-4 h-4" /> : null}
                      {isShared ? "COPIED" : "Share Now"}
                    </button>
                    <button 
                      onClick={handleShare}
                      className="w-12 h-12 flex items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:text-primary transition-all"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </header>

              {article.image && (
                <figure className="mb-14 -mx-6 md:-mx-12 lg:-mx-14 border-y border-neutral-100">
                  <img src={article.image} alt={article.title} className="w-full h-auto max-h-[600px] object-cover" referrerPolicy="no-referrer" />
                </figure>
              )}

              <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 max-w-[1000px] mx-auto">
                <div className="flex-1 min-w-0">
                  <div className="prose prose-neutral max-w-none font-serif text-[18px] md:text-[20px] leading-[1.8] text-neutral-800 antialiased selection:bg-primary/20">
                    <Markdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw, rehypeSlug]}
                      components={{
                        image: ({ node, src, alt, caption, ...props }: any) => (
                          <figure className="my-8">
                            <img src={src} alt={alt || ""} className="w-full h-auto rounded-xl object-cover" referrerPolicy="no-referrer" {...props} />
                            {caption && <figcaption className="text-center text-sm font-sans font-bold text-neutral-500 mt-3">{caption}</figcaption>}
                          </figure>
                        ),
                        h1: ({ children, id }: any) => <h1 id={id} className="text-2xl md:text-3xl font-black font-sans mb-10 leading-tight tracking-tight text-neutral-900 border-l-8 border-primary pl-6 scroll-mt-28">{children}</h1>,
                        h2: ({ children, id }: any) => <h2 id={id} className="text-xl md:text-2xl font-black font-sans mt-16 mb-8 text-neutral-900 leading-tight scroll-mt-28">{children}</h2>,
                        h3: ({ children, id }: any) => <h3 id={id} className="text-lg md:text-xl font-bold font-sans mt-12 mb-6 text-neutral-900 scroll-mt-28">{children}</h3>,
                        p: ({ children }: any) => <p className="mb-10">{children}</p>,
                        ul: ({ children }: any) => <ul className="list-disc pl-8 mb-10 space-y-6 font-sans text-neutral-700 marker:text-primary">{children}</ul>,
                        ol: ({ children }: any) => <ol className="list-decimal pl-8 mb-10 space-y-6 font-sans text-neutral-700 marker:text-primary marker:font-black">{children}</ol>,
                        li: ({ children }: any) => <li className="pl-2">{children}</li>,
                        strong: ({ children }: any) => <strong className="font-extrabold text-neutral-900">{children}</strong>,
                        blockquote: ({ children }: any) => <blockquote className="border-l-4 border-primary pl-8 italic my-14 text-2xl md:text-3xl text-neutral-500 leading-relaxed bg-neutral-50/50 py-10 rounded-r-2xl font-serif">{children}</blockquote>,
                        a: ({ children, href }: any) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold underline decoration-blue-600/30 decoration-2 underline-offset-4 hover:decoration-blue-600 hover:text-blue-800 transition-colors">{children}</a>
                      }}
                    >
                      {firstPart}
                    </Markdown>
                    
                    <div className="my-16 flex flex-col items-center">
                      <div className="w-full h-px bg-neutral-100 mb-12" />
                      <div className="text-[10px] uppercase font-black text-neutral-400 mb-8 tracking-[0.3em] flex items-center gap-4">
                        <div className="w-12 h-px bg-neutral-100" />
                        ADVERTISEMENT
                        <div className="w-12 h-px bg-neutral-100" />
                      </div>
                      <div className="w-full flex justify-center py-4 bg-neutral-50/30 rounded-3xl border border-neutral-100">
                        <InArticleAd />
                      </div>
                      <div className="w-full h-px bg-neutral-100 mt-12" />
                    </div>
                    
                    <Markdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw, rehypeSlug]}
                      components={{
                        image: ({ node, src, alt, caption, ...props }: any) => (
                          <figure className="my-8">
                            <img src={src} alt={alt || ""} className="w-full h-auto rounded-xl object-cover" referrerPolicy="no-referrer" {...props} />
                            {caption && <figcaption className="text-center text-sm font-sans font-bold text-neutral-500 mt-3">{caption}</figcaption>}
                          </figure>
                        ),
                        h1: ({ children, id }: any) => <h1 id={id} className="text-2xl md:text-3xl font-black font-sans mb-10 leading-tight tracking-tight text-neutral-900 border-l-8 border-primary pl-6 scroll-mt-28">{children}</h1>,
                        h2: ({ children, id }: any) => <h2 id={id} className="text-xl md:text-2xl font-black font-sans mt-16 mb-8 text-neutral-900 leading-tight scroll-mt-28">{children}</h2>,
                        h3: ({ children, id }: any) => <h3 id={id} className="text-lg md:text-xl font-bold font-sans mt-12 mb-6 text-neutral-900 scroll-mt-28">{children}</h3>,
                        p: ({ children }: any) => <p className="mb-10">{children}</p>,
                        ul: ({ children }: any) => <ul className="list-disc pl-8 mb-10 space-y-6 font-sans text-neutral-700 marker:text-primary">{children}</ul>,
                        ol: ({ children }: any) => <ol className="list-decimal pl-8 mb-10 space-y-6 font-sans text-neutral-700 marker:text-primary marker:font-black">{children}</ol>,
                        li: ({ children }: any) => <li className="pl-2">{children}</li>,
                        strong: ({ children }: any) => <strong className="font-extrabold text-neutral-900">{children}</strong>,
                        blockquote: ({ children }: any) => <blockquote className="border-l-4 border-primary pl-8 italic my-14 text-2xl md:text-3xl text-neutral-500 leading-relaxed bg-neutral-50/50 py-10 rounded-r-2xl font-serif">{children}</blockquote>,
                        a: ({ children, href }: any) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold underline decoration-blue-600/30 decoration-2 underline-offset-4 hover:decoration-blue-600 hover:text-blue-800 transition-colors">{children}</a>
                      }}
                    >
                      {secondPart}
                    </Markdown>
                  </div>
                </div>

                <aside className="w-full lg:w-48 xl:w-64 flex-shrink-0 relative">
                  <TableOfContents content={article.content} />
                </aside>
              </div>

              <footer className="mt-16 pt-10 border-t border-neutral-100">
                <div className="flex flex-wrap gap-2 mb-10">
                  {article.tags && article.tags.length > 0 ? (
                    article.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-neutral-100 text-neutral-500 text-[10px] font-bold uppercase tracking-wider rounded border border-neutral-200">
                        #{tag}
                      </span>
                    ))
                  ) : (
                    ["EXAM NEWS", "CBT", "JAMB 2024", "ADMISSIONS"].map(tag => (
                      <span key={tag} className="px-3 py-1 bg-neutral-100 text-neutral-500 text-[10px] font-bold uppercase tracking-wider rounded border border-neutral-200">
                        #{tag}
                      </span>
                    ))
                  )}
                </div>
                
                <ArticleReactions articleId={article.id} />
                
                <div className="my-16 pt-8 border-t border-neutral-100">
                  <h4 className="font-black text-2xl text-neutral-900 mb-8 flex items-center justify-between">
                    <span>Read Next</span>
                    <Link to="/articles" className="text-[10px] sm:text-xs text-primary hover:underline font-bold uppercase tracking-[0.2em]">
                      View all
                    </Link>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {recentArticles.filter(a => a.id !== article.id).slice(0, 2).map((post) => (
                      <Link key={post.id} to={`/articles/${post.slug}`} className="group flex flex-col bg-neutral-50 hover:bg-white rounded-[2rem] border border-neutral-200 p-6 md:p-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                        <div className="text-[10px] font-black text-primary mb-3 uppercase tracking-widest bg-primary/10 w-fit px-3 py-1 rounded-full">{post.category || "News"}</div>
                        <h5 className="font-bold text-lg md:text-xl leading-[1.3] text-neutral-900 group-hover:text-primary transition-colors line-clamp-3 mb-4 flex-1">
                          {post.title}
                        </h5>
                        <div className="text-[11px] text-neutral-400 flex items-center gap-2 font-bold mt-auto pt-4 border-t border-neutral-200/60">
                           <Calendar className="w-3.5 h-3.5" />
                           {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' }) : "Recently"}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                <ArticleComments articleId={article.id} />
              </footer>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="w-full lg:w-[360px] space-y-8 sticky top-28">
            <div className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm">
              <h4 className="flex items-center justify-between font-black text-sm uppercase tracking-[0.15em] mb-8 pb-4 border-b border-neutral-100">
                <span>Recent Updates</span>
                <Link to="/articles" className="text-[10px] text-primary hover:underline">View All</Link>
              </h4>
              
              <div className="space-y-8">
                {recentArticles.filter(a => a.id !== article.id).slice(0, 5).map(post => (
                  <Link key={post.id} to={`/articles/${post.slug}`} className="group block">
                    <div className="text-[10px] font-black text-primary mb-2 uppercase tracking-widest">{post.category || "News"}</div>
                    <h5 className="font-bold text-[15px] leading-[1.4] text-neutral-900 group-hover:text-primary transition-colors decoration-2 line-clamp-2 mb-3">
                      {post.title}
                    </h5>
                    <div className="text-[11px] text-neutral-400 flex items-center gap-1.5 font-bold">
                       <Calendar className="w-3.5 h-3.5" />
                       {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : "Recently"}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
