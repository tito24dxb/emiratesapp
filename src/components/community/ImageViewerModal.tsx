import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, Heart, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageViewerModalProps {
  imageUrl?: string;
  imageUrls?: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  onDoubleClick?: () => void;
}

export default function ImageViewerModal({
  imageUrl,
  imageUrls,
  initialIndex = 0,
  isOpen,
  onClose,
  onDoubleClick
}: ImageViewerModalProps) {
  const images = imageUrls && imageUrls.length > 0 ? imageUrls : imageUrl ? [imageUrl] : [];
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showHeart, setShowHeart] = useState(false);
  const [isHighRes, setIsHighRes] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const doubleTapTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setCurrentIndex(initialIndex);
    } else {
      document.body.style.overflow = 'unset';
      setIsHighRes(false);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialIndex]);

  const handleTouchStart = () => {
    longPressTimerRef.current = setTimeout(() => {
      setIsHighRes(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleImageClick = () => {
    setTapCount(prev => prev + 1);

    if (doubleTapTimerRef.current) {
      clearTimeout(doubleTapTimerRef.current);
    }

    doubleTapTimerRef.current = setTimeout(() => {
      if (tapCount + 1 === 2) {
        triggerHeartAnimation();
        onDoubleClick?.();
      }
      setTapCount(0);
    }, 300);
  };

  const handleDoubleClick = () => {
    triggerHeartAnimation();
    onDoubleClick?.();
  };

  const triggerHeartAnimation = () => {
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 1000);
  };

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setIsHighRes(false);
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setIsHighRes(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
          onClick={onClose}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {isHighRes && (
            <div className="absolute top-4 left-4 z-50 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white text-sm font-bold flex items-center gap-2">
              <ZoomIn className="w-4 h-4" />
              High Resolution
            </div>
          )}

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative max-w-7xl max-h-[90vh] w-full mx-4"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleTouchStart}
            onMouseUp={handleTouchEnd}
            onMouseLeave={handleTouchEnd}
          >
            {images.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-50 w-14 h-14 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center transition backdrop-blur-sm"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>

                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-50 w-14 h-14 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center transition backdrop-blur-sm"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>

                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-bold">
                  {currentIndex + 1} / {images.length}
                </div>
              </>
            )}

            <AnimatePresence mode="wait">
              <motion.img
                key={currentIndex}
                src={images[currentIndex]}
                alt={`Image ${currentIndex + 1}`}
                className={`w-full h-full object-contain rounded-lg cursor-pointer select-none ${
                  isHighRes ? 'scale-150 transition-transform duration-300' : ''
                }`}
                onClick={handleImageClick}
                onDoubleClick={handleDoubleClick}
                draggable={false}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </AnimatePresence>

            <AnimatePresence>
              {showHeart && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <Heart className="w-32 h-32 text-red-500 fill-red-500 drop-shadow-2xl" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm opacity-70 text-center max-w-xl px-4">
            <p>Tap once to view • Double tap to like • Hold to zoom{images.length > 1 ? ' • Arrows to navigate' : ''}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
