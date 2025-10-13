import { NextResponse } from 'next/server';

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

export async function GET() {
  try {
    console.log('Fetching events data...');
    
    // Start with demo data and try to enhance with real data
    let allEvents: Event[] = [];
    
    // Try to fetch USGS earthquake data (most reliable)
    try {
      console.log('Fetching USGS earthquake data...');
      const earthquakesResponse = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'HelpGlobe/1.0'
        }
      });
      
      if (earthquakesResponse.ok) {
        const earthquakesJson = await earthquakesResponse.json();
        const earthquakesData = earthquakesJson.features.map((feature: any) => {
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
        }).filter((event: Event) => event.magnitude && event.magnitude >= 3.0);
        
        allEvents = [...allEvents, ...earthquakesData];
        console.log(`Added ${earthquakesData.length} earthquake events`);
      }
    } catch (error) {
      console.log('USGS API failed:', error);
    }

    // Always add demo data to ensure we have markers
    const demoEvents: Event[] = [
      {
        title: "Major Earthquake in Japan",
        lat: 35.6762,
        lon: 139.6503,
        summary: "Magnitude 7.2 earthquake strikes near Tokyo, causing significant damage and triggering tsunami warnings.",
        url: "https://example.com",
        type: "earthquake",
        date: new Date().toISOString(),
        magnitude: 7.2,
        source: "Demo"
      },
      {
        title: "Flooding in Bangladesh",
        lat: 23.6850,
        lon: 90.3563,
        summary: "Severe flooding affects millions in Bangladesh, with thousands displaced and in need of emergency assistance.",
        url: "https://example.com",
        type: "disaster",
        date: new Date(Date.now() - 3600000).toISOString(),
        source: "Demo"
      },
      {
        title: "Conflict in Ukraine",
        lat: 50.4501,
        lon: 30.5234,
        summary: "Ongoing conflict situation requiring humanitarian aid and medical assistance.",
        url: "https://example.com",
        type: "conflict",
        date: new Date(Date.now() - 7200000).toISOString(),
        source: "Demo"
      },
      {
        title: "Health Emergency in Africa",
        lat: -1.2921,
        lon: 36.8219,
        summary: "Health crisis requiring immediate medical assistance and supplies.",
        url: "https://example.com",
        type: "health",
        date: new Date(Date.now() - 10800000).toISOString(),
        source: "Demo"
      },
      {
        title: "Protest in France",
        lat: 48.8566,
        lon: 2.3522,
        summary: "Large-scale protests in Paris requiring monitoring and potential assistance.",
        url: "https://example.com",
        type: "protest",
        date: new Date(Date.now() - 14400000).toISOString(),
        source: "Demo"
      },
      {
        title: "Wildfire in California",
        lat: 37.7749,
        lon: -122.4194,
        summary: "Large wildfire spreading rapidly, requiring emergency evacuation and firefighting resources.",
        url: "https://example.com",
        type: "disaster",
        date: new Date(Date.now() - 18000000).toISOString(),
        source: "Demo"
      },
      {
        title: "Earthquake in Turkey",
        lat: 39.9334,
        lon: 32.8597,
        summary: "Magnitude 6.5 earthquake in central Turkey, causing building collapses and casualties.",
        url: "https://example.com",
        type: "earthquake",
        date: new Date(Date.now() - 21600000).toISOString(),
        magnitude: 6.5,
        source: "Demo"
      }
    ];
    
    allEvents = [...allEvents, ...demoEvents];
    console.log(`Total events: ${allEvents.length}`);

    return NextResponse.json(allEvents);
  } catch (error) {
    console.error('Error fetching combined events data:', error);
    return NextResponse.json({ error: 'Failed to fetch events data' }, { status: 500 });
  }
}
