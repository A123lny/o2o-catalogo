import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

  return (
    <>
      <div className="bg-neutral-100 rounded-lg overflow-hidden mb-4">
        <img 
          src={currentImage || defaultImage} 
          alt={title} 
          className="w-full h-[400px] object-cover cursor-pointer"
          onClick={() => openLightbox(selectedIndex)}
        />
      </div>
      
      {allImages.length > 0 && (
        <div className="grid grid-cols-5 gap-2">
          {allImages.map((image, index) => (
            <div 
              key={index}
              className={`cursor-pointer hover:opacity-75 transition-opacity rounded overflow-hidden ${
                index === selectedIndex ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleThumbnailClick(image, index)}
            >
              <img 
                src={image} 
                alt={`${title} - Image ${index + 1}`} 
                className="w-full h-20 object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-6xl p-0 bg-transparent border-none">
          <div className="relative bg-black rounded-lg flex items-center justify-center h-[80vh]">
            <Button 
              className="absolute left-2 z-10 rounded-full" 
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
            >
              <ChevronLeft className="h-8 w-8 text-white" />
            </Button>

            <img 
              src={allImages[lightboxIndex] || defaultImage} 
              alt={`${title} - Lightbox ${lightboxIndex + 1}`} 
              className="max-h-full max-w-full object-contain"
            />

            <Button 
              className="absolute right-2 z-10 rounded-full" 
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
            >
              <ChevronRight className="h-8 w-8 text-white" />
            </Button>

            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <div className="bg-black/50 rounded-full px-4 py-1 text-white text-sm">
                {lightboxIndex + 1} / {allImages.length}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
