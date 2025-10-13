import { NextResponse } from 'next/server';

interface ReliefWebEvent {
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
    const response = await fetch('https://api.reliefweb.int/v1/disasters?limit=50&sort[]=date:desc', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'HelpGlobe/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`ReliefWeb API error: ${response.status}`);
    }

    const data = await response.json();
    
    const events: ReliefWebEvent[] = data.data.map((item: any) => {
      const disaster = item.fields;
      
      let lat = 0;
      let lon = 0;
      
      if (disaster.country && disaster.country.length > 0) {
        const country = disaster.country[0];
        if (country.location && country.location.length > 0) {
          lat = country.location[0].lat;
          lon = country.location[0].lon;
        }
      }

      let summary = 'Disaster event reported';
      if (disaster.description && disaster.description.length > 0) {
        summary = disaster.description[0].substring(0, 200) + '...';
      }

      return {
        title: disaster.name || 'Disaster Event',
        lat,
        lon,
        summary,
        url: `https://reliefweb.int/disaster/${disaster.id}`,
        type: 'disaster',
        date: disaster.date?.created || new Date().toISOString(),
        source: 'ReliefWeb'
      };
    }).filter((event: ReliefWebEvent) => event.lat !== 0 && event.lon !== 0);

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching ReliefWeb data:', error);
    return NextResponse.json({ error: 'Failed to fetch ReliefWeb data' }, { status: 500 });
  }
}
