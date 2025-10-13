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

    // Try to fetch ReliefWeb disaster data
    try {
      console.log('Fetching ReliefWeb disaster data...');
      const reliefWebResponse = await fetch('https://api.reliefweb.int/v1/disasters?limit=20&sort[]=date:desc&filter[field]=date&filter[value][from]=2024-01-01', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'HelpGlobe/1.0'
        }
      });
      
      if (reliefWebResponse.ok) {
        const reliefWebJson = await reliefWebResponse.json();
        const reliefWebData = reliefWebJson.data.map((item: any) => {
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
        
        allEvents = [...allEvents, ...reliefWebData];
        console.log(`Added ${reliefWebData.length} disaster events`);
      }
    } catch (error) {
      console.log('ReliefWeb API failed:', error);
    }

    // Try to fetch GDELT news data for conflicts and protests
    try {
      console.log('Fetching GDELT news data...');
      const gdeltResponse = await fetch('https://api.gdeltproject.org/api/v2/doc/doc?query=conflict OR protest OR health emergency OR disaster&mode=artlist&maxrecords=20&format=json&sort=date', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'HelpGlobe/1.0'
        }
      });
      
      if (gdeltResponse.ok) {
        const gdeltJson = await gdeltResponse.json();
        const gdeltData = gdeltJson.articles?.map((article: any) => {
          // Use a simple geocoding approach for demo purposes
          // In production, you'd use a proper geocoding service
          const title = article.title?.toLowerCase() || '';
          const snippet = article.snippet?.toLowerCase() || '';
          
          // Simple location mapping based on keywords
          let lat = 0;
          let lon = 0;
          let eventType = 'news';
          
          if (title.includes('ukraine') || snippet.includes('ukraine')) {
            lat = 50.4501; lon = 30.5234; eventType = 'conflict';
          } else if (title.includes('gaza') || snippet.includes('gaza')) {
            lat = 31.3547; lon = 34.3088; eventType = 'conflict';
          } else if (title.includes('syria') || snippet.includes('syria')) {
            lat = 33.5138; lon = 36.2765; eventType = 'conflict';
          } else if (title.includes('afghanistan') || snippet.includes('afghanistan')) {
            lat = 33.9391; lon = 67.7100; eventType = 'conflict';
          } else if (title.includes('protest') || snippet.includes('protest')) {
            lat = 40.7128; lon = -74.0060; eventType = 'protest'; // Default to NYC
          } else if (title.includes('health') || snippet.includes('health')) {
            lat = -1.2921; lon = 36.8219; eventType = 'health'; // Default to Kenya
          } else if (title.includes('flood') || snippet.includes('flood')) {
            lat = 23.6850; lon = 90.3563; eventType = 'disaster'; // Bangladesh
          } else {
            // Skip this article if no clear location
            return null;
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
        }).filter((event: Event | null) => event !== null) || [];
        
        allEvents = [...allEvents, ...gdeltData];
        console.log(`Added ${gdeltData.length} news events`);
      }
    } catch (error) {
      console.log('GDELT API failed:', error);
    }

    // Try to fetch additional news data from a more reliable source
    try {
      console.log('Fetching additional news data...');
      // Using a free news API (you can replace with your preferred news source)
      const newsResponse = await fetch('https://newsapi.org/v2/everything?q=disaster OR conflict OR protest OR health emergency&sortBy=publishedAt&pageSize=10&apiKey=demo', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'HelpGlobe/1.0'
        }
      });
      
      if (newsResponse.ok) {
        const newsJson = await newsResponse.json();
        const newsData = newsJson.articles?.map((article: any) => {
          const title = article.title?.toLowerCase() || '';
          const description = article.description?.toLowerCase() || '';
          
          // Simple location and type detection
          let lat = 0;
          let lon = 0;
          let eventType = 'news';
          
          if (title.includes('ukraine') || description.includes('ukraine')) {
            lat = 50.4501; lon = 30.5234; eventType = 'conflict';
          } else if (title.includes('gaza') || description.includes('gaza')) {
            lat = 31.3547; lon = 34.3088; eventType = 'conflict';
          } else if (title.includes('earthquake') || description.includes('earthquake')) {
            lat = 35.6762; lon = 139.6503; eventType = 'earthquake';
          } else if (title.includes('flood') || description.includes('flood')) {
            lat = 23.6850; lon = 90.3563; eventType = 'disaster';
          } else if (title.includes('protest') || description.includes('protest')) {
            lat = 40.7128; lon = -74.0060; eventType = 'protest';
          } else if (title.includes('health') || description.includes('health')) {
            lat = -1.2921; lon = 36.8219; eventType = 'health';
          } else {
            return null; // Skip if no clear location/type
          }

          return {
            title: article.title || 'News Event',
            lat,
            lon,
            summary: article.description || 'News event reported',
            url: article.url || '#',
            type: eventType,
            date: article.publishedAt || new Date().toISOString(),
            source: 'NewsAPI'
          };
        }).filter((event: Event | null) => event !== null) || [];
        
        allEvents = [...allEvents, ...newsData];
        console.log(`Added ${newsData.length} news events`);
      }
    } catch (error) {
      console.log('News API failed:', error);
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
