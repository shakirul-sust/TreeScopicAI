import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/MeasurementTool.css';

const MeasurementTool = ({ isOpen, onClose, currentImage }) => {
  // State for measurement tool
  const [activeMode, setActiveMode] = useState('scale'); // 'scale', 'line', 'polygon'
  const [scale, setScale] = useState(null); // pixels per unit
  const [unit, setUnit] = useState('cm');
  const [knownLength, setKnownLength] = useState('');
  const [pixelLength, setPixelLength] = useState(0);
  const [measurements, setMeasurements] = useState({
    length: 0,
    area: 0,
    perimeter: 0
  });
  const [points, setPoints] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Refs
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  
  // Canvas context ref
  const ctxRef = useRef(null);
  
  // Initialize canvas when component mounts or image changes
  useEffect(() => {
    if (!currentImage || !isOpen) return;
    
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const image = new Image();
    image.src = currentImage;
    
    image.onload = () => {
      // Set canvas dimensions to match image
      if (container) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Calculate aspect ratio to fit image within container
        const imageAspectRatio = image.width / image.height;
        const containerAspectRatio = containerWidth / containerHeight;
        
        let canvasWidth, canvasHeight;
        
        if (imageAspectRatio > containerAspectRatio) {
          // Image is wider than container (relative to height)
          canvasWidth = containerWidth;
          canvasHeight = containerWidth / imageAspectRatio;
        } else {
          // Image is taller than container (relative to width)
          canvasHeight = containerHeight;
          canvasWidth = containerHeight * imageAspectRatio;
        }
        
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        // Store the image reference
        imageRef.current = {
          element: image,
          originalWidth: image.width,
          originalHeight: image.height,
          displayWidth: canvasWidth,
          displayHeight: canvasHeight,
          scaleRatio: image.width / canvasWidth // Ratio of original to displayed size
        };
        
        // Initialize canvas context
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, canvasWidth, canvasHeight);
        ctxRef.current = ctx;
      }
    };
    
    // Reset state when opening
    setPoints([]);
    setActiveMode('scale');
    setScale(null);
    setKnownLength('');
    setPixelLength(0);
    
  }, [currentImage, isOpen]);
  
  // Handle canvas click/drag events
  const handleCanvasMouseDown = (e) => {
    if (!canvasRef.current || !isOpen) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (activeMode === 'scale' || activeMode === 'line') {
      setIsDrawing(true);
      setPoints([{ x, y }]);
    } else if (activeMode === 'polygon') {
      // For polygon, add point to existing points
      setPoints([...points, { x, y }]);
    }
  };
  
  const handleCanvasMouseMove = (e) => {
    if (!isDrawing || !canvasRef.current || !isOpen) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (activeMode === 'scale' || activeMode === 'line') {
      // Update the second point while dragging
      setPoints([points[0], { x, y }]);
      redrawCanvas();
    }
  };
  
  const handleCanvasMouseUp = () => {
    if (!isDrawing || !canvasRef.current || !isOpen || activeMode === 'polygon') return;
    
    setIsDrawing(false);
    
    if (points.length === 2) {
      // Calculate distance between points
      const dx = points[1].x - points[0].x;
      const dy = points[1].y - points[0].y;
      const pixelDist = Math.sqrt(dx * dx + dy * dy);
      
      // Convert to actual pixels in original image
      const actualPixelDist = pixelDist * imageRef.current.scaleRatio;
      setPixelLength(Math.round(actualPixelDist));
      
      if (activeMode === 'line' && scale) {
        // Calculate real-world length
        const realLength = actualPixelDist / scale;
        setMeasurements({
          ...measurements,
          length: realLength
        });
      }
    }
  };
  
  const handlePolygonComplete = () => {
    if (points.length < 3) return;
    
    // Close the polygon
    calculatePolygonMeasurements();
    redrawCanvas();
  };
  
  const calculatePolygonMeasurements = () => {
    if (!scale || points.length < 3) return;
    
    // Calculate perimeter
    let perimeter = 0;
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      perimeter += Math.sqrt(dx * dx + dy * dy);
    }
    
    // Convert to real-world units
    const realPerimeter = (perimeter * imageRef.current.scaleRatio) / scale;
    
    // Calculate area using Shoelace formula
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      area += (p1.x * p2.y) - (p2.x * p1.y);
    }
    area = Math.abs(area) / 2;
    
    // Convert to real-world units
    const realArea = (area * Math.pow(imageRef.current.scaleRatio, 2)) / (scale * scale);
    
    setMeasurements({
      ...measurements,
      perimeter: realPerimeter,
      area: realArea
    });
  };
  
  // Redraw canvas with current points and measurements
  const redrawCanvas = () => {
    if (!canvasRef.current || !ctxRef.current || !imageRef.current) return;
    
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw image
    ctx.drawImage(
      imageRef.current.element, 
      0, 0, 
      canvas.width, 
      canvas.height
    );
    
    // Set drawing styles
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#00FF00';
    ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
    
    // Draw based on active mode
    if (activeMode === 'scale' || activeMode === 'line') {
      if (points.length >= 2) {
        // Draw line
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
        ctx.stroke();
        
        // Draw endpoints
        ctx.fillStyle = '#00FF00';
        points.forEach(point => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
          ctx.fill();
        });
        
        // Draw length text
        const midX = (points[0].x + points[1].x) / 2;
        const midY = (points[0].y + points[1].y) / 2;
        const dx = points[1].x - points[0].x;
        const dy = points[1].y - points[0].y;
        const pixelDist = Math.sqrt(dx * dx + dy * dy);
        
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.font = '14px Arial';
        ctx.lineWidth = 3;
        ctx.strokeText(`${pixelDist.toFixed(1)}px`, midX + 10, midY);
        ctx.fillText(`${pixelDist.toFixed(1)}px`, midX + 10, midY);
        
        if (scale) {
          const realDist = (pixelDist * imageRef.current.scaleRatio) / scale;
          ctx.strokeText(`${realDist.toFixed(2)}${unit}`, midX + 10, midY + 20);
          ctx.fillText(`${realDist.toFixed(2)}${unit}`, midX + 10, midY + 20);
        }
      }
    } else if (activeMode === 'polygon') {
      if (points.length > 0) {
        // Draw polygon
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        
        if (points.length >= 3) {
          ctx.closePath();
          ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
          ctx.fill();
        }
        
        ctx.stroke();
        
        // Draw vertices
        ctx.fillStyle = '#00FF00';
        points.forEach(point => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    }
  };
  
  // Handle scale calculation
  const calculateScale = () => {
    if (pixelLength > 0 && knownLength && knownLength > 0) {
      const newScale = pixelLength / parseFloat(knownLength);
      setScale(newScale);
      
      // Reset points for next measurement
      setPoints([]);
      setActiveMode('line');
    }
  };
  
  // Reset all measurements
  const resetMeasurements = () => {
    setPoints([]);
    redrawCanvas();
  };
  
  // Save annotated image
  const saveAnnotatedImage = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = 'treescope-measurement.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };
  
  // Effect to redraw canvas when points change
  useEffect(() => {
    redrawCanvas();
  }, [points, activeMode]);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 right-0 w-full sm:w-[500px] h-full bg-white dark:bg-gray-800 shadow-xl z-50 flex flex-col"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Measurement & Scale
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Tool Selection */}
          <div className="flex justify-center p-4 space-x-4 border-b dark:border-gray-700">
            <button
              onClick={() => setActiveMode('scale')}
              className={`px-3 py-2 rounded-lg ${
                activeMode === 'scale'
                  ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
              title="Set scale by drawing a line of known length"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-sm">Set Scale</span>
            </button>
            
            <button
              onClick={() => setActiveMode('line')}
              disabled={!scale}
              className={`px-3 py-2 rounded-lg ${
                activeMode === 'line'
                  ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200'
                  : scale 
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
              title="Measure a straight line"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16" />
              </svg>
              <span className="text-sm">Line</span>
            </button>
            
            <button
              onClick={() => setActiveMode('polygon')}
              disabled={!scale}
              className={`px-3 py-2 rounded-lg ${
                activeMode === 'polygon'
                  ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200'
                  : scale
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
              title="Draw a polygon to measure area"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8l8 4 8-4M4 16l8 4 8-4" />
              </svg>
              <span className="text-sm">Polygon</span>
            </button>
          </div>
          
          {/* Canvas Container */}
          <div 
            ref={containerRef}
            className="flex-grow relative overflow-hidden bg-gray-900 flex items-center justify-center"
          >
            <canvas
              ref={canvasRef}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              className="max-w-full max-h-full"
            />
            
            {/* Instructions overlay */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white p-2 rounded text-sm">
              {activeMode === 'scale' && (
                <p>Draw a line of known length</p>
              )}
              {activeMode === 'line' && (
                <p>Click and drag to measure distance</p>
              )}
              {activeMode === 'polygon' && (
                <>
                  <p>Click to add points, then</p>
                  <button 
                    onClick={handlePolygonComplete}
                    className="bg-green-600 px-2 py-1 rounded mt-1 text-xs"
                  >
                    Complete Shape
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* Measurement Controls */}
          <div className="p-4 border-t dark:border-gray-700">
            {activeMode === 'scale' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Pixel Length
                    </label>
                    <input
                      type="text"
                      value={pixelLength}
                      readOnly
                      className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-700 dark:text-gray-200"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Known Length
                    </label>
                    <input
                      type="number"
                      value={knownLength}
                      onChange={(e) => setKnownLength(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div className="w-20">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Unit
                    </label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="mm">mm</option>
                      <option value="cm">cm</option>
                      <option value="m">m</option>
                      <option value="in">in</option>
                    </select>
                  </div>
                </div>
                
                <button
                  onClick={calculateScale}
                  disabled={!pixelLength || !knownLength}
                  className={`w-full py-2 rounded-md ${
                    pixelLength && knownLength
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Set Scale
                </button>
                
                {scale && (
                  <div className="text-center text-green-600 dark:text-green-400 font-medium">
                    Scale: {scale.toFixed(2)} pixels/{unit}
                  </div>
                )}
              </div>
            )}
            
            {(activeMode === 'line' || activeMode === 'polygon') && (
              <div className="space-y-4">
                {/* Measurement results */}
                <div className="grid grid-cols-2 gap-4">
                  {activeMode === 'line' && (
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Length</div>
                      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        {measurements.length.toFixed(2)} {unit}
                      </div>
                    </div>
                  )}
                  
                  {activeMode === 'polygon' && (
                    <>
                      <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Area</div>
                        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                          {measurements.area.toFixed(2)} {unit}²
                        </div>
                      </div>
                      
                      <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Perimeter</div>
                        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                          {measurements.perimeter.toFixed(2)} {unit}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="flex space-x-4">
                  <button
                    onClick={resetMeasurements}
                    className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md"
                  >
                    Reset
                  </button>
                  
                  <button
                    onClick={saveAnnotatedImage}
                    className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
                  >
                    Save Image
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MeasurementTool; 