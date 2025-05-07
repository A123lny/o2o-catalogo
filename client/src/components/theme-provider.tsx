import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GeneralSettings } from "@shared/schema";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [cssVars, setCssVars] = useState<string | null>(null);

  // Fetch general settings to get custom colors
  const { data: generalSettings } = useQuery<GeneralSettings>({
    queryKey: ['/api/settings/general'],
    queryFn: async () => {
      const response = await fetch('/api/settings/general');
      if (!response.ok) throw new Error('Errore nel recupero delle impostazioni generali');
      return response.json();
    }
  });

  useEffect(() => {
    if (generalSettings?.primaryColor || generalSettings?.secondaryColor) {
      // Convert hex colors to HSL format for CSS variables
      const primaryColor = generalSettings.primaryColor || "#3b82f6"; // Default blue
      const secondaryColor = generalSettings.secondaryColor || "#f97316"; // Default orange
      
      // Function to convert hex to HSL
      const hexToHSL = (hex: string): string => {
        // Remove the # if present
        hex = hex.replace('#', '');
        
        // Convert hex to RGB
        let r = parseInt(hex.substring(0, 2), 16) / 255;
        let g = parseInt(hex.substring(2, 4), 16) / 255;
        let b = parseInt(hex.substring(4, 6), 16) / 255;
        
        // Find min and max RGB components
        let max = Math.max(r, g, b);
        let min = Math.min(r, g, b);
        
        let h = 0, s = 0, l = (max + min) / 2;
        
        if (max !== min) {
          let d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          
          switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
          }
          
          h *= 60;
        }
        
        // Round to nearest integers
        h = Math.round(h);
        s = Math.round(s * 100);
        l = Math.round(l * 100);
        
        return `${h} ${s}% ${l}%`;
      };
      
      // Create CSS variables in HSL format
      const primaryHSL = hexToHSL(primaryColor);
      const secondaryHSL = hexToHSL(secondaryColor);
      
      // Apply the CSS variables
      setCssVars(`
        :root {
          --primary: ${primaryHSL};
          --secondary: ${secondaryHSL};
        }
      `);
    }
  }, [generalSettings]);

  return (
    <>
      {cssVars && <style dangerouslySetInnerHTML={{ __html: cssVars }} />}
      {children}
    </>
  );
}