"use client"

import { getAccessToken } from "@/lib/auth";
import { useState, useEffect } from "react";

interface AuthenticatedImageProps {
  fileId: number | null | undefined;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

export function AuthenticatedImage({ 
  fileId, 
  alt, 
  className = "", 
  fallbackSrc = "/placeholder.svg" 
}: AuthenticatedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(fallbackSrc);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!fileId) {
      setImageSrc(fallbackSrc);
      setIsLoading(false);
      return;
    }

    const loadImage = async () => {
      try {
        setIsLoading(true);
        setError(false);

        const token = getAccessToken();
        if (!token) {
          throw new Error('No access token available');
        }

        // Usar el endpoint proxy del frontend
        const url = `/api/files/${fileId}`;

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load image: ${response.status}`);
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        setImageSrc(objectUrl);

      } catch (err) {
        console.error('Error loading authenticated image:', err);
        setError(true);
        setImageSrc(fallbackSrc);
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();

    // Cleanup function para liberar la URL del objeto
    return () => {
      if (imageSrc && imageSrc !== fallbackSrc && imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [fileId, fallbackSrc]);

  if (isLoading) {
    return (
      <div className={`animate-pulse bg-gray-200 ${className}`}>
        <div className="w-full h-full bg-gray-300 rounded"></div>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (imageSrc !== fallbackSrc) {
          setImageSrc(fallbackSrc);
        }
      }}
    />
  );
} 