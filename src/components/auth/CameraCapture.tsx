"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, X, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Image: string) => void;
}

export function CameraCapture({ isOpen, onClose, onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  async function startCamera() {
    setError(null);
    setCapturedImage(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // prefer rear camera
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Unable to access camera. Please check permissions.");
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }

  function capturePhoto() {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const dataUrl = canvas.toDataURL("image/jpeg");
      setCapturedImage(dataUrl);
      stopCamera();
    }
  }

  function handleSave() {
    if (capturedImage) {
      // Pass base64 back without the data:image/jpeg;base64, prefix
      const base64 = capturedImage.split(",")[1] || capturedImage;
      onCapture(base64);
      onClose();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md glass">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" /> Capture Document
          </DialogTitle>
        </DialogHeader>
        <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl bg-muted aspect-video border border-border">
          {error ? (
            <p className="text-xs text-destructive text-center px-4 font-semibold">{error}</p>
          ) : capturedImage ? (
            <img src={capturedImage} alt="Captured preview" className="h-full w-full object-cover" />
          ) : (
            <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
          )}
          
          <canvas ref={canvasRef} className="hidden" />
        </div>
        <div className="flex justify-center gap-2 mt-4">
          {!capturedImage ? (
            <Button onClick={capturePhoto} disabled={!!error} className="w-full gap-2 font-semibold">
              <Camera className="h-4 w-4" /> Capture Photo
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={startCamera} className="flex-1 gap-1.5 font-semibold">
                <RefreshCw className="h-4 w-4" /> Retake
              </Button>
              <Button onClick={handleSave} className="flex-1 gap-1.5 font-semibold">
                <Check className="h-4 w-4" /> Use Photo
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
