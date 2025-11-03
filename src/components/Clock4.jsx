import { useEffect, useRef, useState } from 'react';
import ClockCanvas from './ClockCanvas';

const Clock4 = () => {
  const [time, setTime] = useState(new Date());
  const [isFrozen, setIsFrozen] = useState(false);
  const [blackProgress, setBlackProgress] = useState(0);
  const [touchPoint, setTouchPoint] = useState({ x: 0.5, y: 0.5 });
  const [isTouching, setIsTouching] = useState(false);
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
    const retreatDuration = 2000; // 2 seconds to retreat
    let startTime = Date.now();
    let startProgress = blackProgress;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      
      if (isTouching) {
        // Expand darkness while touching
        const progress = Math.min(startProgress + (elapsed / duration), 1);
        setBlackProgress(progress);
        
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      } else {
        // Retreat darkness when released
        const progress = Math.max(startProgress - (elapsed / retreatDuration), 0);
        setBlackProgress(progress);
        
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
  }, [isTouching]);

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
      
      // Calculate distances from edges to touch point
      const distFromLeft = touchX;
      const distFromRight = width - touchX;
      const distFromTop = touchY;
      const distFromBottom = height - touchY;
      
      // Get the maximum distance from any edge (how far blackness needs to travel)
      const maxEdgeDistance = Math.max(distFromLeft, distFromRight, distFromTop, distFromBottom);
      
      // Current spread distance from edges (starts immediately from edges)
      const currentSpread = maxEdgeDistance * blackProgress;

      // Create pixelated/grainy effect - process in larger blocks for performance
      const pixelSize = 3; // Size of each "grain"
      const time = Date.now() * 0.001; // For animation at touch point
      
      for (let y = 0; y < height; y += pixelSize) {
        for (let x = 0; x < width; x += pixelSize) {
          // Calculate minimum distance from this pixel to any edge
          const distToLeftEdge = x;
          const distToRightEdge = width - x;
          const distToTopEdge = y;
          const distToBottomEdge = height - y;
          
          const minDistToEdge = Math.min(
            distToLeftEdge,
            distToRightEdge,
            distToTopEdge,
            distToBottomEdge
          );
          
          // Calculate distance from this pixel to touch point
          const dx = x - touchX;
          const dy = y - touchY;
          const distToTouch = Math.sqrt(dx * dx + dy * dy);
          
          // Add noise for grainy effect
          const noise = (Math.random() - 0.5) * 40;
          
          // Pixel is black if it's close enough to an edge that the blackness has reached it
          // OR if we're at full coverage and near touch point (with animation)
          let shouldBeBlack = false;
          
          if (minDistToEdge <= currentSpread + noise) {
            // Check if this pixel has been reached by the spread from edges toward touch
            // The closer to touch point, the later it gets consumed
            const progressTowardTouch = (maxEdgeDistance - distToTouch) / maxEdgeDistance;
            const spreadProgress = (currentSpread - minDistToEdge) / (maxEdgeDistance - minDistToEdge);
            
            if (spreadProgress >= 1 - progressTowardTouch) {
              shouldBeBlack = true;
            }
          }
          
          // At the touch point when everything is consumed, add moving animation
          if (blackProgress > 0.95 && distToTouch < 100) {
            const angle = Math.atan2(dy, dx);
            const wave = Math.sin(angle * 3 + time * 3) * 15;
            const animatedDist = distToTouch + wave + noise;
            
            if (animatedDist > 20) {
              shouldBeBlack = true;
            } else {
              shouldBeBlack = false; // Keep a small animated area around touch
            }
          }
          
          if (shouldBeBlack) {
            ctx.fillStyle = 'rgb(0, 0, 0)';
            ctx.fillRect(x, y, pixelSize, pixelSize);
          }
          
          // Add chromatic aberration at the boundary
          if (!shouldBeBlack && minDistToEdge <= currentSpread + 50 && blackProgress > 0.1) {
            const edgeProximity = (50 - Math.abs(minDistToEdge - currentSpread)) / 50;
            if (edgeProximity > 0 && Math.random() > 0.6) {
              if (Math.random() > 0.5) {
                ctx.fillStyle = `rgba(255, 0, 0, ${edgeProximity * 0.4})`;
              } else {
                ctx.fillStyle = `rgba(0, 255, 255, ${edgeProximity * 0.3})`;
              }
              ctx.fillRect(x, y, pixelSize, pixelSize);
            }
          }
        }
      }
    }
    
    // Continue animating if blackProgress is high (to animate the touch point)
    if (blackProgress > 0.95 && isTouching) {
      const animateFrame = requestAnimationFrame(() => {
        // Trigger re-render
        setBlackProgress(prev => prev);
      });
      return () => cancelAnimationFrame(animateFrame);
    }
  }, [blackProgress, touchPoint, isTouching]);

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
  };

  const handleTouchEnd = (e) => {
    e.stopPropagation(); // Prevent navigation swipe
    setIsTouching(false);
  };

  const formatTime = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ms = String(Math.floor(date.getMilliseconds() / 10)).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}.${ms}`;
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
        className="relative z-10 text-8xl font-mono tracking-wider transition-all duration-300"
        style={{
          opacity: blackProgress > 0.7 ? 1 - (blackProgress - 0.7) / 0.3 : 1,
          filter: blackProgress > 0.5 ? `blur(${(blackProgress - 0.5) * 10}px)` : 'none'
        }}
      >
        {formatTime(time)}
      </div>
    </div>
  );
};

export default Clock4;
