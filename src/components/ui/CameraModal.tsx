import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, RefreshCw, AlertCircle, CheckCircle2, SwitchCamera, Sparkles } from 'lucide-react';
import { Button } from './Button';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  title?: string;
  subtitle?: string;
}

export function CameraModal({
  isOpen,
  onClose,
  onCapture,
  title = "Live Camera Capture",
  subtitle = "Align the waste in the viewfinder and tap the shutter button"
}: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraActive, setCameraActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  // Stop camera tracks cleanly
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Start camera stream
  const startCamera = async (mode: 'environment' | 'user') => {
    stopStream();
    setErrorMsg(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg("Camera streaming is not supported by your browser. You can use your phone's native camera below.");
      return;
    }

    try {
      // Check for available devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      } catch (e) {
        // Ignore enumerate devices errors
      }

      // Try preferred facing mode first
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });
      } catch (err) {
        // Fallback to any available video stream
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.warn);
          setCameraActive(true);
        };
      }
    } catch (err: any) {
      console.warn("Camera access error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg("Camera permission was denied. Please allow camera permissions in your browser or use the native camera option below.");
      } else {
        setErrorMsg("Could not access the camera. Tap below to use your phone's native camera.");
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      stopStream();
    }
    return () => {
      stopStream();
    };
  }, [isOpen, facingMode]);

  const handleFlipCamera = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error("Canvas 2D context not available");
      }

      // If user-facing mode, un-mirror if needed or draw as is
      ctx.drawImage(video, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `camera_snap_${Date.now()}.jpg`, { type: 'image/jpeg' });
          stopStream();
          onCapture(file);
          onClose();
        } else {
          setErrorMsg("Failed to capture image. Please try again.");
        }
        setIsCapturing(false);
      }, 'image/jpeg', 0.92);
    } catch (e: any) {
      console.error("Capture error:", e);
      setIsCapturing(false);
      setErrorMsg("Failed to snap photo. You can use native camera below.");
    }
  };

  // Fallback native mobile camera input
  const handleNativeCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      stopStream();
      onCapture(file);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      {/* Hidden native input for mobile devices */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={nativeCameraInputRef}
        onChange={handleNativeCameraCapture}
        className="hidden"
      />

      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 text-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{title}</h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[240px]">{subtitle}</p>
            </div>
          </div>

          <button
            onClick={() => {
              stopStream();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="relative flex-1 bg-black min-h-[300px] sm:min-h-[380px] max-h-[60vh] flex items-center justify-center overflow-hidden">
          {/* Live Video */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              cameraActive ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Viewfinder Target Overlays */}
          {cameraActive && (
            <div className="absolute inset-6 pointer-events-none flex flex-col justify-between">
              <div className="flex justify-between">
                <div className="w-8 h-8 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                <div className="w-8 h-8 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
              </div>

              <div className="flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border border-emerald-400/40 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-emerald-400/80 animate-ping" />
                </div>
              </div>

              <div className="flex justify-between">
                <div className="w-8 h-8 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                <div className="w-8 h-8 border-b-2 border-r-2 border-emerald-400 rounded-br-lg shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
              </div>
            </div>
          )}

          {/* Fallback / Error State */}
          {errorMsg && (
            <div className="absolute inset-0 bg-slate-900/95 p-6 flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-12 h-12 text-amber-400 mb-3" />
              <h4 className="text-base font-bold text-white mb-1.5">Camera Access Needed</h4>
              <p className="text-xs text-slate-300 mb-6 max-w-xs">{errorMsg}</p>

              <div className="flex flex-col w-full max-w-xs space-y-2.5">
                <Button
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg"
                  leftIcon={<Camera className="w-4 h-4" />}
                >
                  Open Phone Native Camera
                </Button>
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="text-xs text-emerald-400 hover:underline flex items-center justify-center py-1 font-semibold"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Try Again
                </button>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {!cameraActive && !errorMsg && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
              <p className="text-xs font-semibold text-slate-300">Initializing camera...</p>
            </div>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0">
          {/* Flip Camera Button */}
          <button
            type="button"
            onClick={handleFlipCamera}
            disabled={!cameraActive}
            title="Switch between front and back camera"
            className="w-11 h-11 rounded-full bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 hover:text-white flex items-center justify-center transition-all"
          >
            <SwitchCamera className="w-5 h-5" />
          </button>

          {/* Primary Shutter Button */}
          <button
            type="button"
            onClick={handleCapture}
            disabled={!cameraActive || isCapturing}
            className="group relative w-18 h-18 rounded-full border-4 border-white/80 p-1 flex items-center justify-center transition-transform active:scale-95 disabled:opacity-40"
            title="Snap Photo"
          >
            <div className="w-full h-full rounded-full bg-emerald-500 group-hover:bg-emerald-400 transition-colors flex items-center justify-center shadow-lg">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </button>

          {/* Native Phone Camera Option */}
          <button
            type="button"
            onClick={() => nativeCameraInputRef.current?.click()}
            title="Open Phone Camera App"
            className="w-11 h-11 rounded-full bg-slate-800 hover:bg-slate-700 text-emerald-400 flex items-center justify-center transition-all text-xs font-bold"
          >
            <Sparkles className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
}
