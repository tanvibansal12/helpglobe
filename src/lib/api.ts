// API client for external data sources
export class APIClient {
  private baseURL: string;
  private timeout: number;

  constructor(baseURL: string, timeout: number = 10000) {
    this.baseURL = baseURL;
    this.timeout = timeout;
  }

  async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }
}

// Specific API clients for different data sources
export const earthquakeAPI = new APIClient('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary');
export const reliefWebAPI = new APIClient('https://api.reliefweb.int/v1');
export const gdeltAPI = new APIClient('https://api.gdeltproject.org/api/v2');

// Utility function to handle API errors
export function handleAPIError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}
