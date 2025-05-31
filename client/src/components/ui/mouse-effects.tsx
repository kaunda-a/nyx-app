import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface MouseEffectProps {
  trailLength?: number;
  trailColor?: string;
  clickEffect?: boolean;
  glowEffect?: boolean;
  pressureEffect?: boolean;
}

export const MouseEffect: React.FC<MouseEffectProps> = ({
  trailLength = 20,
  trailColor = '#6366f1',
  clickEffect = true,
  glowEffect = true,
  pressureEffect = true,
}) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [trailPoints, setTrailPoints] = useState<{ x: number; y: number }[]>([]);
  const [pressure, setPressure] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controls = useAnimation();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const newPos = { x: e.clientX, y: e.clientY };
      setMousePos(newPos);
      
      setTrailPoints(prev => {
        const updated = [newPos, ...prev.slice(0, trailLength - 1)];
        return updated;
      });

      if (pressureEffect && (e as any).pressure) {
        setPressure((e as any).pressure);
      }
    };

    const handleClick = async (e: MouseEvent) => {
      if (clickEffect) {
        await controls.start({
          scale: [1, 2, 1],
          opacity: [0.7, 0, 0],
          transition: { duration: 0.5 }
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
    };
  }, [trailLength, clickEffect, pressureEffect]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderFrame = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // Draw trail
      trailPoints.forEach((point, i) => {
        const opacity = 1 - (i / trailLength);
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3 * (pressure + 0.5), 0, Math.PI * 2);
        ctx.fillStyle = `${trailColor}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();
      });

      // Draw glow effect
      if (glowEffect) {
        ctx.beginPath();
        const gradient = ctx.createRadialGradient(
          mousePos.x, mousePos.y, 0,
          mousePos.x, mousePos.y, 30
        );
        gradient.addColorStop(0, `${trailColor}33`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.arc(mousePos.x, mousePos.y, 30, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(renderFrame);
    };

    renderFrame();
  }, [mousePos, trailPoints, trailColor, glowEffect, pressure]);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          width: '100vw',
          height: '100vh',
          zIndex: 9999,
        }}
        width={window.innerWidth}
        height={window.innerHeight}
      />
      {clickEffect && (
        <motion.div
          animate={controls}
          style={{
            position: 'fixed',
            left: mousePos.x - 20,
            top: mousePos.y - 20,
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: trailColor,
            pointerEvents: 'none',
            zIndex: 9998,
          }}
        />
      )}
    </>
  );
};