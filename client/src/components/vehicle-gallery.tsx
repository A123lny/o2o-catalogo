import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Maximize } from "lucide-react";

interface VehicleGalleryProps {
  mainImage?: string;
  images?: string[];
  title: string;
}

export default function VehicleGallery({ mainImage, images = [], title }: VehicleGalleryProps) {
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [validImages, setValidImages] = useState<string[]>([]);

  // Default fallback image
  const defaultImage = "/fallback-car-image.svg";

  // Process images on component mount and when props change
  useEffect(() => {
    // Filter out empty images and create clean list
    const filtered = [];
    
    // Add main image if valid
    if (mainImage && mainImage.trim() !== "") {
      filtered.push(mainImage);
    }
    
    // Add additional images if valid
    if (images && images.length > 0) {
      images.forEach(img => {
        if (img && img.trim() !== "" && (mainImage !== img)) {
          filtered.push(img);
        }
      });
    }
    
    setValidImages(filtered);
    
    // Set current image
    if (filtered.length > 0) {
      setCurrentImage(filtered[0]);
    } else {
      setCurrentImage(null);
    }
  }, [mainImage, images]);

  const handleThumbnailClick = (img: string, index: number) => {
    setCurrentImage(img);
    setSelectedIndex(index);
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const goToPrevious = () => {
    setLightboxIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setLightboxIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
  };

  // Process image URL for API proxy if needed
  const processImageUrl = (url: string) => {
    if (!url) return defaultImage;
    
    // For external images, use the proxy
    if (url.startsWith("http")) {
      return `/api/image-proxy?url=${encodeURIComponent(url)}`;
    }
    
    return url;
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      
      if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      } else if (e.key === "Escape") {
        setLightboxOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen]);

  return (
    <div className="image-gallery">
      <div className="relative bg-white rounded-lg overflow-hidden shadow-md">
        <div className="relative">
          {/* Main image display */}
          <img 
            src={currentImage ? processImageUrl(currentImage) : defaultImage} 
            alt={title} 
            className="w-full h-[450px] object-cover cursor-pointer"
            onClick={() => validImages.length > 0 && openLightbox(selectedIndex)}
            onError={(e) => {
              e.currentTarget.onerror = null; // Prevent infinite loops
              e.currentTarget.src = defaultImage;
            }}
          />
          
          {/* Fullscreen button */}
          {validImages.length > 0 && (
            <button 
              onClick={() => openLightbox(selectedIndex)}
              className="absolute bottom-4 right-4 bg-white/80 hover:bg-white p-2 rounded-full text-primary transition-colors"
              title="Visualizza a schermo intero"
            >
              <Maximize size={20} />
            </button>
          )}
        </div>
        
        {/* Thumbnails */}
        {validImages.length > 0 && (
          <div className="bg-neutral-50 p-3 border-t border-neutral-100">
            <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-thin scrollbar-thumb-neutral-300">
              {validImages.map((image, index) => (
                <div 
                  key={index}
                  className={`flex-shrink-0 cursor-pointer hover:opacity-75 transition-opacity rounded overflow-hidden ${
                    index === selectedIndex ? 'ring-2 ring-primary border-2 border-white' : 'opacity-70'
                  }`}
                  onClick={() => handleThumbnailClick(image, index)}
                  style={{ width: '100px' }}
                >
                  <img 
                    src={processImageUrl(image)} 
                    alt={`${title} - Image ${index + 1}`} 
                    className="w-full h-16 object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = defaultImage;
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-6xl p-0 bg-transparent border-none">
          <div className="relative bg-black rounded-lg flex items-center justify-center h-[80vh]">
            <Button 
              className="absolute left-2 z-10 rounded-full bg-black/30 hover:bg-black/50 text-white" 
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>

            <img 
              src={validImages.length > 0 ? processImageUrl(validImages[lightboxIndex]) : defaultImage} 
              alt={`${title} - Lightbox ${lightboxIndex + 1}`} 
              className="max-h-full max-w-full object-contain"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = defaultImage;
              }}
            />

            <Button 
              className="absolute right-2 z-10 rounded-full bg-black/30 hover:bg-black/50 text-white" 
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>

            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <div className="bg-black/50 rounded-full px-4 py-1 text-white text-sm">
                {lightboxIndex + 1} / {validImages.length}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}