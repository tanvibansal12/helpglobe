'use client';

import { useState, useCallback } from 'react';

interface MapControls {
  zoom: number;
  center: [number, number];
  rotation: [number, number, number];
}

interface UseMapControlsReturn {
  controls: MapControls;
  setZoom: (zoom: number) => void;
  setCenter: (center: [number, number]) => void;
  setRotation: (rotation: [number, number, number]) => void;
  resetView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

const DEFAULT_CONTROLS: MapControls = {
  zoom: 2,
  center: [0, 0],
  rotation: [0, 0, 0],
};

export function useMapControls(): UseMapControlsReturn {
  const [controls, setControls] = useState<MapControls>(DEFAULT_CONTROLS);

  const setZoom = useCallback((zoom: number) => {
    setControls(prev => ({ ...prev, zoom: Math.max(0.5, Math.min(10, zoom)) }));
  }, []);

  const setCenter = useCallback((center: [number, number]) => {
    setControls(prev => ({ ...prev, center }));
  }, []);

  const setRotation = useCallback((rotation: [number, number, number]) => {
    setControls(prev => ({ ...prev, rotation }));
  }, []);

  const resetView = useCallback(() => {
    setControls(DEFAULT_CONTROLS);
  }, []);

  const zoomIn = useCallback(() => {
    setControls(prev => ({ 
      ...prev, 
      zoom: Math.min(10, prev.zoom + 0.5) 
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setControls(prev => ({ 
      ...prev, 
      zoom: Math.max(0.5, prev.zoom - 0.5) 
    }));
  }, []);

  return {
    controls,
    setZoom,
    setCenter,
    setRotation,
    resetView,
    zoomIn,
    zoomOut,
  };
}
