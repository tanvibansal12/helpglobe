'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Globe to avoid SSR issues
const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

interface Event {
  title: string;
  lat: number;
  lon: number;
  summary: string;
  url: string;
  type: string;
  date: string;
  magnitude?: number;
  source: string;
}

interface GlobeProps {
  events: Event[];
  onEventClick: (event: Event) => void;
}

export default function GlobeComponent({ events, onEventClick }: GlobeProps) {
  const globeRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (globeRef.current) {
      // Set initial camera position for cinematic view
      globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2.5 });
      
      // Add auto-rotation for cinematic effect
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 0.5;
    }
  }, []);

  // Get color based on event type with glow effects
  const getEventColor = (type: string) => {
    switch (type) {
      case 'conflict':
        return '#ff4444'; // bright red
      case 'disaster':
        return '#4488ff'; // bright blue
      case 'protest':
        return '#ffdd44'; // bright yellow
      case 'health':
        return '#44ff88'; // bright green
      case 'earthquake':
        return '#ff8844'; // bright orange
      default:
        return '#aa44ff'; // bright purple
    }
  };

  // Prepare data for the globe with enhanced visuals
  const globeData = events.map(event => ({
    lat: event.lat,
    lng: event.lon,
    size: event.magnitude ? Math.max(0.8, event.magnitude / 8) : 0.8,
    color: getEventColor(event.type),
    event: event,
    // Add glow effect
    glow: true,
    glowColor: getEventColor(event.type),
    glowSize: event.magnitude ? Math.max(1.2, event.magnitude / 6) : 1.2
  }));

  const handlePointClick = (point: any) => {
    if (point.event) {
      onEventClick(point.event);
    }
  };

  return (
    <div className="w-full h-full relative globe-container">
      {typeof window !== 'undefined' && (
        <Globe
          ref={globeRef}
          // High-quality Earth texture
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          // Space background
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
          
          // Enhanced point rendering
          pointsData={globeData}
          pointLat="lat"
          pointLng="lng"
          pointColor="color"
          pointRadius="size"
          pointResolution={12}
          pointAltitude={0.01}
          
          // Add glow effects
          pointLabel={() => ''}
          onPointClick={handlePointClick}
          
          // Globe settings
          width={1200}
          height={800}
          backgroundColor="rgba(0,0,0,0)"
          
          // Enhanced atmosphere
          showAtmosphere={true}
          atmosphereColor="#4a9eff"
          atmosphereAltitude={0.2}
          
          // Lighting and effects
          enablePointerInteraction={true}
          onGlobeReady={() => setIsLoaded(true)}
          
          // Add arcs for connections (optional)
          arcsData={[]}
          
          // Enhanced controls
          controls={{
            enableZoom: true,
            enablePan: true,
            enableRotate: true,
            autoRotate: true,
            autoRotateSpeed: 0.3,
            minDistance: 1.5,
            maxDistance: 5
          }}
        />
      )}
      
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-6 animate-glow"></div>
            <div className="text-white text-xl font-medium">Loading 3D Globe...</div>
            <div className="text-gray-400 text-sm mt-2">Fetching real-time data</div>
          </div>
        </div>
      )}
      
      {/* Floating UI overlay */}
      <div className="absolute top-6 right-6 bg-gray-900/80 backdrop-blur-xl rounded-xl shadow-2xl p-4 border border-gray-700/50">
        <div className="text-sm text-gray-300">
          <div className="font-medium text-white mb-2">🌍 HelpGlobe</div>
          <div className="text-xs text-gray-400">
            {events.length} active events
          </div>
          <div className="text-xs text-gray-400">
            Click markers for details
          </div>
        </div>
      </div>
    </div>
  );
}
