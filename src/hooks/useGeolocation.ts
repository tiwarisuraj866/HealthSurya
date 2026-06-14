import { useState, useCallback } from "react";
import { toast } from "sonner";

export function useGeolocation() {
  const [detecting, setDetecting] = useState(false);

  const locate = useCallback(async (): Promise<string | null> => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return null;
    }

    setDetecting(true);

    return new Promise<string | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            // Use BigDataCloud's free reverse geocoding API (no API key required)
            const res = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            if (!res.ok) throw new Error("Reverse geocoding request failed");
            
            const data = await res.json();
            const detectedCity = data.city || data.locality || data.principalSubdivision || "";
            
            if (detectedCity) {
              toast.success(`Detected location: ${detectedCity}`);
              resolve(detectedCity);
            } else {
              toast.error("Could not determine your city name.");
              resolve(null);
            }
          } catch (err: any) {
            console.error("Reverse geocoding error:", err);
            toast.error("Failed to resolve location name.");
            resolve(null);
          } finally {
            setDetecting(false);
          }
        },
        (error) => {
          console.error("Geolocation capture error:", error);
          let msg = "Failed to retrieve location permission.";
          if (error.code === error.PERMISSION_DENIED) {
            msg = "Location permission denied. Please allow location access in your browser.";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            msg = "Location position is unavailable.";
          } else if (error.code === error.TIMEOUT) {
            msg = "Location request timed out.";
          }
          toast.error(msg);
          setDetecting(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, []);

  return { detecting, locate };
}
