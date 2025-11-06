import React, { useRef, useEffect } from 'react';

// Using theme colors for a "galaxy" feel
const THEME_COLORS_RGB = [
    '245, 158, 11', // amber
    '6, 182, 212',  // cyan
    '168, 85, 247', // purple
    '22, 163, 74',  // green
    '225, 29, 72',  // rose
    '99, 102, 241', // indigo
    '203, 213, 225', // slate-300 (for bright stars)
    '100, 116, 139', // slate-500
];

interface Particle {
    x: number;
    y: number;
    radius: number;
    vx: number;
    vy: number;
    color: string;
}

const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const particleCount = 100; // Reduced count for bigger, less cluttered feel

    const setCanvasSize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    const resetParticle = (p: Particle) => {
        p.radius = Math.random() * 3.5 + 1.5; // Bigger particles
        p.x = Math.random() * canvas.width;
        p.y = Math.random() * canvas.height;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 0.4 + 0.1; // Still slow, but with more variance
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        const colorRgb = THEME_COLORS_RGB[Math.floor(Math.random() * THEME_COLORS_RGB.length)];
        const opacity = Math.random() * 0.7 + 0.3;
        p.color = `rgba(${colorRgb}, ${opacity})`;
    }

    const createParticles = () => {
        particles = [];
        for (let i = 0; i < particleCount; i++) {
            const p = {} as Particle;
            resetParticle(p);
            particles.push(p);
        }
    }

    const animate = () => {
      // Clear the canvas completely on each frame for a transparent background
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap particles around the screen for a continuous galaxy effect
        if (p.x < -p.radius) p.x = canvas.width + p.radius;
        if (p.x > canvas.width + p.radius) p.x = -p.radius;
        if (p.y < -p.radius) p.y = canvas.height + p.radius;
        if (p.y > canvas.height + p.radius) p.y = -p.radius;
        
        // Add a glow effect to make them more star-like
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10; // Glow size
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
        setCanvasSize();
        createParticles();
    }

    setCanvasSize();
    createParticles();
    animate();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full -z-1 pointer-events-none" />;
};

export default ParticleBackground;