import React, { useState, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { motion } from 'framer-motion';
import ImagePreviewWrapper from './ImagePreviewWrapper';

// Check if running in Tauri environment safely
const isTauri = (() => {
  try {
    return typeof window !== 'undefined' && !!window.__TAURI_IPC__;
  } catch (error) {
    console.error("Error checking Tauri environment:", error);
    return false;
  }
})();

// Helper function to get Tauri API for file conversion
const getTauriAPI = async () => {
  if (!isTauri) return null;
  try {
    return await import('@tauri-apps/api');
  } catch (error) {
    console.error("Failed to import Tauri API:", error);
    return null;
  }
};

// Helper function to convert file path to usable URL in any environment
const convertImagePathToUrl = async (imagePath) => {
  // Check if it's already a URL or data URL
  if (typeof imagePath === 'string' && (imagePath.startsWith('http') || imagePath.startsWith('data:'))) {
    return imagePath;
  }
  
  // Handle File and Blob objects
  if (imagePath instanceof File || imagePath instanceof Blob) {
    return URL.createObjectURL(imagePath);
  }
  
  // Handle Tauri file path objects
  if (imagePath && typeof imagePath === 'object' && imagePath.path) {
    if (isTauri) {
      try {
        // Dynamically import Tauri API to avoid errors in browser environments
        const tauri = await getTauriAPI();
        if (tauri && tauri.tauri && tauri.tauri.convertFileSrc) {
          const path = imagePath.path.replace(/\\/g, '/'); // Normalize path separators
          return tauri.tauri.convertFileSrc(path);
        }
        return '';
      } catch (error) {
        console.error("Failed to convert Tauri file path:", error);
        return '';
      }
    } else {
      console.warn("Received Tauri file path object in browser environment");
      return '';
    }
  }
  
  // Handle plain string paths (could be local file paths)
  if (typeof imagePath === 'string') {
    if (isTauri) {
      try {
        // Dynamically import Tauri API
        const tauri = await getTauriAPI();
        if (tauri && tauri.tauri && tauri.tauri.convertFileSrc) {
          // Normalize path separators
          const path = imagePath.replace(/\\/g, '/');
          return tauri.tauri.convertFileSrc(path);
        }
        return imagePath; // Return original as fallback
      } catch (error) {
        console.error("Failed to convert Tauri file path from string:", error);
        return imagePath; // Return original as fallback
      }
    } else {
      // In browser, just return the path and hope it works
      return imagePath;
    }
  }
  
  // Default fallback for unknown types
  console.warn("Unknown image format:", imagePath);
  return '';
};

function SpeciesCard({ species, confidence, processingTime, image, onClear }) {
  // Format confidence as percentage
  const formattedConfidence = `${(confidence * 100).toFixed(1)}%`;
  
  // State to store processed image source for PDF generation
  const [processedImageSrc, setProcessedImageSrc] = useState('');
  const [imageError, setImageError] = useState(false);
  const [tauriAPI, setTauriAPI] = useState(null);
  
  // Load Tauri API on mount if in Tauri environment
  useEffect(() => {
    const loadTauriAPI = async () => {
      if (isTauri) {
        const api = await getTauriAPI();
        if (api) {
          setTauriAPI(api);
        }
      }
    };
    
    loadTauriAPI();
  }, []);
  
  // Direct convert function that can be used synchronously in render
  const getImageSrc = useCallback((imgSrc) => {
    if (!imgSrc) return '';
    
    // If we already have a processed URL, use that
    if (processedImageSrc) return processedImageSrc;
    
    // For strings that are already URLs
    if (typeof imgSrc === 'string') {
      if (imgSrc.startsWith('http') || imgSrc.startsWith('data:') || imgSrc.startsWith('blob:')) {
        return imgSrc;
      }
      
      // For local paths in Tauri, try to use the API directly if available
      if (isTauri && tauriAPI && tauriAPI.tauri && tauriAPI.tauri.convertFileSrc) {
        const path = imgSrc.replace(/\\/g, '/'); // Normalize path separators
        return tauriAPI.tauri.convertFileSrc(path);
      }
    }
    
    // For objects with path property
    if (imgSrc && typeof imgSrc === 'object' && imgSrc.path && 
        isTauri && tauriAPI && tauriAPI.tauri && tauriAPI.tauri.convertFileSrc) {
      const path = imgSrc.path.replace(/\\/g, '/'); // Normalize path separators
      return tauriAPI.tauri.convertFileSrc(path);
    }
    
    // Fallback
    return typeof imgSrc === 'string' ? imgSrc : '';
  }, [processedImageSrc, tauriAPI]);
  
  // Process the image source when the component mounts or image changes
  useEffect(() => {
    let isMounted = true;
    let objectUrl = null;
    
    const processImage = async () => {
      if (!image) {
        if (isMounted) {
          setProcessedImageSrc('');
          setImageError(false);
        }
        return;
      }

      try {
        const imageUrl = await convertImagePathToUrl(image);
        
        // Store the object URL for cleanup if needed
        if (imageUrl.startsWith('blob:')) {
          objectUrl = imageUrl;
        }
        
        if (isMounted) {
          setProcessedImageSrc(imageUrl);
          setImageError(false);
          console.log("Successfully processed image path:", image, "to URL:", imageUrl);
        }
      } catch (error) {
        console.error("Error processing image:", error);
        if (isMounted) {
          setProcessedImageSrc('');
          setImageError(true);
        }
      }
    };

    processImage();
    
    // Cleanup function to revoke object URL and prevent memory leaks
    return () => {
      isMounted = false;
      
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [image]);
  
  // Handle image load error
  const handleImageError = () => {
    console.error("Failed to load image:", processedImageSrc);
    setImageError(true);
  };
  
  // Parse properties JSON if it's a string
  const parseProperties = (props) => {
    if (!props) return null;
    
    // If it's already an object, return it directly
    if (typeof props === 'object' && props !== null) return props;
    
    // Try to parse as JSON if it's a string
    if (typeof props === 'string') {
      try {
        return JSON.parse(props);
      } catch (e) {
        // If parsing fails as strict JSON, check if it's a stringified object
        // This handles both double-stringified JSONs and malformed JSONs
        try {
          // Try to extract key-value pairs using regex
          const properties = {};
          
          // Extract numeric values (for density, height, etc.)
          const numericMatches = props.matchAll(/"([^"]+)":\s*([\d\.]+)/g);
          for (const match of numericMatches) {
            if (match.length >= 3) {
              const key = match[1];
              const value = parseFloat(match[2]);
              if (!isNaN(value)) {
                properties[key] = value;
              }
            }
          }
          
          // Extract string values (for text properties)
          const stringMatches = props.matchAll(/"([^"]+)":\s*"([^"]+)"/g);
          for (const match of stringMatches) {
            if (match.length >= 3) {
              properties[match[1]] = match[2];
            }
          }
          
          // Extract boolean values
          const booleanProperties = [
            'shade_tolerant', 'shade_intolerant', 'deciduous'
          ];
          
          booleanProperties.forEach(prop => {
            if (props.includes(`"${prop}":true`)) {
              properties[prop] = true;
            } else if (props.includes(`"${prop}":false`)) {
              properties[prop] = false;
            }
          });
          
          // Only return if we found some properties
          if (Object.keys(properties).length > 0) {
            return properties;
          }
        } catch (regexError) {
          console.warn("Failed to extract properties using regex:", regexError);
        }
        
        // If all else fails, return null
        return null;
      }
    }
    
    // Return null for any other case
    return null;
  };

  // Parse common uses if it's a string
  const parseCommonUses = (uses) => {
    if (!uses) return [];
    
    // If it's already an array, return it directly
    if (Array.isArray(uses)) return uses;
    
    // If it's a string, try multiple parsing strategies
    if (typeof uses === 'string') {
      // Strategy 1: Try to parse as JSON
      try {
        const parsed = JSON.parse(uses);
        return Array.isArray(parsed) ? parsed : [uses];
      } catch (e) {
        // Strategy 2: Extract array items using regex
        if (uses.includes('"') && (uses.includes('[') || uses.includes(','))) {
          const matches = Array.from(uses.matchAll(/"([^"]+)"/g))
            .map(match => match[1])
            .filter(item => item && item.trim() !== '');
          
          if (matches.length > 0) {
            return matches;
          }
        }
        
        // Strategy 3: If it has commas, split by commas
        if (uses.includes(',')) {
          return uses.split(',')
            .map(item => item.trim())
            .filter(item => item !== '');
        }
        
        // Strategy 4: If all else fails, treat as a single item
        return [uses.trim()];
      }
    }
    
    // Fallback for any other type
    return [String(uses).trim()];
  };

  // Dynamically extract local names from any format
  const extractLocalNames = (source) => {
    if (!source) return [];
    
    // If already an array, use directly
    if (Array.isArray(source)) return source;
    
    // Handle string formats
    if (typeof source === 'string') {
      // Check if it's a JSON string
      if ((source.startsWith('[') && source.endsWith(']')) || 
          (source.startsWith('{') && source.endsWith('}'))) {
        try {
          const parsed = JSON.parse(source);
          if (Array.isArray(parsed)) return parsed;
          if (typeof parsed === 'object') {
            // Handle object with name properties
            const names = [];
            for (const key in parsed) {
              if (typeof parsed[key] === 'string' && parsed[key].trim() !== '') {
                names.push(parsed[key]);
              }
            }
            if (names.length > 0) return names;
          }
        } catch (e) {
          // JSON parsing failed, continue with other methods
        }
      }
      
      // Try regex extraction if string contains quotes (likely a serialized array)
      if (source.includes('"')) {
        const matches = Array.from(source.matchAll(/"([^"]+)"/g))
          .map(match => match[1])
          .filter(item => item && item.trim() !== '');
        
        if (matches.length > 0) return matches;
      }
      
      // Handle comma-separated values
      if (source.includes(',')) {
        return source.split(/,\s*/)
          .map(item => item.trim())
          .filter(item => item !== '');
      }
      
      // Single value
      return [source.trim()];
    }
    
    return [];
  };
  
  const properties = parseProperties(species.properties);
  const commonUses = parseCommonUses(species.uses);
  const localNames = extractLocalNames(species.common_name || species.local_name);
  
  // Get current image source for rendering
  const currentImageSrc = getImageSrc(image);
  
  // Function to generate and download PDF report
  const generatePDF = async () => {
    const cardElement = document.getElementById('pdf-page');
    if (!cardElement) return;
    
    try {
      // Show loading state
      const downloadBtn = document.getElementById('download-report-btn');
      if (downloadBtn) {
        downloadBtn.innerText = 'Generating...';
        downloadBtn.disabled = true;
      }
      
      // Check if app is in dark mode
      const isDarkMode = document.documentElement.classList.contains('dark');
      
      // Apply dark mode class if needed
      if (isDarkMode) {
        cardElement.classList.add('dark');
      } else {
        cardElement.classList.remove('dark');
      }
      
      // Populate the PDF content template with all data
      await updatePdfTemplate();
      
      // Force element to be visible for capture, but positioned offscreen
      cardElement.style.display = 'block';
      
      // Wait a moment to ensure all content is fully rendered
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Create PDF with A4 dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4',
        hotfixes: ['px_scaling'],
        compress: true
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Capture the element with fixed dimensions
      const canvas = await html2canvas(cardElement, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        width: 794,
        height: 1123,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('pdf-page');
          if (clonedElement) {
            clonedElement.style.position = 'static';
            clonedElement.style.display = 'block';
            clonedElement.style.overflow = 'hidden';
            
            // Apply some visual improvements to the clone
            const contentElements = clonedElement.querySelectorAll('.pdf-property-item, .pdf-description, .pdf-header, .pdf-title');
            contentElements.forEach(el => {
              el.style.pageBreakInside = 'avoid';
            });
            
            // Fix list alignment issues
            const listItems = clonedElement.querySelectorAll('li');
            listItems.forEach(li => {
              li.style.marginBottom = '3px';
            });
            
            // Fix property item spacing
            const propertyItems = clonedElement.querySelectorAll('.pdf-property-item');
            propertyItems.forEach(item => {
              item.style.display = 'flex';
              item.style.flexDirection = 'column';
              item.style.padding = '8px 10px';
            });
            
            // Ensure footer is visible
            const footer = clonedElement.querySelector('.pdf-footer');
            if (footer) {
              footer.style.paddingBottom = '10px';
              footer.style.marginTop = 'auto';
            }
            
            // Ensure all content is visible by reducing font sizes if needed
            const contentHeight = clonedElement.scrollHeight;
            if (contentHeight > 1123) {
              const scaleFactor = Math.min(1, 1123 / contentHeight * 0.98);
              const contentEl = clonedElement.querySelector('.pdf-content');
              if (contentEl) {
                contentEl.style.transform = `scale(${scaleFactor})`;
                contentEl.style.transformOrigin = 'top left';
              }
            }
          }
        }
      });
      
      // Add the image to the PDF ensuring it fits on a single page
      const imgData = canvas.toDataURL('image/png', 0.95);
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // Hide the element again
      cardElement.style.display = 'none';
      
      // Save the PDF
      pdf.save(`TreeScopeAI_${species.scientific_name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      // Reset button state
      const downloadBtn = document.getElementById('download-report-btn');
      if (downloadBtn) {
        downloadBtn.innerText = 'Download Report';
        downloadBtn.disabled = false;
      }
      
      // Ensure the PDF container is hidden
      const cardElement = document.getElementById('pdf-page');
      if (cardElement) {
        cardElement.style.display = 'none';
        // Remove dark mode class to reset state
        cardElement.classList.remove('dark');
      }
    }
  };
  
  // Helper function to ensure PDF template has all the necessary content
  const updatePdfTemplate = async () => {
    const pdfPage = document.getElementById('pdf-page');
    if (!pdfPage) return;
    
    // Populate with all property data to ensure nothing is missing
    const propertiesGrid = pdfPage.querySelector('.pdf-properties-grid');
    if (propertiesGrid) {
      // Clear existing properties first
      propertiesGrid.innerHTML = '';
      
      // Add properties directly as HTML strings for simplicity and reliability
      let propertiesHTML = '';
      
      // Local Names
      if (localNames.length > 0) {
        propertiesHTML += `
          <div class="pdf-property-item">
            <h4>Local Names</h4>
            <ul class="text-2xs" style="margin-top: 2px; padding-left: 12px;">
              ${localNames.map(name => `<li>${name}</li>`).join('')}
            </ul>
          </div>
        `;
      }
      
      // Wood Density
      if (properties && properties.density_g_cm3) {
        propertiesHTML += `
          <div class="pdf-property-item">
            <h4>Wood Density</h4>
            <p class="text-2xs">${properties.density_g_cm3} g/cm³ ${properties.density_range ? `(${properties.density_range})` : ''}</p>
          </div>
        `;
      }
      
      // Xylem Porosity
      if (properties && properties.xylem_porosity) {
        propertiesHTML += `
          <div class="pdf-property-item">
            <h4>Xylem Porosity</h4>
            <p class="text-2xs">${properties.xylem_porosity}</p>
          </div>
        `;
      }
      
      // Growth Ring
      if (properties && properties.growth_ring) {
        propertiesHTML += `
          <div class="pdf-property-item">
            <h4>Growth Ring</h4>
            <p class="text-2xs">${properties.growth_ring}</p>
          </div>
        `;
      }
      
      // Habitat
      if (species.habitat) {
        propertiesHTML += `
          <div class="pdf-property-item">
            <h4>Habitat</h4>
            <p class="text-2xs">${species.habitat}</p>
          </div>
        `;
      }
      
      // Distribution
      if (species.distribution) {
        propertiesHTML += `
          <div class="pdf-property-item">
            <h4>Distribution</h4>
            <p class="text-2xs">${species.distribution}</p>
          </div>
        `;
      }
      
      // Common Uses
      if (commonUses && commonUses.length > 0) {
        propertiesHTML += `
          <div class="pdf-property-item">
            <h4>Common Uses</h4>
            <ul class="text-2xs" style="margin-top: 2px; padding-left: 12px;">
              ${commonUses.map(use => `<li style="margin-bottom: 3px;">${use}</li>`).join('')}
            </ul>
          </div>
        `;
      }
      
      // Conservation Status
      if (species.conservation_status) {
        propertiesHTML += `
          <div class="pdf-property-item">
            <h4>Conservation Status</h4>
            <p class="text-2xs">${species.conservation_status}</p>
          </div>
        `;
      }
      
      // Tree Height
      if (properties && properties.tree_height_m) {
        propertiesHTML += `
          <div class="pdf-property-item">
            <h4>Tree Height</h4>
            <p class="text-2xs">${properties.tree_height_m} m ${properties.tree_height_range ? `(${properties.tree_height_range})` : ''}</p>
          </div>
        `;
      }
      
      // Bark Thickness
      if (properties && properties.bark_thickness_mm) {
        propertiesHTML += `
          <div class="pdf-property-item">
            <h4>Bark Thickness</h4>
            <p class="text-2xs">${properties.bark_thickness_mm} mm ${properties.bark_thickness_range ? `(${properties.bark_thickness_range})` : ''}</p>
          </div>
        `;
      }
      
      // Flowering & Fruiting
      if (properties && (properties.flowering_time || properties.fruiting_time)) {
        propertiesHTML += `
          <div class="pdf-property-item">
            <h4>Flowering & Fruiting</h4>
            ${properties.flowering_time ? `<p class="text-2xs" style="margin-bottom: 4px;"><span style="font-weight: 600;">Flowering:</span> ${properties.flowering_time}</p>` : ''}
            ${properties.fruiting_time ? `<p class="text-2xs"><span style="font-weight: 600;">Fruiting:</span> ${properties.fruiting_time}</p>` : ''}
          </div>
        `;
      }
      
      // Growth Characteristics
      if (properties && (properties.shade_tolerant !== undefined || properties.shade_intolerant !== undefined || properties.deciduous !== undefined)) {
        propertiesHTML += `
          <div class="pdf-property-item">
            <h4>Growth Characteristics</h4>
            <ul class="text-2xs" style="padding-left: 12px; margin-top: 2px;">
              ${properties.deciduous !== undefined ? `
                <li style="margin-bottom: 4px;">
                  <span style="font-weight: 600; display: inline-block; min-width: 70px;">Leaf Type:</span>
                  ${properties.deciduous ? "Deciduous" : "Evergreen"}
                </li>
              ` : ''}
              ${properties.shade_tolerant !== undefined ? `
                <li style="margin-bottom: 4px;">
                  <span style="font-weight: 600; display: inline-block; min-width: 70px;">Shade Tolerant:</span>
                  ${properties.shade_tolerant ? "Yes" : "No"}
                </li>
              ` : ''}
              ${properties.shade_intolerant !== undefined ? `
                <li>
                  <span style="font-weight: 600; display: inline-block; min-width: 70px;">Shade Intolerant:</span>
                  ${properties.shade_intolerant ? "Yes" : "No"}
                </li>
              ` : ''}
            </ul>
          </div>
        `;
      }
      
      // Set the HTML content
      propertiesGrid.innerHTML = propertiesHTML;
    }
  };
  
  return (
    <>
      {/* Hidden PDF export container with fixed dimensions */}
      <div id="pdf-page" className="pdf-page">
        <div className="pdf-content">
          {/* Title and header - with proper spacing and alignment */}
          <div className="pdf-title">
            <h1>TreeScopeAI Species Report</h1>
            <div className="pdf-title-row">
              <div className="pdf-date">Generated: {new Date().toLocaleDateString()}</div>
              <div className="pdf-confidence">Confidence: {formattedConfidence}</div>
            </div>
          </div>
          
          {/* Species info - proper layout with family badge */}
          <div className="pdf-header">
            <div className="pdf-header-content">
              <h2>{species.name || species.common_name}</h2>
              <h3>{species.scientific_name}</h3>
            </div>
            <div className="pdf-family-badge">
              <span className="pdf-family-badge-label">Family:</span> <span className="pdf-family-badge-value">{species.family}</span>
            </div>
          </div>
          
          {/* Image section - with improved caption and safer image handling */}
          {image && (
            <div className="pdf-image-container">
              <div className="relative w-full h-full">
                {!imageError && currentImageSrc ? (
                  <img 
                    src={currentImageSrc}
                    alt={`Image of ${species.name || species.scientific_name}`}
                    className="w-full h-full object-contain"
                    onError={handleImageError}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
                    Image preview not available
                  </div>
                )}
                <div className="pdf-image-caption">
                  {species.scientific_name}
                </div>
              </div>
            </div>
          )}
          
          {/* Description section - better typography and spacing */}
          {species.description && (
            <div className="pdf-description">
              <h4>Description</h4>
              <p>{species.description}</p>
            </div>
          )}
          
          {/* Properties section title - visually distinct */}
          <h4 className="pdf-section-title">Species Properties</h4>
          
          {/* Properties grid - will be populated dynamically */}
          <div className="pdf-properties-grid">
            {/* Content will be populated by updatePdfTemplate() */}
          </div>
          
          {/* Section divider before footer */}
          <div className="pdf-section-divider"></div>
          
          {/* Footer - better positioned */}
          <div className="pdf-footer">
            Generated by TreeScopeAI - © 2025
          </div>
        </div>
      </div>
      
      {/* Regular visible component */}
      <motion.div 
        id="species-card" 
        className="w-full max-w-4xl rounded-md shadow-sm overflow-hidden mb-6 border border-gray-100 dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Display the uploaded image using ImagePreviewWrapper which handles different image sources safely */}
        {image && (
          <div className="w-full overflow-hidden bg-gray-50/50 dark:bg-gray-900/30 flex justify-center">
            <motion.div
              className="w-full max-w-3xl"
              initial={{ scale: 0.95, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <ImagePreviewWrapper 
                src={processedImageSrc || image}
                alt={`Image of ${species.name || species.scientific_name}`}
                containerClassName="bg-transparent mx-auto"
                aspectRatio="16/9"
                maxWidth="100%"
                maxHeight="500px"
                watermark={`${species.scientific_name}`}
                onError={handleImageError}
              />
            </motion.div>
          </div>
        )}
        
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-green-50/80 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20">
          <motion.h2 
            className="text-xl font-bold text-gray-800 dark:text-gray-100"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            {species.name || species.common_name}
          </motion.h2>
          <motion.h3 
            className="text-base italic text-gray-600 dark:text-gray-400"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            {species.scientific_name}
          </motion.h3>
          <motion.div 
            className="inline-block mt-2 px-2 py-0.5 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs font-medium rounded-full"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            Confidence: {formattedConfidence}
          </motion.div>
        </div>
        
        <div className="p-4">
          <div className="mb-4">
            <h4 className="text-base font-semibold mb-1 text-gray-800 dark:text-gray-200">Description</h4>
            <p className="text-gray-700 dark:text-gray-300 text-sm">{species.description}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <motion.div 
              className="bg-green-50/30 dark:bg-gray-700/30 p-3 rounded shadow-sm border border-green-100/30 dark:border-gray-600/20"
              whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
            >
              <h4 className="text-sm font-semibold mb-1 text-gray-800 dark:text-gray-200">Family</h4>
              <p className="text-gray-700 dark:text-gray-300 text-sm">{species.family}</p>
            </motion.div>
            
            {localNames.length > 0 && (
              <motion.div 
                className="bg-green-50/30 dark:bg-gray-700/30 p-3 rounded shadow-sm border border-green-100/30 dark:border-gray-600/20"
                whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
              >
                <h4 className="text-sm font-semibold mb-1 text-gray-800 dark:text-gray-200">Local Names</h4>
                <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300 text-sm">
                  {localNames.map((name, index) => (
                    <li key={index}>{name}</li>
                  ))}
                </ul>
              </motion.div>
            )}
            
            {properties && properties.density_g_cm3 && (
              <motion.div 
                className="bg-green-50/30 dark:bg-gray-700/30 p-3 rounded shadow-sm border border-green-100/30 dark:border-gray-600/20"
                whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
              >
                <h4 className="text-sm font-semibold mb-1 text-gray-800 dark:text-gray-200">Wood Density</h4>
                <p className="text-gray-700 dark:text-gray-300 text-sm">{properties.density_g_cm3} g/cm³ {properties.density_range && `(Range: ${properties.density_range})`}</p>
              </motion.div>
            )}
            
            {properties && properties.xylem_porosity && (
              <motion.div 
                className="bg-green-50/30 dark:bg-gray-700/30 p-3 rounded shadow-sm border border-green-100/30 dark:border-gray-600/20"
                whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
              >
                <h4 className="text-sm font-semibold mb-1 text-gray-800 dark:text-gray-200">Xylem Porosity</h4>
                <p className="text-gray-700 dark:text-gray-300 text-sm">{properties.xylem_porosity}</p>
              </motion.div>
            )}
            
            {properties && properties.growth_ring && (
              <motion.div 
                className="bg-green-50/30 dark:bg-gray-700/30 p-3 rounded shadow-sm border border-green-100/30 dark:border-gray-600/20"
                whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
              >
                <h4 className="text-sm font-semibold mb-1 text-gray-800 dark:text-gray-200">Growth Ring</h4>
                <p className="text-gray-700 dark:text-gray-300 text-sm">{properties.growth_ring}</p>
              </motion.div>
            )}
            
            {species.habitat && (
              <motion.div 
                className="bg-green-50/30 dark:bg-gray-700/30 p-3 rounded shadow-sm border border-green-100/30 dark:border-gray-600/20"
                whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
              >
                <h4 className="text-sm font-semibold mb-1 text-gray-800 dark:text-gray-200">Habitat</h4>
                <p className="text-gray-700 dark:text-gray-300 text-sm">{species.habitat}</p>
              </motion.div>
            )}
            
            {species.distribution && (
              <motion.div 
                className="bg-green-50/30 dark:bg-gray-700/30 p-3 rounded shadow-sm border border-green-100/30 dark:border-gray-600/20"
                whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
              >
                <h4 className="text-sm font-semibold mb-1 text-gray-800 dark:text-gray-200">Distribution</h4>
                <p className="text-gray-700 dark:text-gray-300 text-sm">{species.distribution}</p>
              </motion.div>
            )}
            
            {commonUses && commonUses.length > 0 && (
              <motion.div 
                className="bg-green-50/30 dark:bg-gray-700/30 p-3 rounded shadow-sm border border-green-100/30 dark:border-gray-600/20"
                whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
              >
                <h4 className="text-sm font-semibold mb-1 text-gray-800 dark:text-gray-200">Common Uses</h4>
                <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300 text-sm">
                  {commonUses.map((use, index) => (
                    <li key={index}>{use}</li>
                  ))}
                </ul>
              </motion.div>
            )}
            
            {species.conservation_status && (
              <motion.div 
                className="bg-green-50/30 dark:bg-gray-700/30 p-3 rounded shadow-sm border border-green-100/30 dark:border-gray-600/20"
                whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
              >
                <h4 className="text-sm font-semibold mb-1 text-gray-800 dark:text-gray-200">Conservation Status</h4>
                <p className="text-gray-700 dark:text-gray-300 text-sm">{species.conservation_status}</p>
              </motion.div>
            )}
            
            {properties && properties.tree_height_m && (
              <motion.div 
                className="bg-green-50/30 dark:bg-gray-700/30 p-3 rounded shadow-sm border border-green-100/30 dark:border-gray-600/20"
                whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
              >
                <h4 className="text-sm font-semibold mb-1 text-gray-800 dark:text-gray-200">Tree Height</h4>
                <p className="text-gray-700 dark:text-gray-300 text-sm">{properties.tree_height_m} meters {properties.tree_height_range && `(Range: ${properties.tree_height_range})`}</p>
              </motion.div>
            )}
            
            {properties && properties.bark_thickness_mm && (
              <motion.div 
                className="bg-green-50/30 dark:bg-gray-700/30 p-3 rounded shadow-sm border border-green-100/30 dark:border-gray-600/20"
                whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
              >
                <h4 className="text-sm font-semibold mb-1 text-gray-800 dark:text-gray-200">Bark Thickness</h4>
                <p className="text-gray-700 dark:text-gray-300 text-sm">{properties.bark_thickness_mm} mm {properties.bark_thickness_range && `(Range: ${properties.bark_thickness_range})`}</p>
              </motion.div>
            )}
            
            {properties && (properties.flowering_time || properties.fruiting_time) && (
              <motion.div 
                className="bg-green-50/30 dark:bg-gray-700/30 p-3 rounded shadow-sm border border-green-100/30 dark:border-gray-600/20"
                whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
              >
                <h4 className="text-sm font-semibold mb-1 text-gray-800 dark:text-gray-200">Flowering & Fruiting</h4>
                {properties.flowering_time && <p className="text-gray-700 dark:text-gray-300 text-sm"><span className="font-medium">Flowering:</span> {properties.flowering_time}</p>}
                {properties.fruiting_time && <p className="text-gray-700 dark:text-gray-300 text-sm"><span className="font-medium">Fruiting:</span> {properties.fruiting_time}</p>}
              </motion.div>
            )}
            
            {properties && (properties.shade_tolerant !== undefined || properties.shade_intolerant !== undefined || properties.deciduous !== undefined) && (
              <motion.div 
                className="bg-green-50/30 dark:bg-gray-700/30 p-3 rounded shadow-sm border border-green-100/30 dark:border-gray-600/20"
                whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
              >
                <h4 className="text-sm font-semibold mb-1 text-gray-800 dark:text-gray-200">Growth Characteristics</h4>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300 text-sm">
                  {properties.deciduous !== undefined && (
                    <li>
                      <span className="font-medium">Leaf Type:</span>{" "}
                      <span>{properties.deciduous ? "Deciduous" : "Evergreen"}</span>
                    </li>
                  )}
                  {properties.shade_tolerant !== undefined && (
                    <li>
                      <span className="font-medium">Shade Tolerant:</span>{" "}
                      <span>{properties.shade_tolerant ? "Yes" : "No"}</span>
                    </li>
                  )}
                  {properties.shade_intolerant !== undefined && (
                    <li>
                      <span className="font-medium">Shade Intolerant:</span>{" "}
                      <span>{properties.shade_intolerant ? "Yes" : "No"}</span>
                    </li>
                  )}
                </ul>
              </motion.div>
            )}
          </div>
        </div>
        
        <div className="px-4 py-3 bg-gray-50/50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-700/50 flex justify-between items-center">
          <motion.button
            id="download-report-btn"
            onClick={generatePDF}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 
                     text-white text-sm font-medium rounded transition-colors duration-300 flex items-center"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Report
          </motion.button>
          
          <div className="flex items-center space-x-4">
            {processingTime && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Processing time: {processingTime}ms
              </p>
            )}
            
            {onClear && (
              <motion.button
                onClick={onClear}
                className="px-3 py-1.5 bg-gray-500 hover:bg-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 
                         text-white text-sm font-medium rounded transition-colors duration-300 flex items-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                aria-label="Clear results"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Clear Results
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default SpeciesCard;