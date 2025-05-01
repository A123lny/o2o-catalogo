import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Maximize } from "lucide-react";
import { processImageUrl } from "../lib/image-utils";

interface VehicleGalleryProps {
  mainImage?: string;
  images?: string[];
  title: string;
}

export default function VehicleGallery({ mainImage, images = [], title }: VehicleGalleryProps) {
  const [currentImage, setCurrentImage] = useState(mainImage || (images.length > 0 ? images[0] : ""));
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Combine main image with other images
  const allImages = mainImage 
    ? [mainImage, ...images.filter(img => img !== mainImage)] 
    : images;

  // Set a default image if none provided
  const defaultImage = "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&h=600&q=80";

  const handleThumbnailClick = (image: string, index: number) => {
    setCurrentImage(image);
    setSelectedIndex(index);
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const goToPrevious = () => {
    setLightboxIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setLightboxIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
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
          <img 
            src={processImageUrl(currentImage || defaultImage)} 
            alt={title} 
            className="w-full h-[450px] object-cover cursor-pointer"
            onClick={() => openLightbox(selectedIndex)}
          />
          <button 
            onClick={() => openLightbox(selectedIndex)}
            className="absolute bottom-4 right-4 bg-white/80 hover:bg-white p-2 rounded-full text-primary transition-colors"
            title="Visualizza a schermo intero"
          >
            <Maximize size={20} />
          </button>
        </div>
        
        {allImages.length > 0 && (
          <div className="bg-neutral-50 p-3 border-t border-neutral-100">
            <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-thin scrollbar-thumb-neutral-300">
              {allImages.map((image, index) => (
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
              src={processImageUrl(allImages[lightboxIndex] || defaultImage)} 
              alt={`${title} - Lightbox ${lightboxIndex + 1}`} 
              className="max-h-full max-w-full object-contain"
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
                {lightboxIndex + 1} / {allImages.length}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
