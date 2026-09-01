import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { 
  Camera, 
  CameraOff, 
  SwitchCamera, 
  Flashlight, 
  FlashlightOff, 
  Upload, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  ScanLine,
  Image as ImageIcon
} from 'lucide-react';

interface QRScannerCameraProps {
  onScan: (decodedText: string) => void;
  isActive?: boolean;
  cooldownMs?: number;
}

export const QRScannerCamera: React.FC<QRScannerCameraProps> = ({
  onScan,
  isActive = true,
  cooldownMs = 2500
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [torchSupported, setTorchSupported] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [lastScannedTime, setLastScannedTime] = useState<number>(0);
  const [scanFlash, setScanFlash] = useState<boolean>(false);

  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Stop camera tracks
  const stopCameraStream = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (_) {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setTorchOn(false);
    setTorchSupported(false);
  }, []);

  // Enumerate video devices
  const enumerateDevices = useCallback(async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevs = devices.filter(d => d.kind === 'videoinput');
        setAvailableDevices(videoDevs);
      }
    } catch (_) {}
  }, []);

  // Start camera stream
  const startCameraStream = useCallback(async () => {
    if (!isActive || !isScanning) {
      stopCameraStream();
      return;
    }

    stopCameraStream();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasCameraPermission(false);
      setCameraError('Camera access is not supported in this browser environment. You can use image upload or manual input below.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: selectedDeviceId 
          ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setHasCameraPermission(true);
      setCameraError(null);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Required for iOS Safari
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('muted', 'true');
        videoRef.current.muted = true;
        await videoRef.current.play().catch(() => {});
      }

      // Check if torch/flashlight is supported
      const track = stream.getVideoTracks()[0];
      if (track && (track.getCapabilities as any)) {
        const capabilities = (track.getCapabilities as any)() || {};
        if (capabilities.torch) {
          setTorchSupported(true);
        }
      }

      await enumerateDevices();
    } catch (err: any) {
      console.warn('Camera stream request error:', err);
      setHasCameraPermission(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera access in your browser settings, or upload a QR image.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No video camera device was found on this system. You can upload a QR pass image instead.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError('Camera is currently in use by another application or tab. Please close other camera tabs and retry.');
      } else {
        setCameraError('Could not start camera feed: ' + (err.message || 'Unknown error.'));
      }
    }
  }, [isActive, isScanning, facingMode, selectedDeviceId, stopCameraStream, enumerateDevices]);

  // Toggle torch / flashlight
  const toggleTorch = async () => {
    if (!streamRef.current || !torchSupported) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextTorch = !torchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextTorch }]
      });
      setTorchOn(nextTorch);
    } catch (e) {
      console.error('Torch toggle failed', e);
    }
  };

  // Switch front / back camera
  const switchCameraFacing = () => {
    setSelectedDeviceId('');
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  // Continuous frame analysis loop with jsQR
  useEffect(() => {
    if (!isActive || !isScanning || !hasCameraPermission) return;

    let mounted = true;

    const tick = () => {
      if (!mounted) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && video.readyState === video.HAVE_ENOUGH_DATA && canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          // Decode QR code from frame
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth'
          });

          if (code && code.data && code.data.trim()) {
            const rawData = code.data.trim();
            const now = Date.now();

            // Prevent spamming the exact same QR within cooldownMs
            const isSameAsRecent = rawData === lastScannedCode && (now - lastScannedTime < cooldownMs);

            if (!isSameAsRecent) {
              setLastScannedCode(rawData);
              setLastScannedTime(now);
              setScanFlash(true);
              setTimeout(() => setScanFlash(false), 400);

              // Notify parent
              onScan(rawData);
            }
          }
        }
      }

      animationFrameId.current = requestAnimationFrame(tick);
    };

    animationFrameId.current = requestAnimationFrame(tick);

    return () => {
      mounted = false;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isActive, isScanning, hasCameraPermission, lastScannedCode, lastScannedTime, cooldownMs, onScan]);

  // Restart camera when props or state change
  useEffect(() => {
    startCameraStream();
    return () => {
      stopCameraStream();
    };
  }, [startCameraStream, stopCameraStream]);

  // Handle uploaded image file decoding
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imgData.data, imgData.width, imgData.height, {
            inversionAttempts: 'attemptBoth'
          });

          if (code && code.data && code.data.trim()) {
            setScanFlash(true);
            setTimeout(() => setScanFlash(false), 400);
            onScan(code.data.trim());
          } else {
            alert('No valid QR code found in the uploaded image. Please ensure the QR code is clearly visible and well-lit.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl text-white">
      {/* Top Controls Toolbar */}
      <div className="p-3.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between gap-2 z-20 relative">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{isScanning ? 'LIVE OPTICAL FEED' : 'CAMERA PAUSED'}</span>
          </div>
          {facingMode === 'environment' && (
            <span className="hidden sm:inline text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
              Back Camera
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Torch Toggle */}
          {torchSupported && (
            <button
              type="button"
              onClick={toggleTorch}
              className={`p-2 rounded-xl text-xs font-bold transition-colors ${
                torchOn ? 'bg-amber-400 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title={torchOn ? 'Turn Flashlight Off' : 'Turn Flashlight On'}
            >
              {torchOn ? <Flashlight className="w-4 h-4" /> : <FlashlightOff className="w-4 h-4" />}
            </button>
          )}

          {/* Flip / Switch Camera */}
          <button
            type="button"
            onClick={switchCameraFacing}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors"
            title="Switch Front/Back Camera"
          >
            <SwitchCamera className="w-4 h-4" />
          </button>

          {/* Pause / Resume scanning */}
          <button
            type="button"
            onClick={() => setIsScanning(!isScanning)}
            className={`p-2 rounded-xl text-xs font-medium transition-colors ${
              isScanning ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-sky-600 text-white'
            }`}
            title={isScanning ? 'Pause Camera' : 'Resume Camera'}
          >
            {isScanning ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
          </button>

          {/* Upload QR Image */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl text-xs font-medium transition-colors flex items-center gap-1"
            title="Upload QR Image from Storage"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline text-[11px]">Upload QR</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Main Video Viewfinder Container */}
      <div className="relative aspect-[4/3] sm:aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
        {/* Hidden Canvas for Decoding Frames */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Video Element */}
        <video
          ref={videoRef}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isScanning && hasCameraPermission ? 'opacity-100' : 'opacity-20'
          }`}
        />

        {/* Detection Flash Overlay */}
        {scanFlash && (
          <div className="absolute inset-0 bg-emerald-500/40 backdrop-blur-[2px] transition-opacity duration-300 z-30 pointer-events-none flex items-center justify-center">
            <div className="bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 text-sm animate-bounce">
              <CheckCircle2 className="w-5 h-5" />
              <span>QR Code Detected!</span>
            </div>
          </div>
        )}

        {/* Reticle Target Overlay when active */}
        {isScanning && hasCameraPermission && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6 z-10">
            {/* Viewfinder Target Box */}
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 border-2 border-sky-400/40 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(56,189,248,0.15)] flex items-center justify-center">
              
              {/* 4 Corner Targeting Reticles */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-sky-400 rounded-tl-2xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-sky-400 rounded-tr-2xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-sky-400 rounded-bl-2xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-sky-400 rounded-br-2xl" />

              {/* Animated Laser Beam */}
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_15px_#38bdf8] animate-pulse top-1/2 -translate-y-1/2" />
            </div>

            <p className="text-[11px] font-semibold text-slate-300/90 mt-4 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-700/80 backdrop-blur-xs">
              Align PAGASA Member QR Badge inside square
            </p>
          </div>
        )}

        {/* Camera Error / Permission Request View */}
        {cameraError && (
          <div className="absolute inset-0 bg-slate-950/95 p-6 flex flex-col items-center justify-center text-center space-y-4 z-20">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h4 className="text-sm font-bold text-white font-display">Camera Access Notice</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {cameraError}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={startCameraStream}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Camera</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-sky-400" />
                <span>Upload QR Image</span>
              </button>
            </div>
          </div>
        )}

        {/* Camera Paused Overlay */}
        {!isScanning && !cameraError && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 space-y-3 z-20">
            <CameraOff className="w-10 h-10 text-slate-500" />
            <p className="text-xs font-semibold text-slate-300">Camera feed is currently paused</p>
            <button
              type="button"
              onClick={() => setIsScanning(true)}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs transition-colors"
            >
              Resume Live Scanner
            </button>
          </div>
        )}
      </div>

      {/* Device Switcher Footer (if multiple cameras available) */}
      {availableDevices.length > 1 && (
        <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Camera Device:</span>
          <select
            value={selectedDeviceId}
            onChange={(e) => {
              setSelectedDeviceId(e.target.value);
            }}
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-sky-400"
          >
            <option value="">Default Camera</option>
            {availableDevices.map((dev, idx) => (
              <option key={dev.deviceId || idx} value={dev.deviceId}>
                {dev.label || `Camera ${idx + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};
