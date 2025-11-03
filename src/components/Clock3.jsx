import { useEffect, useRef, useState } from 'react';

const Clock3 = () => {
  const [time, setTime] = useState(new Date());
  const [touchCount, setTouchCount] = useState(0);
  const [isStopped, setIsStopped] = useState(false);
  const [fadeProgress, setFadeProgress] = useState(0);
  const animationRef = useRef(null);
  const maxTouches = 5;

  // Update time
  useEffect(() => {
    if (isStopped) return;
    
    const interval = setInterval(() => {
      setTime(new Date());
    }, 100);

    return () => clearInterval(interval);
  }, [isStopped]);

  // Animate fade to grayscale
  useEffect(() => {
    if (!isStopped || fadeProgress >= 1) return;

    const startTime = Date.now();
    const duration = 3000; // 3 seconds

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setFadeProgress(progress);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isStopped, fadeProgress]);

  const handleTouch = (e) => {
    e.stopPropagation(); // Prevent navigation swipe
    if (isStopped) return;

    const newCount = touchCount + 1;
    setTouchCount(newCount);

    if (newCount >= maxTouches) {
      setIsStopped(true);
    }
  };

  const formatTime = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const getTouchIndicators = () => {
    return Array.from({ length: maxTouches }, (_, i) => (
      <div
        key={i}
        className={`w-3 h-3 rounded-full transition-all duration-300 ${
          i < touchCount 
            ? 'bg-black scale-100' 
            : 'bg-gray-300 scale-75'
        }`}
      />
    ));
  };

  return (
    <div 
      className="relative w-screen h-screen bg-white flex items-center justify-center cursor-pointer select-none"
      onClick={handleTouch}
      onTouchStart={handleTouch}
      style={{
        filter: `
          grayscale(${fadeProgress * 100}%)
          brightness(${1 - fadeProgress * 0.3})
        `
      }}
    >
      {/* Vignette effect */}
      {isStopped && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle, transparent 40%, rgba(0,0,0,${fadeProgress * 0.5}) 100%)`,
            opacity: fadeProgress
          }}
        />
      )}

      <div className="relative z-10 flex flex-col items-center gap-8">
        <div 
          className="font-bold tracking-[0.3em] transition-all duration-300"
          style={{
            fontSize: 'clamp(2rem, 12vw, 10rem)',
            fontFamily: "'Orbitron', 'Courier New', monospace",
            letterSpacing: '0.2em',
            maxWidth: '90vw',
            opacity: isStopped ? 0.7 : 1,
            transform: isStopped ? 'scale(0.95)' : 'scale(1)',
            textShadow: '0 0 20px rgba(0, 0, 0, 0.3)'
          }}
        >
          {formatTime(time)}
        </div>

        {/* Touch counter indicators */}
        <div className="flex gap-3 opacity-60">
          {getTouchIndicators()}
        </div>
      </div>
    </div>
  );
};

export default Clock3;
