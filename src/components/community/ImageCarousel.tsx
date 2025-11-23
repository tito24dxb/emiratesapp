import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';

interface ImageCarouselProps {
  images: string[];
  onImageClick: (index: number) => void;
  onDoubleTap?: (index: number) => void;
}

interface HeartAnimation {
  id: number;
  x: number;
  y: number;
}

export default function ImageCarousel({ images, onImageClick, onDoubleTap }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hearts, setHearts] = useState<HeartAnimation[]>([]);

  const lastTapTimeRef = useRef<number>(0);
  const singleTapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tapCountRef = useRef<number>(0);
  const heartIdRef = useRef<number>(0);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const TAP_DELAY = 300;

  if (!images || images.length === 0) return null;

  const triggerHeartAnimation = useCallback((clientX: number, clientY: number, index: number) => {
    const container = imageContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const newHeart: HeartAnimation = {
      id: heartIdRef.current++,
      x,
      y
    };

    setHearts(prev => [...prev, newHeart]);

    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== newHeart.id));
    }, 1200);

    onDoubleTap?.(index);
  }, [onDoubleTap]);

  const handleImageTap = (e: React.MouseEvent | React.TouchEvent, index: number) => {
    e.stopPropagation();

    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;

    let clientX: number, clientY: number;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('changedTouches' in e && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    if (timeSinceLastTap < TAP_DELAY && timeSinceLastTap > 0) {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }

      triggerHeartAnimation(clientX, clientY, index);
      tapCountRef.current = 0;
    } else {
      tapCountRef.current = 1;

      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
      }

      singleTapTimerRef.current = setTimeout(() => {
        if (tapCountRef.current === 1) {
          onImageClick(index);
        }
        tapCountRef.current = 0;
      }, TAP_DELAY);
    }

    lastTapTimeRef.current = now;
  };

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(index);
  };

  if (images.length === 1) {
    return (
      <div
        ref={imageContainerRef}
        className="mb-3 md:mb-4 rounded-2xl overflow-hidden relative"
      >
        <img
          src={images[0]}
          alt="Post"
          className="w-full max-h-[300px] md:max-h-[500px] object-cover cursor-pointer hover:opacity-95 transition select-none"
          onClick={(e) => handleImageTap(e, 0)}
          onTouchEnd={(e) => handleImageTap(e, 0)}
          draggable={false}
        />

        <AnimatePresence>
          {hearts.map((heart) => (
            <motion.div
              key={heart.id}
              initial={{ scale: 0, opacity: 0, y: 0 }}
              animate={{
                scale: [0, 1.2, 1],
                opacity: [0, 1, 1, 0],
                y: [0, -40]
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1.2,
                ease: 'easeOut',
                times: [0, 0.2, 0.4, 1]
              }}
              className="absolute pointer-events-none z-10"
              style={{
                left: heart.x,
                top: heart.y,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <Heart
                className="w-16 h-16 md:w-20 md:h-20 text-red-500 fill-red-500"
                style={{
                  filter: 'drop-shadow(0 0 15px rgba(239, 68, 68, 0.8)) drop-shadow(0 0 30px rgba(239, 68, 68, 0.5))',
                  strokeWidth: 2
                }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div
      ref={imageContainerRef}
      className="mb-3 md:mb-4 rounded-2xl overflow-hidden relative group"
    >
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            src={images[currentIndex]}
            alt={`Post image ${currentIndex + 1}`}
            className="w-full max-h-[300px] md:max-h-[500px] object-cover cursor-pointer select-none"
            onClick={(e) => handleImageTap(e, currentIndex)}
            onTouchEnd={(e) => handleImageTap(e, currentIndex)}
            draggable={false}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
          />
        </AnimatePresence>

        <AnimatePresence>
          {hearts.map((heart) => (
            <motion.div
              key={heart.id}
              initial={{ scale: 0, opacity: 0, y: 0 }}
              animate={{
                scale: [0, 1.2, 1],
                opacity: [0, 1, 1, 0],
                y: [0, -40]
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1.2,
                ease: 'easeOut',
                times: [0, 0.2, 0.4, 1]
              }}
              className="absolute pointer-events-none z-10"
              style={{
                left: heart.x,
                top: heart.y,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <Heart
                className="w-16 h-16 md:w-20 md:h-20 text-red-500 fill-red-500"
                style={{
                  filter: 'drop-shadow(0 0 15px rgba(239, 68, 68, 0.8)) drop-shadow(0 0 30px rgba(239, 68, 68, 0.5))',
                  strokeWidth: 2
                }}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition opacity-0 group-hover:opacity-100 z-20"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition opacity-0 group-hover:opacity-100 z-20"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => goToSlide(index, e)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentIndex
                      ? 'w-8 bg-white'
                      : 'w-1.5 bg-white/50 hover:bg-white/75'
                  }`}
                />
              ))}
            </div>

            <div className="absolute top-3 right-3 bg-black/60 text-white text-sm font-bold px-3 py-1.5 rounded-full z-20">
              {currentIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
