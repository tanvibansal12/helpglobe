// API Configuration
export const API_ENDPOINTS = {
  EARTHQUAKES: '/api/earthquakes',
  EVENTS: '/api/events',
  GDELT: '/api/gdelt',
  RELIEFWEB: '/api/reliefweb',
} as const;

// Map Configuration
export const MAP_CONFIG = {
  DEFAULT_ZOOM: 2,
  DEFAULT_CENTER: [0, 0],
  MAX_ZOOM: 10,
  MIN_ZOOM: 1,
} as const;

// Data Refresh Intervals (in milliseconds)
export const REFRESH_INTERVALS = {
  EARTHQUAKES: 5 * 60 * 1000, // 5 minutes
  EVENTS: 10 * 60 * 1000, // 10 minutes
  GDELT: 15 * 60 * 1000, // 15 minutes
  RELIEFWEB: 30 * 60 * 1000, // 30 minutes
} as const;
