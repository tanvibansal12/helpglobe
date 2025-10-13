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
      globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2.5 });
    }
  }, []);

  // Get color based on event type
  const getEventColor = (type: string) => {
    switch (type) {
      case 'conflict':
        return '#ef4444'; // red
      case 'disaster':
        return '#3b82f6'; // blue
      case 'protest':
        return '#eab308'; // yellow
      case 'health':
        return '#22c55e'; // green
      case 'earthquake':
        return '#f97316'; // orange
      default:
        return '#8b5cf6'; // purple
    }
  };

  // Prepare data for the globe
  const globeData = events.map(event => ({
    lat: event.lat,
    lng: event.lon,
    size: event.magnitude ? Math.max(0.5, event.magnitude / 10) : 0.5,
    color: getEventColor(event.type),
    event: event
  }));

  const handlePointClick = (point: any) => {
    if (point.event) {
      onEventClick(point.event);
    }
  };

  return (
    <div className="w-full h-full relative">
      {typeof window !== 'undefined' && (
        <Globe
          ref={globeRef}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
          pointsData={globeData}
          pointLat="lat"
          pointLng="lng"
          pointColor="color"
          pointRadius="size"
          pointResolution={8}
          onPointClick={handlePointClick}
          width={800}
          height={600}
          backgroundColor="rgba(0,0,0,0)"
          showAtmosphere={true}
          atmosphereColor="#4a9eff"
          atmosphereAltitude={0.15}
          enablePointerInteraction={true}
          onGlobeReady={() => setIsLoaded(true)}
        />
      )}
      
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <div className="text-white text-lg">Loading Globe...</div>
          </div>
        </div>
      )}
    </div>
  );
}
