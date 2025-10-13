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
    // Fetch data from all three APIs in parallel with better error handling
    const [reliefWebResponse, earthquakesResponse, gdeltResponse] = await Promise.allSettled([
      fetch('https://api.reliefweb.int/v1/disasters?limit=50&sort[]=date:desc&filter[field]=date&filter[value][from]=2024-01-01', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'HelpGlobe/1.0'
        }
      }),
      fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'HelpGlobe/1.0'
        }
      }),
      fetch('https://api.gdeltproject.org/api/v2/doc/doc?query=disaster OR earthquake OR conflict OR protest OR health&mode=artlist&maxrecords=50&format=json&sort=date', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'HelpGlobe/1.0'
        }
      })
    ]);

    let reliefWebData: Event[] = [];
    let earthquakesData: Event[] = [];
    let gdeltData: Event[] = [];

    // Process ReliefWeb data
    if (reliefWebResponse.status === 'fulfilled' && reliefWebResponse.value.ok) {
      const reliefWebJson = await reliefWebResponse.value.json();
      reliefWebData = reliefWebJson.data.map((item: any) => {
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
      }).filter((event: Event) => event.lat !== 0 && event.lon !== 0);
    }

    // Process USGS earthquake data
    if (earthquakesResponse.status === 'fulfilled' && earthquakesResponse.value.ok) {
      const earthquakesJson = await earthquakesResponse.value.json();
      earthquakesData = earthquakesJson.features.map((feature: any) => {
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
    }

    // Process GDELT data
    if (gdeltResponse.status === 'fulfilled' && gdeltResponse.value.ok) {
      const gdeltJson = await gdeltResponse.value.json();
      gdeltData = gdeltJson.articles?.map((article: any) => {
        let lat = 0;
        let lon = 0;
        
        const locationKeywords = ['earthquake', 'flood', 'fire', 'conflict', 'protest', 'disaster'];
        const hasLocation = locationKeywords.some(keyword => 
          article.title?.toLowerCase().includes(keyword) || 
          article.snippet?.toLowerCase().includes(keyword)
        );

        if (hasLocation) {
          lat = 20 + Math.random() * 50;
          lon = -120 + Math.random() * 60;
        }

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
      }).filter((event: Event) => event.lat !== 0 && event.lon !== 0) || [];
    }

    // Combine and sort by date
    let allEvents: Event[] = [...reliefWebData, ...earthquakesData, ...gdeltData]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Add some demo data if we don't have enough real data
    if (allEvents.length < 5) {
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
        }
      ];
      allEvents = [...allEvents, ...demoEvents];
    }

    return NextResponse.json(allEvents);
  } catch (error) {
    console.error('Error fetching combined events data:', error);
    return NextResponse.json({ error: 'Failed to fetch events data' }, { status: 500 });
  }
}
