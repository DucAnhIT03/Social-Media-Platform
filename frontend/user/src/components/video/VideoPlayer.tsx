'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Heart, Share2, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  video: {
    id: string;
    title: string;
    creator: string;
    views: string;
    videoUrl: string;
    thumbnail?: string;
  };
  onLike?: () => void;
  onShare?: () => void;
  onNavigate?: (direction: 'up' | 'down') => void;
  isLiked?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  onLike,
  onShare,
  onNavigate,
  isLiked = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showPrevButton, setShowPrevButton] = useState(false);
  const [showNextButton, setShowNextButton] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isHoveringProgress, setIsHoveringProgress] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset inactivity timer: after 4s without mouse activity, hide all controls
  const resetInactivityTimer = () => {
    setShowControls(true);
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }
    inactivityTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4000);
  };

  // Format time helper
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => {
      if (!isSeeking) {
        setCurrentTime(videoElement.currentTime);
      }
    };
    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);
    };
    const handleDurationChange = () => {
      setDuration(videoElement.duration);
    };

    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('durationchange', handleDurationChange);

    // Auto-play when video changes
    videoElement.play().catch(() => {
      // Ignore autoplay errors
    });

    return () => {
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('durationchange', handleDurationChange);
    };
  }, [video.id, isSeeking]);

  // Clear inactivity timer on unmount
  useEffect(() => {
    return () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
    };
  }, []);

  // Handle wheel scroll to navigate videos
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onNavigate) return;

    const handleWheel = (e: WheelEvent) => {
      // Prevent default scroll behavior
      e.preventDefault();
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Debounce scroll events
      scrollTimeoutRef.current = setTimeout(() => {
        const deltaY = e.deltaY;
        
        // Scroll down (positive deltaY) = next video
        // Scroll up (negative deltaY) = previous video
        // Threshold để tránh scroll nhạy quá
        if (Math.abs(deltaY) > 50) {
          if (deltaY > 0) {
            onNavigate('down');
          } else {
            onNavigate('up');
          }
        }
      }, 150);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [onNavigate]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVideoClick = () => {
    togglePlay();
    resetInactivityTimer();
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !progressBarRef.current) return;
    
    const progressBar = progressBarRef.current;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;
    
    if (!isNaN(newTime) && isFinite(newTime)) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleProgressBarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !isSeeking) return;
    
    const progressBar = progressBarRef.current;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;
    
    if (!isNaN(newTime) && isFinite(newTime)) {
      setCurrentTime(newTime);
    }
  };

  const handleProgressBarMouseDown = () => {
    setIsSeeking(true);
  };

  const handleProgressBarMouseUp = () => {
    if (!videoRef.current || !isSeeking) return;
    setIsSeeking(false);
    if (!isNaN(currentTime) && isFinite(currentTime)) {
      videoRef.current.currentTime = currentTime;
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden"
      onMouseMove={resetInactivityTimer}
      onMouseEnter={resetInactivityTimer}
      onMouseLeave={() => {
        if (inactivityTimeoutRef.current) {
          clearTimeout(inactivityTimeoutRef.current);
        }
        inactivityTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 4000);
      }}
    >
      <video
        ref={videoRef}
        src={video.videoUrl}
        poster={video.thumbnail}
        className="w-full h-full object-contain"
        loop
        playsInline
        onClick={handleVideoClick}
        onMouseMove={resetInactivityTimer}
      />

      {/* Progress Bar */}
      {showControls && (
        <div 
          className="absolute bottom-0 left-0 right-0 h-2 bg-black/30 cursor-pointer group z-20"
          onClick={handleProgressBarClick}
          onMouseDown={handleProgressBarMouseDown}
          onMouseMove={handleProgressBarMouseMove}
          onMouseUp={handleProgressBarMouseUp}
          onMouseEnter={() => setIsHoveringProgress(true)}
          onMouseLeave={() => {
            setIsHoveringProgress(false);
            if (isSeeking) {
              handleProgressBarMouseUp();
            }
          }}
        >
          <div 
            ref={progressBarRef}
            className="h-full bg-white/50 group-hover:bg-white/70 transition-colors relative"
          >
            <div 
              className="h-full bg-[#1877F2] transition-all"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
            {showControls && (
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#1877F2] rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`, transform: 'translate(-50%, -50%)' }}
              />
            )}
          </div>
        </div>
      )}

      {/* Video Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10">
        <div className={cn(
          "mb-2 transition-all duration-300",
          isHoveringProgress ? "mb-8" : "mb-2"
        )}>
          <h3 className="text-white font-semibold text-lg mb-1">{video.title}</h3>
          <p className="text-white/80 text-sm">
            {video.creator} · {video.views} views
          </p>
        </div>
      </div>

      {/* Time Display - Between video info and progress bar when hovering */}
      {showControls && (
        <div className={cn(
          "absolute left-4 flex items-center gap-2 text-white text-sm transition-all duration-300 z-20 bg-black/50 px-2 py-1 rounded",
          isHoveringProgress ? "bottom-2 opacity-100" : "bottom-2 opacity-0 pointer-events-none"
        )}>
          <span className="font-medium">{formatTime(currentTime)}</span>
          <span className="text-white/60">/</span>
          <span className="text-white/60">{formatTime(duration)}</span>
        </div>
      )}

      {/* Controls Overlay */}
      {showControls && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 text-white" />
            ) : (
              <Play className="w-8 h-8 text-white ml-1" />
            )}
          </button>
        </div>
      )}

      {/* Navigation Buttons - Only show when hovering over button area */}
      {onNavigate && showControls && (
        <>
          {/* Previous Video Button (Left Center) */}
          <div
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-16 h-16 flex items-center justify-center"
            onMouseEnter={() => setShowPrevButton(true)}
            onMouseLeave={() => setShowPrevButton(false)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate('up');
              }}
              className={cn(
                "w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all text-white shadow-lg",
                showPrevButton
                  ? "opacity-100 scale-100 hover:bg-white/30 hover:scale-110"
                  : "opacity-0 scale-90"
              )}
              aria-label="Video trước"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Next Video Button (Right Center) */}
          <div
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-16 h-16 flex items-center justify-center"
            onMouseEnter={() => setShowNextButton(true)}
            onMouseLeave={() => setShowNextButton(false)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate('down');
              }}
              className={cn(
                "w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all text-white shadow-lg",
                showNextButton
                  ? "opacity-100 scale-100 hover:bg-white/30 hover:scale-110"
                  : "opacity-0 scale-90"
              )}
              aria-label="Video tiếp theo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </>
      )}

      {/* Right Side Action Buttons */}
      {showControls && (
        <div className="absolute right-4 bottom-20 flex flex-col gap-4">
          <button
            onClick={onLike}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-full transition-colors",
              isLiked
                ? "text-red-500"
                : "text-white hover:bg-white/10"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              isLiked ? "bg-red-500/20" : "bg-white/10"
            )}>
              <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
            </div>
            <span className="text-xs text-white">1.2K</span>
          </button>

          <button
            onClick={onShare}
            className="flex flex-col items-center gap-1 p-2 rounded-full text-white hover:bg-white/10 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <span className="text-xs">Share</span>
          </button>

          <button className="flex flex-col items-center gap-1 p-2 rounded-full text-white hover:bg-white/10 transition-colors">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <MoreVertical className="w-5 h-5" />
            </div>
          </button>
        </div>
      )}

      {/* Volume Control */}
      {showControls && (
        <div className="absolute left-4 bottom-20">
          <button
            onClick={toggleMute}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};
