import { useState, useEffect, useRef } from 'react';
import Clock1 from './components/Clock1';
import Clock2 from './components/Clock2';
import Clock3 from './components/Clock3';

function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [currentClock, setCurrentClock] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [clock1BlackProgress, setClock1BlackProgress] = useState(0);
  const [clock1IsTouching, setClock1IsTouching] = useState(false);
  const containerRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const clocks = [
    { component: Clock1, title: 'The Moment' },
    { component: Clock2, title: 'The Resistance' },
    { component: Clock3, title: 'The End' }
  ];

  const handleTouchStart = (e) => {
    // Only handle navigation swipes on the container, not on clock interactions
    if (e.target.closest('.clock-container')) return;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (e.target.closest('.clock-container')) return;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (e.target.closest('.clock-container')) return;
    
    const swipeDistance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(swipeDistance) > minSwipeDistance && !isTransitioning) {
      if (swipeDistance > 0 && currentClock < clocks.length - 1) {
        // Swipe left - next clock
        navigateToClock(currentClock + 1);
      } else if (swipeDistance < 0 && currentClock > 0) {
        // Swipe right - previous clock
        navigateToClock(currentClock - 1);
      }
    }
  };

  const navigateToClock = (index) => {
    setIsTransitioning(true);
    setCurrentClock(index);
    setTimeout(() => setIsTransitioning(false), 800);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isTransitioning) return;
      
      if (e.key === 'ArrowRight' && currentClock < clocks.length - 1) {
        navigateToClock(currentClock + 1);
      } else if (e.key === 'ArrowLeft' && currentClock > 0) {
        navigateToClock(currentClock - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentClock, isTransitioning]);

  const CurrentClockComponent = clocks[currentClock].component;

  return (
    <div 
      className="relative w-screen h-screen overflow-hidden bg-white"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Intro Section */}
      {showIntro && (
        <div className="fixed inset-0 w-screen h-screen flex items-center justify-center bg-white z-50">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-4xl font-light tracking-wide" style={{ fontFamily: "'Orbitron', 'Courier New', monospace", marginBottom: '2rem' }}>
              Time Series
            </h1>
            <p className="text-base text-gray-700 italic max-w-[22ch] mx-auto leading-snug" style={{ marginBottom: '1.5rem' }}>
              This is an interactive artwork in the scope of the Presentists movement. Touch one of the buttons below and try to stop the present moment.
            </p>
            <p className="text-sm text-gray-500" style={{ marginBottom: '2rem' }}>Sasha Pashkov · 2025</p>
            <div className="flex space-x-6" style={{ marginBottom: '3rem' }}>
              <a href="https://www.instagram.com/pash_sash?igsh=MTI2ZnN1amR2NGw4ZQ%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer">
                <img src="/icons/instagram_icon.svg" alt="Instagram" className="w-6 h-6 opacity-60 hover:opacity-100 transition-opacity" />
              </a>
              <a href="https://t.me/senscillations" target="_blank" rel="noopener noreferrer">
                <img src="/icons/telegram_icon.svg" alt="Telegram" className="w-6 h-6 opacity-60 hover:opacity-100 transition-opacity" />
              </a>
            </div>
            
            {/* Navigation buttons */}
            <div className="flex gap-6">
            <button
              onClick={() => setShowIntro(true)}
              className="bg-black text-white font-bold flex items-center justify-center rounded-full transition-all duration-300 border-none"
              style={{
                fontFamily: "'Orbitron', 'Courier New', monospace",
                width: '7vw',
                height: '7vw',
                fontSize: '4vw',
                minWidth: '45px',
                minHeight: '45px',
                outline: 'none',
                border: 'none',
                WebkitTapHighlightColor: 'transparent',
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
                touchAction: 'manipulation'
              }}
            >
              I
            </button>
            {clocks.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setShowIntro(false);
                  setCurrentClock(index);
                }}
                className="bg-gray-300 text-gray-600 hover:bg-gray-400 font-bold flex items-center justify-center rounded-full transition-all duration-300 border-none"
                style={{
                  fontFamily: "'Orbitron', 'Courier New', monospace",
                  width: '5vw',
                  height: '5vw',
                  fontSize: '3vw',
                  opacity: 0.6,
                  minWidth: '35px',
                  minHeight: '35px',
                  outline: 'none',
                  border: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  WebkitTouchCallout: 'none',
                  WebkitUserSelect: 'none',
                  touchAction: 'manipulation'
                }}
              >
                {index + 1}
              </button>
            ))}
            </div>
          </div>
        </div>
      )}

      {/* Clock Display - only show when intro is hidden */}
      {!showIntro && (
        <div 
          className="absolute inset-0 transition-all duration-700 ease-in-out"
          style={{
            transform: `translateX(${-currentClock * 100}vw)`,
          }}
        >
        <div className="flex h-full">
          {clocks.map((clock, index) => {
            const ClockComp = clock.component;
            return (
              <div key={index} className="clock-container w-screen h-screen flex-shrink-0">
                {index === 0 ? (
                  <ClockComp 
                    onBlackProgressChange={setClock1BlackProgress}
                    onTouchingChange={setClock1IsTouching}
                  />
                ) : (
                  <ClockComp />
                )}
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* Navigation Numbers */}
      <div 
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-6 z-50 transition-opacity duration-300"
        style={{
          opacity: showIntro ? 0 : (currentClock === 0 && clock1IsTouching ? 0 : 1)
        }}
      >
        {/* Intro button */}
        <button
          onClick={() => setShowIntro(true)}
          className={`font-bold flex items-center justify-center rounded-full transition-all duration-300 ${
            showIntro 
              ? 'bg-black text-white border-none' 
              : 'bg-gray-300 text-gray-600 hover:bg-gray-400 border-none'
          }`}
          style={{
            fontFamily: "'Orbitron', 'Courier New', monospace",
            width: showIntro ? '7vw' : '5vw',
            height: showIntro ? '7vw' : '5vw',
            fontSize: showIntro ? '4vw' : '3vw',
            opacity: showIntro ? 1 : 0.6,
            minWidth: showIntro ? '45px' : '35px',
            minHeight: showIntro ? '45px' : '35px',
            outline: 'none',
            border: 'none',
            WebkitTapHighlightColor: 'transparent',
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            touchAction: 'manipulation'
          }}
        >
          I
        </button>

        {/* Clock buttons */}
        {clocks.map((_, index) => (
          <button
            key={index}
            onClick={() => !isTransitioning && navigateToClock(index)}
            className={`font-bold flex items-center justify-center rounded-full transition-all duration-300 ${
              !showIntro && index === currentClock 
                ? 'bg-black text-white border-none' 
                : 'bg-gray-300 text-gray-600 hover:bg-gray-400 border-none'
            }`}
            style={{
              fontFamily: "'Orbitron', 'Courier New', monospace",
              width: !showIntro && index === currentClock ? '7vw' : '5vw',
              height: !showIntro && index === currentClock ? '7vw' : '5vw',
              fontSize: !showIntro && index === currentClock ? '4vw' : '3vw',
              opacity: !showIntro && index === currentClock ? 1 : 0.6,
              minWidth: !showIntro && index === currentClock ? '45px' : '35px',
              minHeight: !showIntro && index === currentClock ? '45px' : '35px',
              outline: 'none',
              border: 'none',
              WebkitTapHighlightColor: 'transparent',
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
              touchAction: 'manipulation'
            }}
            aria-label={`Go to clock ${index + 1}`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;
