// Earthquake data types
export interface Earthquake {
  id: string;
  magnitude: number;
  place: string;
  time: number;
  coordinates: [number, number]; // [longitude, latitude]
  depth: number;
  url: string;
}

// Event data types
export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  coordinates: [number, number];
  date: string;
  source: string;
  url: string;
}

// GDELT data types
export interface GDELTEvent {
  id: string;
  date: string;
  source: string;
  target: string;
  eventCode: string;
  latitude: number;
  longitude: number;
  country: string;
  intensity: number;
}

// ReliefWeb data types
export interface ReliefWebAlert {
  id: string;
  title: string;
  description: string;
  country: string;
  coordinates: [number, number];
  date: string;
  source: string;
  url: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Map marker types
export interface MapMarker {
  id: string;
  type: 'earthquake' | 'event' | 'gdelt' | 'reliefweb';
  coordinates: [number, number];
  data: Earthquake | Event | GDELTEvent | ReliefWebAlert;
}
