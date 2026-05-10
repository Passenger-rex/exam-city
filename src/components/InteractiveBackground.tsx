import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimation } from 'motion/react';

export function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const hoverAnim = useRef(0); // 0 = space, 1 = graph

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const onResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', onResize);

    let time = 0;
    let animationFrameId: number;

    const render = () => {
      time += 0.01;

      const isDark = document.documentElement.classList.contains('dark');
      
      // Smoothly transition the hover value
      const targetHover = isHovered ? 1 : 0;
      hoverAnim.current += (targetHover - hoverAnim.current) * 0.05;
      const t = hoverAnim.current;

      ctx.clearRect(0, 0, width, height);

      // --- Mode 0: Deep Space Spirals (opacity = 1 - t) ---
      if (t < 0.99) {
        ctx.save();
        ctx.globalAlpha = 1 - t;
        const cx = width / 2;
        const cy = height / 2;

        // Draw deep space background
        ctx.fillStyle = isDark ? '#050510' : '#f9fafb';
        ctx.fillRect(0, 0, width, height);

        // Draw Spirals
        const drawSpiral = (color: string, offset: number, scale: number, frequency: number) => {
          ctx.beginPath();
          for (let i = 0; i < 400; i++) {
            const angle = 0.1 * i + time * frequency + offset;
            const radius = scale * i;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.stroke();
        };

        // Purple, emerald, blue spirals
        ctx.globalCompositeOperation = isDark ? 'screen' : 'multiply';
        drawSpiral('rgba(129, 51, 255, 0.4)', 0, 2, 1);     // Purple
        drawSpiral('rgba(16, 185, 129, 0.4)', Math.PI * 0.6, 2.5, 0.8);  // Emerald
        drawSpiral('rgba(59, 130, 246, 0.4)', Math.PI * 1.2, 1.8, 1.2);  // Blue

        // Pulse wave
        const maxRadius = Math.max(width, height);
        const pulseRadius = (time * 150) % maxRadius;
        ctx.beginPath();
        ctx.arc(cx, cy, pulseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = isDark 
          ? `rgba(129, 51, 255, ${Math.max(0, 1 - pulseRadius / maxRadius) * 0.5})`
          : `rgba(129, 51, 255, ${Math.max(0, 1 - pulseRadius / maxRadius) * 0.3})`;
        ctx.lineWidth = 20;
        ctx.stroke();

        ctx.restore();
      }

      // --- Mode 1: Interactive Grid Spotlight (opacity = t) ---
      if (t > 0.01) {
        ctx.save();
        ctx.globalAlpha = t;

        // Dark background for graph
        ctx.fillStyle = isDark ? '#020205' : '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Draw graph lines
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
        ctx.lineWidth = 1;
        const gridSize = 40;
        
        ctx.beginPath();
        for (let x = 0; x <= width; x += gridSize) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
        }
        for (let y = 0; y <= height; y += gridSize) {
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
        }
        ctx.stroke();

        // Spotlight effect
        const gradient = ctx.createRadialGradient(
          mousePos.x, mousePos.y, 0,
          mousePos.x, mousePos.y, 400
        );
        
        if (isDark) {
          gradient.addColorStop(0, 'rgba(129, 51, 255, 0.15)');
          gradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.05)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else {
          gradient.addColorStop(0, 'rgba(129, 51, 255, 0.1)');
          gradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.05)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        }

        ctx.globalCompositeOperation = isDark ? 'screen' : 'multiply';
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Highlight nearby grid intersections
        ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.2)';
        for (let x = 0; x <= width; x += gridSize) {
          for (let y = 0; y <= height; y += gridSize) {
            const dx = mousePos.x - x;
            const dy = mousePos.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 200) {
              const radius = 2 * (1 - dist / 200);
              ctx.beginPath();
              ctx.arc(x, y, radius, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isHovered, mousePos]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full -z-20 overflow-hidden pointer-events-auto cursor-crosshair"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
