import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Maximize, ImageIcon } from "lucide-react";

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
    if (!url) return "";
    
    // For external images, use the proxy
    if (url.startsWith("http")) {
      return `/api/image-proxy?url=${encodeURIComponent(url)}`;
    }
    
    // Assicurati che il percorso inizi con /uploads/
    if (!url.startsWith('/uploads/')) {
      return `/uploads/${url}`;
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
      <div className="relative bg-white rounded-lg overflow-hidden shadow-md sm:shadow-lg">
        <div className="relative">
          {/* Main image display */}
          {currentImage ? (
            <div className="relative">
              <div className="bg-gradient-to-b from-gray-50 to-white flex justify-center">
                <img 
                  src={processImageUrl(currentImage)} 
                  alt={title} 
                  className="w-full h-[300px] sm:h-[450px] object-contain sm:object-cover cursor-pointer"
                  onClick={() => validImages.length > 0 && openLightbox(selectedIndex)}
                />
              </div>
              
              {/* Fullscreen button - versione desktop (visibile solo su desktop) */}
              <div className="absolute top-0 right-0 p-2 hidden sm:block">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    openLightbox(selectedIndex);
                  }}
                  className="bg-white/90 hover:bg-white shadow-md p-2 rounded-full text-primary transition-colors z-10"
                  title="Visualizza a schermo intero"
                >
                  <Maximize size={20} />
                </button>
              </div>
              
              {/* Fullscreen button - versione mobile (visibile solo su mobile) */}
              <div className="absolute bottom-10 right-3 block sm:hidden">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    openLightbox(selectedIndex);
                  }}
                  className="bg-white/90 hover:bg-white shadow-md p-2 rounded-full text-blue-500 transition-colors z-10"
                  title="Visualizza a schermo intero"
                >
                  <Maximize size={20} />
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full h-[300px] sm:h-[450px] bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
              <ImageIcon className="h-16 w-16 text-gray-300" />
            </div>
          )}
        </div>
        
        {/* Thumbnails */}
        {validImages.length > 0 && (
          <div className="bg-white p-3 border-t border-gray-100 relative">
            {/* Indicatore scorrimento sx per thumbnails (solo mobile) */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 pointer-events-none h-full sm:hidden">
              <div className="w-8 h-full flex items-center justify-start bg-gradient-to-r from-white to-transparent">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 ml-1">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </div>
            </div>
            
            <div className="flex overflow-x-auto gap-3 pb-1 pt-1 scrollbar-hide px-4">
              {validImages.map((image, index) => (
                <div 
                  key={index}
                  className={`flex-shrink-0 cursor-pointer transition-all rounded overflow-hidden ${
                    index === selectedIndex 
                      ? 'ring-2 ring-blue-500 shadow-md' 
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  onClick={() => handleThumbnailClick(image, index)}
                  style={{ width: '75px' }}
                >
                  <div className="p-0.5 bg-white rounded overflow-hidden">
                    <img 
                      src={processImageUrl(image)} 
                      alt={`${title} - Image ${index + 1}`} 
                      className="w-full h-12 object-contain sm:object-cover rounded"
                    />
                  </div>
                </div>
              ))}
            </div>
            
            {/* Indicatore scorrimento dx per thumbnails (solo mobile) */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 pointer-events-none h-full sm:hidden">
              <div className="w-8 h-full flex items-center justify-end bg-gradient-to-l from-white to-transparent">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 mr-1">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>
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

            {validImages.length > 0 ? (
              <img 
                src={processImageUrl(validImages[lightboxIndex])} 
                alt={`${title} - Lightbox ${lightboxIndex + 1}`} 
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <ImageIcon className="h-20 w-20 text-neutral-400" />
              </div>
            )}

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