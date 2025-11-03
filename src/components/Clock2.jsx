import { useEffect, useRef, useState } from 'react';

const ENABLE_SHAKE = true;

const Clock2 = () => {
  const [virtualTime, setVirtualTime] = useState(0); // Virtual milliseconds since start
  const [timeScale, setTimeScale] = useState(1);
  const [isTouching, setIsTouching] = useState(false);
  const [shakeOffset, setShakeOffset] = useState({ x: 0, y: 0 });
  const [showGhostTimer, setShowGhostTimer] = useState(false);
  const [ghostShakeOffset, setGhostShakeOffset] = useState({ x: 0, y: 0 });
  const [ghostVerticalOffset, setGhostVerticalOffset] = useState(0);
  const [mainAberrationIntensity, setMainAberrationIntensity] = useState(1);
  const startTimeRef = useRef(Date.now());
  const lastUpdateRef = useRef(Date.now());
  const animationRef = useRef(null);
  const ghostTimerRef = useRef(null);

  // Update virtual time with timeScale
  useEffect(() => {
    const animate = () => {
      const now = Date.now();
      const realDelta = now - lastUpdateRef.current;
      const scaledDelta = realDelta * timeScale;
      lastUpdateRef.current = now;
      
      setVirtualTime(prev => prev + scaledDelta);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [timeScale]);

  // Shake effect when touching
  useEffect(() => {
    if (!ENABLE_SHAKE || !isTouching) {
      setShakeOffset({ x: 0, y: 0 });
      return;
    }

    const shakeInterval = setInterval(() => {
      const shakeAmount = 3; // 10% shake as in Clock1
      const offsetX = (Math.random() - 0.5) * 2 * shakeAmount;
      const offsetY = (Math.random() - 0.5) * 2 * shakeAmount;
      setShakeOffset({ x: offsetX, y: offsetY });
    }, 100); // Shake every 100ms

    return () => clearInterval(shakeInterval);
  }, [isTouching]);

  // Ghost timer effect - appears every 3 seconds while touching
  useEffect(() => {
    if (!isTouching) {
      setShowGhostTimer(false);
      if (ghostTimerRef.current) {
        clearInterval(ghostTimerRef.current);
      }
      return;
    }

    const ghostInterval = setInterval(() => {
      setShowGhostTimer(true);
      
      // Random vertical offset for ghost timer (higher or lower than main timer)
      const verticalRange = 15; // 15vh range
      const randomVerticalOffset = (Math.random() - 0.5) * 2 * verticalRange;
      setGhostVerticalOffset(randomVerticalOffset);
      
      // Ghost timer shake animation
      const ghostShakeInterval = setInterval(() => {
        const shakeAmount = 4; // Slightly more shake for ghost
        const offsetX = (Math.random() - 0.5) * 2 * shakeAmount;
        const offsetY = (Math.random() - 0.5) * 2 * shakeAmount;
        setGhostShakeOffset({ x: offsetX, y: offsetY });
      }, 80); // Faster shake for ghost

      // Hide ghost timer after 0.5 seconds
      setTimeout(() => {
        setShowGhostTimer(false);
        clearInterval(ghostShakeInterval);
        setGhostShakeOffset({ x: 0, y: 0 });
      }, 500);
    }, 2500); // Every 2.5 seconds

    ghostTimerRef.current = ghostInterval;

    return () => {
      clearInterval(ghostInterval);
      setShowGhostTimer(false);
    };
  }, [isTouching]);

  // Main timer aberration cycling - changes every 2 seconds while touching
  useEffect(() => {
    if (!isTouching) {
      setMainAberrationIntensity(1); // Reset to normal
      return;
    }

    const aberrationInterval = setInterval(() => {
      // Cycle between normal (1.0) and enhanced (2.5) aberration
      setMainAberrationIntensity(prev => prev === 1 ? 2.5 : 1);
    }, 2000); // Every 2 seconds

    return () => {
      clearInterval(aberrationInterval);
      setMainAberrationIntensity(1);
    };
  }, [isTouching]);

  const handleTouchStart = (e) => {
    e.stopPropagation(); // Prevent navigation swipe
    setIsTouching(true);
    setTimeScale(0.01); // Set to 1% speed when touching
  };

  const handleTouchEnd = (e) => {
    e.stopPropagation();
    setIsTouching(false);
    setTimeScale(1); // Return to normal speed when touch ends
  };

  const formatTime = (virtualMs) => {
    // Convert virtual time to current real time + virtual offset
    const currentRealTime = startTimeRef.current + virtualMs;
    const date = new Date(currentRealTime);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
  };

  // Generate shake transform
  const getShakeTransform = () => {
    return `translate(${shakeOffset.x}%, ${shakeOffset.y}%)`;
  };

  return (
    <div 
      className="relative w-screen h-screen bg-white flex items-center cursor-pointer select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      style={{ paddingLeft: '10vw' }}
    >
      {/* Main Timer */}
      <div 
        className="relative z-10 font-bold tracking-[0.3em] transition-all duration-300"
        style={{
          fontSize: 'clamp(2rem, 8vw, 6rem)',
          fontFamily: "'Orbitron', 'Courier New', monospace",
          letterSpacing: '0.2em',
          width: '90vw',
          textAlign: 'left',
          transform: getShakeTransform(),
          textShadow: isTouching 
            ? `${2 * mainAberrationIntensity}px 0 red, -${2 * mainAberrationIntensity}px 0 cyan, 0 0 ${20 * mainAberrationIntensity}px rgba(0, 0, 0, 0.3)`
            : '0 0 20px rgba(0, 0, 0, 0.3)'
        }}
      >
        {formatTime(virtualTime)}
      </div>

      {/* Ghost Timer - appears every 3 seconds while touching */}
      {showGhostTimer && (
        <div 
          className="absolute z-5 font-bold tracking-[0.3em]"
          style={{
            fontSize: 'clamp(6rem, 24vw, 18rem)', // 2x bigger than main timer
            fontFamily: "'Orbitron', 'Courier New', monospace",
            letterSpacing: '0.2em',
            width: '100vw',
            textAlign: 'center',
            opacity: 0.3, // More transparent
            top: `${50 + ghostVerticalOffset}vh`, // Random vertical position
            left: '0',
            transform: `translate(${ghostShakeOffset.x}%, ${ghostShakeOffset.y}%) translateY(-50%)`,
            textShadow: '8px 0 rgba(255,0,0,0.6), -8px 0 rgba(0,255,255,0.6), 4px 4px rgba(255,0,0,0.3), -4px -4px rgba(0,255,255,0.3), 0 0 40px rgba(0, 0, 0, 0.3)',
            pointerEvents: 'none' // Don't interfere with touch events
          }}
        >
          {formatTime(virtualTime)}
        </div>
      )}
    </div>
  );
};

export default Clock2;
