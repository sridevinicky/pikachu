"use client";
import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { useRouter } from "next/navigation";

export default function HorrorApp() {
  // Face detection states
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [notClose, setNotClose] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Demon summoning states
  const [message, setMessage] = useState("Click the button below to begin the ritual...");
  const [isLoading, setIsLoading] = useState(false);
  const [isDemonSummoned, setIsDemonSummoned] = useState(false);
  const [showFaceDetection, setShowFaceDetection] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const loadModels = async () => {
      if (!showFaceDetection) return;
      
      const MODEL_URL = "/models";
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      ]);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 }
          } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            startDetection();
          };
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
      }
    };

    loadModels();

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [showFaceDetection]);

  const startDetection = () => {
    if (isDetecting) return;
    setIsDetecting(true);

    detectionIntervalRef.current = setInterval(async () => {
      await detectFace();
    }, 250);
  };

  const detectFace = async () => {
    if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
      return;
    }

    try {
      const detection = await faceapi.detectSingleFace(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 320,
          scoreThreshold: 0.3
        })
      );

      if (detection) {
        const videoWidth = videoRef.current.videoWidth;
        const videoHeight = videoRef.current.videoHeight;
        
        const faceArea = detection.box.width * detection.box.height;
        const videoArea = videoWidth * videoHeight;
        const faceRatio = faceArea / videoArea;
        
        if (faceRatio > 0.2) {
          setIsDetecting(false);
          if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
          }
          triggerJumpscare();
        } else {
          setNotClose(true);
          setTimeout(() => setNotClose(false), 500);
        }
      } else {
        setNotClose(true);
      }
    } catch (error) {
      console.error("Face detection error:", error);
    }
  };

  const triggerJumpscare = () => {
    const audio = new Audio("/scream.mp3");
    audio.play().catch(console.error);

    // Create jumpscare image
    const img = document.createElement("img");
    img.src = `https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?q=80&w=1674&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D`;
    img.className = "fixed top-0 left-0 w-full h-full object-cover z-50";
    img.style.opacity = "0";
    document.body.appendChild(img);

    // Create flicker overlay
    const flickerDiv = document.createElement("div");
    flickerDiv.className = "fixed top-0 left-0 w-full h-full z-40";
    flickerDiv.style.backgroundColor = "#000";
    document.body.appendChild(flickerDiv);

    let flickerCount = 0;
    const maxFlickers = 20;
    const colors = ["#000000", "#ff0000", "#ffffff", "#ff0000"];

    const flickerInterval = setInterval(() => {
      const isVisible = Math.random() > 0.5;
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      document.body.style.backgroundColor = randomColor;
      flickerDiv.style.backgroundColor = isVisible ? randomColor : "transparent";
      img.style.opacity = Math.random() > 0.3 ? "1" : "0";
      
      flickerCount++;
      
      if (flickerCount >= maxFlickers) {
        clearInterval(flickerInterval);
        
        img.style.opacity = "1";
        document.body.style.backgroundColor = "#000000";
        flickerDiv.remove();
        
        setTimeout(async () => {
          try {
            await fetch('http://localhost:5000/shutdown', {
              method: 'POST',
              headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer secret-key",
              },
            });
          } catch (error) {
            console.error('Shutdown API error:', error);
          }
          router.push("/shutdown");
        }, 1000);
      }
    }, 50 + Math.random() * 100);
  };

  const summonDemon = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setIsDemonSummoned(true);

    setMessage("🧾 It looks like you're trying to summon a demon... Need help?");

    setTimeout(() => {
      setMessage("😈 Demon summoned. Activating face detection... Get close to the camera!");
      setShowFaceDetection(true);
    }, 3000);

    // Removed the 10-second timeout shutdown - only shutdown after jumpscare now
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-950/20 via-black to-red-900/10"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.8)_100%)]"></div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-red-500/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center max-w-2xl w-full">
        {/* Title */}
        <h1 className="text-6xl md:text-8xl font-bold text-red-500 mb-12 animate-pulse tracking-wider font-serif">
          <span className="drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">
            {showFaceDetection ? "FACE THE DEMON" : "SUMMON-A-DEMON"}
          </span>
        </h1>

        {/* Face Detection Video */}
        {showFaceDetection && (
          <div className="mb-8 flex justify-center">
            <div className="relative border-4 border-red-500 rounded-lg overflow-hidden shadow-2xl shadow-red-500/50">
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                className="max-w-md rounded"
                width="640"
                height="480"
              />
              <canvas 
                ref={canvasRef}
                className="absolute top-0 left-0 pointer-events-none"
              />
              {notClose && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-600/90 px-4 py-2 rounded">
                  <p className="text-white text-sm font-bold animate-pulse">
                    You're not close enough 😈
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Message box */}
        <div className="bg-gray-800 border-2 border-red-500 rounded-lg p-6 mb-8 shadow-2xl shadow-red-500/20 relative">
          <div className="absolute -top-3 left-4 bg-gray-800 px-3 text-red-400 text-sm font-mono border border-red-500 rounded">
            System Alert
          </div>

          <div className="min-h-[80px] flex items-center justify-center">
            <p className={`text-lg font-mono leading-relaxed transition-all duration-500 ${
              isDemonSummoned ? "text-red-300" : "text-gray-300"
            }`}>
              {message}
            </p>
          </div>

          <div className="absolute inset-0 rounded-lg border border-red-400/30 pointer-events-none"></div>
        </div>

        {/* Summon button */}
        {!showFaceDetection && (
            <button
            onClick={summonDemon}
            disabled={isLoading}
            className={`
              px-12 py-4 text-xl font-bold rounded-lg transition-all duration-300 transform
              ${
              isLoading
                ? "bg-red-900 text-red-300 cursor-not-allowed scale-95"
                : "bg-red-600 text-white hover:bg-red-500 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/50 active:scale-95"
              }
              border-2 border-red-400 shadow-lg shadow-red-500/30
              font-serif tracking-wide
            `}
            >
            {isLoading ? (
              <span className="flex items-center gap-2">
              <span className="animate-spin">⚡</span>
              SUMMONING...
              </span>
            ) : (
              "SUMMON DEMON"
            )}
            </button>
        )}

        {/* Subtitle */}
        <p className="text-red-400/60 text-sm mt-6 font-mono tracking-widest">
          {showFaceDetection 
            ? "GET CLOSER TO COMPLETE THE RITUAL..." 
            : isDemonSummoned 
            ? "THE RITUAL HAS BEGUN..." 
            : "PROCEED AT YOUR OWN RISK"
          }
        </p>

        {/* Loading indicator for face detection */}
        {showFaceDetection && !isDetecting && (
          <p className="text-white text-sm mt-2 animate-pulse">Loading face detection...</p>
        )}
      </div>

      {/* Screen flicker effect */}
      {isDemonSummoned && <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none"></div>}
    </div>
  );
}