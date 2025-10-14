import { NextResponse } from 'next/server';

interface GDELTEvent {
  title: string;
  lat: number;
  lon: number;
  summary: string;
  url: string;
  type: string;
  date: string;
  source: string;
}

export async function GET() {
  try {
    // GDELT API endpoint for recent events
    const response = await fetch('https://api.gdeltproject.org/api/v2/doc/doc?query=*&mode=artlist&maxrecords=50&format=json&sort=date', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'HelpGlobe/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`GDELT API error: ${response.status}`);
    }

    const data = await response.json();
    
    const events: GDELTEvent[] = data.articles?.map((article: any) => {
      // Extract location from article title or content
      let lat = 0;
      let lon = 0;
      
      // Simple geocoding - in a real app, you'd use a proper geocoding service
      const locationKeywords = ['earthquake', 'flood', 'fire', 'conflict', 'protest', 'disaster'];
      const hasLocation = locationKeywords.some(keyword => 
        article.title?.toLowerCase().includes(keyword) || 
        article.snippet?.toLowerCase().includes(keyword)
      );

      if (hasLocation) {
        // Use approximate coordinates for demonstration
        // In production, you'd geocode the actual locations
        lat = 20 + Math.random() * 50; // Random coordinates for demo
        lon = -120 + Math.random() * 60;
      }

      // Determine event type based on content
      let eventType = 'news';
      const title = article.title?.toLowerCase() || '';
      const snippet = article.snippet?.toLowerCase() || '';
      
      if (title.includes('earthquake') || snippet.includes('earthquake')) {
        eventType = 'earthquake';
      } else if (title.includes('flood') || snippet.includes('flood')) {
        eventType = 'disaster';
      } else if (title.includes('protest') || snippet.includes('protest')) {
        eventType = 'protest';
      } else if (title.includes('conflict') || snippet.includes('conflict')) {
        eventType = 'conflict';
      } else if (title.includes('health') || snippet.includes('health')) {
        eventType = 'health';
      }

      return {
        title: article.title || 'Global News Event',
        lat,
        lon,
        summary: article.snippet || 'News event reported',
        url: article.url || '#',
        type: eventType,
        date: article.seendate || new Date().toISOString(),
        source: 'GDELT'
      };
    }).filter((event: GDELTEvent) => event.lat !== 0 && event.lon !== 0) || [];

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching GDELT data:', error);
    return NextResponse.json({ error: 'Failed to fetch GDELT data' }, { status: 500 });
  }
}
