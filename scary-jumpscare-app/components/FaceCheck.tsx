"use client";
import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { useRouter } from "next/navigation";

export default function FaceCheck() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [notClose, setNotClose] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const detectionIntervalRef = useRef<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadModels = async () => {
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
  }, []);

  const startDetection = () => {
    if (isDetecting) return;
    setIsDetecting(true);

    // Reduced interval for faster detection (250ms instead of 1000ms)
    detectionIntervalRef.current = setInterval(async () => {
      await detectFace();
    }, 250);
  };

  const detectFace = async () => {
    if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
      return;
    }

    try {
      // Use smaller input size for faster processing
      const detection = await faceapi.detectSingleFace(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 320, // Smaller input size for speed (default is 416)
          scoreThreshold: 0.3 // Lower threshold for better detection
        })
      );

      if (detection) {
        const videoWidth = videoRef.current.videoWidth;
        const videoHeight = videoRef.current.videoHeight;
        
        // Calculate face size relative to video dimensions
        const faceArea = detection.box.width * detection.box.height;
        const videoArea = videoWidth * videoHeight;
        const faceRatio = faceArea / videoArea;
        
        // Trigger jumpscare if face takes up more than 20% of the screen
        if (faceRatio > 0.2) {
          setIsDetecting(false);
          if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
          }
          triggerJumpscare();
        } else {
          setNotClose(true);
          // Clear the "not close" message after a short delay if face gets close
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

    // Intense flickering with random intervals
    const flickerInterval = setInterval(() => {
      // Random flicker speed
      const isVisible = Math.random() > 0.5;
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      // Flicker background
      document.body.style.backgroundColor = randomColor;
      flickerDiv.style.backgroundColor = isVisible ? randomColor : "transparent";
      
      // Flicker image
      img.style.opacity = Math.random() > 0.3 ? "1" : "0";
      
      flickerCount++;
      
      if (flickerCount >= maxFlickers) {
        clearInterval(flickerInterval);
        
        // Final state - show image
        img.style.opacity = "1";
        document.body.style.backgroundColor = "#000000";
        flickerDiv.remove();
        
        // Call shutdown API and navigate after 1 second
        setTimeout(async () => {
          try {
            await fetch('http://localhost:5000/shutdown', { method: 'POST' });
          } catch (error) {
            console.error('Shutdown API error:', error);
          }
          router.push("/shutdown");
        }, 1000);
      }
    }, 50 + Math.random() * 100); // Random flicker speed between 50-150ms
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black">
      <div className="relative">
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          className="rounded-md shadow-xl max-w-md"
          width="640"
          height="480"
        />
        <canvas 
          ref={canvasRef}
          className="absolute top-0 left-0 pointer-events-none"
        />
      </div>
      {notClose && (
        <p className="text-red-500 text-xl mt-4 animate-pulse">
          You're not close enough 😈
        </p>
      )}
      {!isDetecting && (
        <p className="text-white text-sm mt-2">Loading face detection...</p>
      )}
    </div>
  );
}