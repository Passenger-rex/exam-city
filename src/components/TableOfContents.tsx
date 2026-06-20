import React, { useEffect, useState } from "react";
import GithubSlugger from "github-slugger";

interface TOCItem {
  level: number;
  title: string;
  slug: string;
}

export function TableOfContents({ content }: { content: string }) {
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const slugger = new GithubSlugger();
    const lines = content.split('\n');
    const extractedHeadings: TOCItem[] = [];

    // Check if we are inside a code block
    let inCodeBlock = false;

    for (const line of lines) {
      if (line.match(/^```/)) {
        inCodeBlock = !inCodeBlock;
      }

      if (!inCodeBlock) {
        const match = line.match(/^(#{1,3})\s+(.+)$/);
        if (match) {
          const level = match[1].length;
          let title = match[2].trim();
          // Remove Markdown links
          title = title.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
          // Remove bold/italic markers
          title = title.replace(/(\*\*|__|\*|_)(.*?)\1/g, '$2');
          // Remove inline code
          title = title.replace(/`([^`]+)`/g, '$1');

          const slug = slugger.slug(title);
          extractedHeadings.push({ level, title, slug });
        }
      }
    }
    setHeadings(extractedHeadings);
  }, [content]);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "0px 0px -80% 0px" }
    );

    headings.forEach((heading) => {
      const el = document.getElementById(heading.slug);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-100 hidden md:block lg:sticky lg:top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-4">Table of Contents</h4>
      <ul className="space-y-3">
        {headings.map((item, idx) => (
          <li
            key={idx}
            className={`transition-colors ${
              item.level === 1 ? "ml-0" : item.level === 2 ? "ml-3" : "ml-6"
            }`}
          >
            <a
              href={`#${item.slug}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(item.slug);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                  // Add a little outline/highlight class if desired
                  setActiveId(item.slug);
                }
              }}
              className={`text-sm font-medium transition-colors block hover:text-primary ${
                activeId === item.slug ? "text-primary font-bold" : "text-neutral-500"
              }`}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
