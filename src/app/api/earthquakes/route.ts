import { NextResponse } from 'next/server';

interface EarthquakeEvent {
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

export async function GET() {
  try {
    const response = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'HelpGlobe/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`USGS API error: ${response.status}`);
    }

    const data = await response.json();
    
    const events: EarthquakeEvent[] = data.features.map((feature: any) => {
      const props = feature.properties;
      const coords = feature.geometry.coordinates;
      
      const magnitude = props.mag;
      const place = props.place;
      const time = new Date(props.time).toISOString();
      
      let summary = `Magnitude ${magnitude} earthquake`;
      if (magnitude >= 6.0) {
        summary += ' - Major earthquake that may cause significant damage';
      } else if (magnitude >= 4.0) {
        summary += ' - Moderate earthquake';
      } else {
        summary += ' - Minor earthquake';
      }
      
      if (place) {
        summary += ` near ${place}`;
      }

      return {
        title: `Earthquake - ${place || 'Unknown Location'}`,
        lat: coords[1],
        lon: coords[0],
        summary,
        url: props.url || `https://earthquake.usgs.gov/earthquakes/eventpage/${props.ids}`,
        type: 'earthquake',
        date: time,
        magnitude,
        source: 'USGS'
      };
    }).filter((event: EarthquakeEvent) => event.magnitude && event.magnitude >= 3.0);

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching USGS earthquake data:', error);
    return NextResponse.json({ error: 'Failed to fetch earthquake data' }, { status: 500 });
  }
}
