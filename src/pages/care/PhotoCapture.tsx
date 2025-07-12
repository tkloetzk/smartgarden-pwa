// src/components/care/PhotoCapture.tsx
import React, { useState, useRef, useCallback, useMemo, memo } from "react";
import { Button } from "@/components/ui/Button";

interface PhotoCaptureProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
}

export const PhotoCapture = memo(function PhotoCapture({
  photos,
  onPhotosChange,
  maxPhotos = 5,
}: PhotoCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Memoize expensive calculations
  const canAddMore = useMemo(() => photos.length < maxPhotos, [photos.length, maxPhotos]);

  // Start camera stream for live preview
  const startCamera = useCallback(async () => {
    setError(null);
    setIsCapturing(true);

    try {
      // Request camera access - this is where PWA camera integration happens
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera on mobile devices
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      console.error("Failed to start camera:", err);
      setError("Unable to access camera. Please check permissions.");
      setIsCapturing(false);
    }
  }, []);

  // Stop camera stream and clean up
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  }, []);

  // Capture photo from video stream
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob URL for storage
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const photoUrl = URL.createObjectURL(blob);
          onPhotosChange([...photos, photoUrl]);
        }
      },
      "image/jpeg",
      0.8
    ); // 80% quality to balance file size and quality

    stopCamera();
  }, [onPhotosChange, photos, stopCamera]);

  // Remove a photo from the list
  const removePhoto = useCallback((index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  }, [photos, onPhotosChange]);

  // Handle file input as fallback for devices without camera API support
  const handleFileInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const photoUrl = URL.createObjectURL(file);
        onPhotosChange([...photos, photoUrl]);
      }
    });

    // Reset input
    event.target.value = "";
  }, [photos, onPhotosChange]);

  return (
    <div className="space-y-4">
      {/* Camera capture interface */}
      {isCapturing ? (
        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-64 object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="primary"
              onClick={capturePhoto}
              className="flex-1"
            >
              📸 Capture Photo
            </Button>
            <Button type="button" variant="outline" onClick={stopCamera}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        /* Photo capture options when camera is not active */
        <div className="space-y-4">
          {/* Action buttons */}
          <div className="flex gap-2">
            {canAddMore && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={startCamera}
                  className="flex-1"
                >
                  📷 Take Photo
                </Button>

                {/* File input fallback */}
                <label className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {}} // Button appearance only
                  >
                    📁 Choose File
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </label>
              </>
            )}
          </div>

          {/* Error display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Photo count indicator */}
          {photos.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {photos.length} of {maxPhotos} photos added
            </p>
          )}
        </div>
      )}

      {/* Display captured photos */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {photos.map((photo, index) => (
            <div key={index} className="relative">
              <img
                src={photo}
                alt={`Captured photo ${index + 1}`}
                className="w-full h-24 object-cover rounded-md border border-border"
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
