import { useEffect, useRef, useState } from 'react';
import ClockCanvas from './ClockCanvas';

const Clock1 = ({ onBlackProgressChange, onTouchingChange }) => {
  // FEATURE FLAG: Set to true to enable timer shaking on touch
  const ENABLE_SHAKE = false;
  
  const [time, setTime] = useState(new Date());
  const [isFrozen, setIsFrozen] = useState(false);
  const [blackProgress, setBlackProgress] = useState(0);
  const [touchPoint, setTouchPoint] = useState({ x: 0.5, y: 0.5 });
  const [isTouching, setIsTouching] = useState(false);
  const [shakeKey, setShakeKey] = useState(0); // For forcing shake re-renders
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Update time
  useEffect(() => {
    if (isFrozen) return;
    
    const interval = setInterval(() => {
      setTime(new Date());
    }, 100);

    return () => clearInterval(interval);
  }, [isFrozen]);

  // Animate black overlay - expand when touching, retreat when released
  useEffect(() => {
    const duration = 5000; // 5 seconds to reach full darkness
    const retreatDuration = 500; // 0.5 seconds to retreat (10x faster)
    let startTime = Date.now();
    let startProgress = blackProgress;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      
      if (isTouching) {
        // Expand darkness while touching
        const progress = Math.min(startProgress + (elapsed / duration), 1);
        setBlackProgress(progress);
        if (onBlackProgressChange) onBlackProgressChange(progress);
        
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      } else {
        // Retreat darkness when released
        const progress = Math.max(startProgress - (elapsed / retreatDuration), 0);
        setBlackProgress(progress);
        if (onBlackProgressChange) onBlackProgressChange(progress);
        
        if (progress > 0) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          // Reset frozen state when darkness fully retreats
          setIsFrozen(false);
        }
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isTouching, onBlackProgressChange]);

  // Draw effect on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (blackProgress > 0) {
      const touchX = touchPoint.x * width;
      const touchY = touchPoint.y * height;
      
      // Calculate distances from touch point to all four corners
      const distToTopLeft = Math.sqrt(touchX * touchX + touchY * touchY);
      const distToTopRight = Math.sqrt((width - touchX) * (width - touchX) + touchY * touchY);
      const distToBottomLeft = Math.sqrt(touchX * touchX + (height - touchY) * (height - touchY));
      const distToBottomRight = Math.sqrt((width - touchX) * (width - touchX) + (height - touchY) * (height - touchY));
      
      // Find the farthest corner from the touch point
      const maxDistToCorner = Math.max(distToTopLeft, distToTopRight, distToBottomLeft, distToBottomRight);
      
      // The circle radius starts at maxDistToCorner (at the farthest corner)
      // and shrinks down to 0 (at touch point) as blackProgress goes from 0 to 1
      const currentRadius = maxDistToCorner * (1 - blackProgress);

      // Create pixelated/grainy effect - use larger chunks on bigger screens for better performance
      // Mobile (~400px wide): 3px chunks = ~18K pixels
      // Desktop (~1920px wide): 8px chunks = ~57K pixels (much better performance)
      const pixelSize = Math.max(3, Math.floor(width / 240)); // Scales with screen width
      
      for (let y = 0; y < height; y += pixelSize) {
        for (let x = 0; x < width; x += pixelSize) {
          // Calculate distance from this pixel to touch point
          const dx = x - touchX;
          const dy = y - touchY;
          const distToTouch = Math.sqrt(dx * dx + dy * dy);
          
          // Add noise for grainy effect
          const noise = (Math.random() - 0.5) * 40;
          
          // Pixel is black if it's outside the current radius (circle is shrinking toward touch)
          const shouldBeBlack = distToTouch > currentRadius + noise;
          
          if (shouldBeBlack) {
            // Black pixel block
            ctx.fillStyle = 'rgb(0, 0, 0)';
            ctx.fillRect(x, y, pixelSize, pixelSize);
          }
          
          // Add chromatic aberration at the exact same boundary as blackness
          // Check if pixel is near the boundary (within 80px)
          const distFromBoundary = distToTouch - currentRadius;
          if (distFromBoundary > -80 && distFromBoundary < 80 && blackProgress > 0.01) {
            const aberrationStrength = (1 - Math.abs(distFromBoundary) / 80);
            const rand = Math.random();
            if (rand > 0.7) {
              // Red edge - appears on both sides of boundary
              ctx.fillStyle = `rgba(255, 0, 0, ${aberrationStrength * 0.4})`;
              ctx.fillRect(x, y, pixelSize, pixelSize);
            } else if (rand > 0.4) {
              // Cyan edge - appears on both sides of boundary
              ctx.fillStyle = `rgba(0, 255, 255, ${aberrationStrength * 0.3})`;
              ctx.fillRect(x, y, pixelSize, pixelSize);
            }
          }
        }
      }
    }
  }, [blackProgress, touchPoint]);

  // Continuous re-render for shake animation while touching
  useEffect(() => {
    if (!isTouching || !ENABLE_SHAKE) return;

    const shakeInterval = setInterval(() => {
      // Force re-render by updating shake key
      setShakeKey(prev => prev + 1);
    }, 10); // Update every 10ms for faster shake (2x faster than 25ms)

    return () => clearInterval(shakeInterval);
  }, [isTouching, ENABLE_SHAKE]);

  const handleTouchStart = (e) => {
    e.stopPropagation(); // Prevent navigation swipe

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX || 0) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY || 0) - rect.top;

    setTouchPoint({
      x: x / rect.width,
      y: y / rect.height
    });

    setIsTouching(true);
    setIsFrozen(true);
    if (onTouchingChange) onTouchingChange(true);
  };

  const handleTouchEnd = (e) => {
    e.stopPropagation(); // Prevent navigation swipe
    setIsTouching(false);
    if (onTouchingChange) onTouchingChange(false);
  };

  const formatTime = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <div 
      className="relative w-screen h-screen bg-white flex items-center justify-center cursor-pointer select-none"
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <canvas 
        ref={canvasRef} 
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        width={typeof window !== 'undefined' ? window.innerWidth : 1920}
        height={typeof window !== 'undefined' ? window.innerHeight : 1080}
      />
      <div 
        className="relative z-10 font-bold tracking-[0.3em] transition-all duration-300"
        style={{
          fontSize: 'clamp(2rem, 12vw, 10rem)',
          fontFamily: "'Orbitron', 'Courier New', monospace",
          letterSpacing: '0.2em',
          maxWidth: '90vw',
          opacity: blackProgress > 0.7 ? 1 - (blackProgress - 0.7) / 0.3 : 1,
          filter: blackProgress > 0.5 ? `blur(${(blackProgress - 0.5) * 10}px)` : 'none',
          textShadow: '0 0 20px rgba(0, 0, 0, 0.3)',
          transform: (isTouching && ENABLE_SHAKE)
            ? `translate(${Math.sin(Date.now() * 0.02) * 2}%, ${Math.cos(Date.now() * 0.026) * 2}%)`
            : 'translate(0, 0)'
        }}
      >
        {formatTime(time)}
      </div>
    </div>
  );
};

export default Clock1;
