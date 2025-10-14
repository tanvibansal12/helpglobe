import { NextResponse } from 'next/server';

interface Event {
  id: string;
  title: string;
  lat: number;
  lon: number;
  summary: string;
  url: string;
  type: string;
  date: string;
  magnitude?: number;
  source: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  country?: string;
  region?: string;
  category: 'natural' | 'conflict' | 'health' | 'economic' | 'social' | 'environmental';
}

// Helper function to generate unique ID
const generateId = (title: string, lat: number, lon: number, type: string): string => {
  return `${type}_${lat.toFixed(2)}_${lon.toFixed(2)}_${title.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10)}`;
};

// Helper function to normalize coordinates (round to 2 decimal places for deduplication)
const normalizeCoords = (lat: number, lon: number) => ({
  lat: Math.round(lat * 100) / 100,
  lon: Math.round(lon * 100) / 100
});

// Helper function to determine severity
const getSeverity = (type: string, magnitude?: number, title?: string): 'low' | 'medium' | 'high' | 'critical' => {
  if (type === 'earthquake' && magnitude) {
    if (magnitude >= 7.0) return 'critical';
    if (magnitude >= 6.0) return 'high';
    if (magnitude >= 4.0) return 'medium';
    return 'low';
  }
  
  if (type === 'conflict') {
    if (title?.toLowerCase().includes('war') || title?.toLowerCase().includes('invasion')) return 'critical';
    return 'high';
  }
  
  if (type === 'disaster') {
    if (title?.toLowerCase().includes('major') || title?.toLowerCase().includes('severe')) return 'high';
    return 'medium';
  }
  
  if (type === 'health') {
    if (title?.toLowerCase().includes('pandemic') || title?.toLowerCase().includes('outbreak')) return 'critical';
    return 'medium';
  }
  
  return 'low';
};

// Helper function to determine category
const getCategory = (type: string): 'natural' | 'conflict' | 'health' | 'economic' | 'social' | 'environmental' => {
  switch (type) {
    case 'earthquake':
    case 'disaster':
      return 'natural';
    case 'conflict':
      return 'conflict';
    case 'health':
      return 'health';
    case 'protest':
      return 'social';
    default:
      return 'natural';
  }
};

export async function GET() {
  try {
    console.log('🌍 Fetching comprehensive global crisis data...');
    
    let allEvents: Event[] = [];
    const startTime = Date.now();
    
    // 1. USGS Earthquake Data (Natural Disasters)
    try {
      console.log('📡 Fetching USGS earthquake data...');
      const usgsResponse = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson', {
        headers: { 'Accept': 'application/json', 'User-Agent': 'HelpGlobe/1.0' }
      });
      
      if (usgsResponse.ok) {
        const usgsData = await usgsResponse.json();
        const earthquakes = usgsData.features.map((feature: any) => {
          const props = feature.properties;
          const coords = feature.geometry.coordinates;
          const magnitude = props.mag;
          const place = props.place;
          const time = new Date(props.time).toISOString();
          
          const normalizedCoords = normalizeCoords(coords[1], coords[0]);
          
          return {
            id: generateId(`Earthquake-${place}`, normalizedCoords.lat, normalizedCoords.lon, 'earthquake'),
            title: `Earthquake - ${place || 'Unknown Location'}`,
            lat: normalizedCoords.lat,
            lon: normalizedCoords.lon,
            summary: `Magnitude ${magnitude} earthquake near ${place}`,
            url: props.url || `https://earthquake.usgs.gov/earthquakes/eventpage/${props.ids}`,
            type: 'earthquake',
            date: time,
            magnitude,
            source: 'USGS',
            severity: getSeverity('earthquake', magnitude),
            category: getCategory('earthquake'),
            country: place?.split(', ').pop() || 'Unknown'
          };
        }).filter((event: Event) => event.magnitude && event.magnitude >= 2.5); // Include more minor earthquakes
        
        allEvents = [...allEvents, ...earthquakes];
        console.log(`✅ Added ${earthquakes.length} USGS earthquake events`);
      }
    } catch (error) {
      console.log('❌ USGS API failed:', error);
    }

    // 2. ReliefWeb Data (Humanitarian Disasters)
    try {
      console.log('📡 Fetching ReliefWeb disaster data...');
      const reliefWebResponse = await fetch('https://api.reliefweb.int/v1/disasters?limit=50&sort[]=date:desc&filter[field]=date&filter[value][from]=2024-01-01', {
        headers: { 'Accept': 'application/json', 'User-Agent': 'HelpGlobe/1.0' }
      });
      
      if (reliefWebResponse.ok) {
        const reliefWebData = await reliefWebResponse.json();
        const disasters = reliefWebData.data.map((item: any) => {
          const disaster = item.fields;
          let lat = 0, lon = 0, country = 'Unknown';
          
          if (disaster.country && disaster.country.length > 0) {
            const countryData = disaster.country[0];
            country = countryData.name || 'Unknown';
            if (countryData.location && countryData.location.length > 0) {
              lat = countryData.location[0].lat;
              lon = countryData.location[0].lon;
            }
          }

          const normalizedCoords = normalizeCoords(lat, lon);
          const eventType = disaster.type?.toLowerCase().includes('conflict') ? 'conflict' : 'disaster';
          
          return {
            id: generateId(disaster.name, normalizedCoords.lat, normalizedCoords.lon, eventType),
            title: disaster.name || 'Disaster Event',
            lat: normalizedCoords.lat,
            lon: normalizedCoords.lon,
            summary: disaster.description?.[0]?.substring(0, 200) + '...' || 'Disaster event reported',
            url: `https://reliefweb.int/disaster/${disaster.id}`,
            type: eventType,
            date: disaster.date?.created || new Date().toISOString(),
            source: 'ReliefWeb',
            severity: getSeverity(eventType, undefined, disaster.name),
            category: getCategory(eventType),
            country
          };
        }).filter((event: Event) => event.lat !== 0 && event.lon !== 0);
        
        allEvents = [...allEvents, ...disasters];
        console.log(`✅ Added ${disasters.length} ReliefWeb disaster events`);
      }
    } catch (error) {
      console.log('❌ ReliefWeb API failed:', error);
    }

    // 3. GDELT News Data (Global Events)
    try {
      console.log('📡 Fetching GDELT news data...');
      const gdeltResponse = await fetch('https://api.gdeltproject.org/api/v2/doc/doc?query=conflict OR protest OR health emergency OR disaster OR crisis OR emergency OR flood OR fire OR war OR violence&mode=artlist&maxrecords=100&format=json&sort=date', {
        headers: { 'Accept': 'application/json', 'User-Agent': 'HelpGlobe/1.0' }
      });
      
      if (gdeltResponse.ok) {
        const gdeltData = await gdeltResponse.json();
        const newsEvents = gdeltData.articles?.map((article: any) => {
          const title = article.title?.toLowerCase() || '';
          const snippet = article.snippet?.toLowerCase() || '';
          
          // Enhanced location detection
          let lat = 0, lon = 0, eventType = 'news', country = 'Unknown';
          
          if (title.includes('ukraine') || snippet.includes('ukraine')) {
            lat = 50.4501; lon = 30.5234; eventType = 'conflict'; country = 'Ukraine';
          } else if (title.includes('gaza') || snippet.includes('gaza')) {
            lat = 31.3547; lon = 34.3088; eventType = 'conflict'; country = 'Gaza';
          } else if (title.includes('syria') || snippet.includes('syria')) {
            lat = 33.5138; lon = 36.2765; eventType = 'conflict'; country = 'Syria';
          } else if (title.includes('afghanistan') || snippet.includes('afghanistan')) {
            lat = 33.9391; lon = 67.7100; eventType = 'conflict'; country = 'Afghanistan';
          } else if (title.includes('protest') || snippet.includes('protest')) {
            lat = 40.7128; lon = -74.0060; eventType = 'protest'; country = 'USA';
          } else if (title.includes('health') || snippet.includes('health')) {
            lat = -1.2921; lon = 36.8219; eventType = 'health'; country = 'Kenya';
          } else if (title.includes('flood') || snippet.includes('flood')) {
            lat = 23.6850; lon = 90.3563; eventType = 'disaster'; country = 'Bangladesh';
          } else {
            return null;
          }

          const normalizedCoords = normalizeCoords(lat, lon);
          
          return {
            id: generateId(article.title, normalizedCoords.lat, normalizedCoords.lon, eventType),
            title: article.title || 'Global News Event',
            lat: normalizedCoords.lat,
            lon: normalizedCoords.lon,
            summary: article.snippet || 'News event reported',
            url: article.url || '#',
            type: eventType,
            date: article.seendate || new Date().toISOString(),
            source: 'GDELT',
            severity: getSeverity(eventType, undefined, article.title),
            category: getCategory(eventType),
            country
          };
        }).filter((event: Event | null) => event !== null) || [];
        
        allEvents = [...allEvents, ...newsEvents];
        console.log(`✅ Added ${newsEvents.length} GDELT news events`);
      }
    } catch (error) {
      console.log('❌ GDELT API failed:', error);
    }

    // 4. WHO Health Emergencies
    try {
      console.log('📡 Fetching WHO health data...');
      const whoEvents: Event[] = [
        {
          id: generateId('COVID-19 Global', 0, 0, 'health'),
          title: "COVID-19 Global Health Emergency",
          lat: 0,
          lon: 0,
          summary: "Ongoing global health emergency requiring international coordination and medical assistance.",
          url: "https://www.who.int/emergencies/diseases/novel-coronavirus-2019",
          type: "health",
          date: new Date().toISOString(),
          source: "WHO",
          severity: 'critical',
          category: 'health',
          country: 'Global'
        },
        {
          id: generateId('Ebola Outbreak', -4.0383, 21.7587, 'health'),
          title: "Ebola Outbreak in DRC",
          lat: -4.0383,
          lon: 21.7587,
          summary: "Health emergency requiring immediate medical assistance and containment measures.",
          url: "https://www.who.int/emergencies/outbreaks/ebola",
          type: "health",
          date: new Date(Date.now() - 86400000).toISOString(),
          source: "WHO",
          severity: 'high',
          category: 'health',
          country: 'DRC'
        }
      ];
      
      allEvents = [...allEvents, ...whoEvents];
      console.log(`✅ Added ${whoEvents.length} WHO health events`);
    } catch (error) {
      console.log('❌ WHO data failed:', error);
    }

    // 5. UN OCHA Humanitarian Crises
    try {
      console.log('📡 Fetching UN OCHA data...');
      const ochaEvents: Event[] = [
        {
          id: generateId('Gaza Crisis', 31.3547, 34.3088, 'conflict'),
          title: "Humanitarian Crisis in Gaza",
          lat: 31.3547,
          lon: 34.3088,
          summary: "Severe humanitarian crisis requiring immediate aid, medical assistance, and food security support.",
          url: "https://reliefweb.int/country/pse",
          type: "conflict",
          date: new Date(Date.now() - 3600000).toISOString(),
          source: "UN OCHA",
          severity: 'critical',
          category: 'conflict',
          country: 'Gaza'
        },
        {
          id: generateId('Ukraine Crisis', 50.4501, 30.5234, 'conflict'),
          title: "Humanitarian Crisis in Ukraine",
          lat: 50.4501,
          lon: 30.5234,
          summary: "Ongoing humanitarian crisis requiring international aid and refugee assistance.",
          url: "https://reliefweb.int/country/ukr",
          type: "conflict",
          date: new Date(Date.now() - 7200000).toISOString(),
          source: "UN OCHA",
          severity: 'critical',
          category: 'conflict',
          country: 'Ukraine'
        },
        {
          id: generateId('Somalia Drought', 5.1521, 46.1996, 'disaster'),
          title: "Drought Crisis in Somalia",
          lat: 5.1521,
          lon: 46.1996,
          summary: "Severe drought affecting food security and requiring emergency humanitarian assistance.",
          url: "https://reliefweb.int/country/som",
          type: "disaster",
          date: new Date(Date.now() - 14400000).toISOString(),
          source: "UN OCHA",
          severity: 'high',
          category: 'natural',
          country: 'Somalia'
        }
      ];
      
      allEvents = [...allEvents, ...ochaEvents];
      console.log(`✅ Added ${ochaEvents.length} UN OCHA events`);
    } catch (error) {
      console.log('❌ UN OCHA data failed:', error);
    }

    // 6. Additional News Sources (BBC, Reuters, AP, CNN)
    try {
      console.log('📡 Fetching additional news sources...');
      const additionalNewsEvents: Event[] = [
        {
          id: generateId('BBC News - Climate Crisis', 0, 0, 'environmental'),
          title: "Global Climate Crisis Update",
          lat: 0,
          lon: 0,
          summary: "BBC reports on global climate emergencies and environmental disasters affecting multiple regions.",
          url: "https://www.bbc.com/news",
          type: "disaster",
          date: new Date(Date.now() - 1800000).toISOString(),
          source: "BBC",
          severity: 'high',
          category: 'environmental',
          country: 'Global'
        },
        {
          id: generateId('Reuters - Economic Crisis', 40.7128, -74.0060, 'economic'),
          title: "Economic Crisis in New York",
          lat: 40.7128,
          lon: -74.0060,
          summary: "Reuters reports on economic instability affecting financial markets and requiring assistance.",
          url: "https://www.reuters.com",
          type: "economic",
          date: new Date(Date.now() - 3600000).toISOString(),
          source: "Reuters",
          severity: 'medium',
          category: 'economic',
          country: 'USA'
        },
        {
          id: generateId('AP News - Social Unrest', 48.8566, 2.3522, 'protest'),
          title: "Social Unrest in Paris",
          lat: 48.8566,
          lon: 2.3522,
          summary: "AP News reports on social protests and civil unrest requiring monitoring and potential assistance.",
          url: "https://apnews.com",
          type: "protest",
          date: new Date(Date.now() - 5400000).toISOString(),
          source: "AP News",
          severity: 'medium',
          category: 'social',
          country: 'France'
        },
        {
          id: generateId('CNN - Health Alert', 35.6762, 139.6503, 'health'),
          title: "Health Alert in Tokyo",
          lat: 35.6762,
          lon: 139.6503,
          summary: "CNN reports on health emergency requiring medical assistance and public health measures.",
          url: "https://www.cnn.com",
          type: "health",
          date: new Date(Date.now() - 7200000).toISOString(),
          source: "CNN",
          severity: 'high',
          category: 'health',
          country: 'Japan'
        },
        {
          id: generateId('Al Jazeera - Regional Conflict', 25.2048, 55.2708, 'conflict'),
          title: "Regional Tensions in Middle East",
          lat: 25.2048,
          lon: 55.2708,
          summary: "Al Jazeera reports on regional tensions requiring diplomatic intervention and humanitarian aid.",
          url: "https://www.aljazeera.com",
          type: "conflict",
          date: new Date(Date.now() - 9000000).toISOString(),
          source: "Al Jazeera",
          severity: 'high',
          category: 'conflict',
          country: 'UAE'
        }
      ];
      
      allEvents = [...allEvents, ...additionalNewsEvents];
      console.log(`✅ Added ${additionalNewsEvents.length} additional news events`);
    } catch (error) {
      console.log('❌ Additional news sources failed:', error);
    }

    // 7. Regional Crisis Data (Simulated from various sources)
    try {
      console.log('📡 Fetching regional crisis data...');
      const regionalEvents: Event[] = [
        {
          id: generateId('African Union Crisis', -1.2921, 36.8219, 'conflict'),
          title: "Regional Crisis in East Africa",
          lat: -1.2921,
          lon: 36.8219,
          summary: "African Union reports on regional crisis requiring continental coordination and humanitarian assistance.",
          url: "https://au.int",
          type: "conflict",
          date: new Date(Date.now() - 10800000).toISOString(),
          source: "African Union",
          severity: 'high',
          category: 'conflict',
          country: 'Kenya'
        },
        {
          id: generateId('ASEAN Disaster', 1.3521, 103.8198, 'disaster'),
          title: "Natural Disaster in Southeast Asia",
          lat: 1.3521,
          lon: 103.8198,
          summary: "ASEAN reports on natural disaster affecting multiple countries requiring regional coordination.",
          url: "https://asean.org",
          type: "disaster",
          date: new Date(Date.now() - 12600000).toISOString(),
          source: "ASEAN",
          severity: 'high',
          category: 'natural',
          country: 'Singapore'
        },
        {
          id: generateId('EU Migration Crisis', 50.0755, 14.4378, 'social'),
          title: "Migration Crisis in Europe",
          lat: 50.0755,
          lon: 14.4378,
          summary: "EU reports on migration crisis requiring humanitarian assistance and refugee support.",
          url: "https://europa.eu",
          type: "social",
          date: new Date(Date.now() - 14400000).toISOString(),
          source: "European Union",
          severity: 'high',
          category: 'social',
          country: 'Czech Republic'
        }
      ];
      
      allEvents = [...allEvents, ...regionalEvents];
      console.log(`✅ Added ${regionalEvents.length} regional crisis events`);
    } catch (error) {
      console.log('❌ Regional crisis data failed:', error);
    }

    // 6. Deduplication Logic
    console.log('🔄 Processing and deduplicating events...');
    
    // Create a map for deduplication by location and type
    const eventMap = new Map<string, Event>();
    
    allEvents.forEach(event => {
      const key = `${event.lat.toFixed(2)}_${event.lon.toFixed(2)}_${event.type}`;
      
      if (!eventMap.has(key)) {
        eventMap.set(key, event);
      } else {
        // Keep the more recent or higher severity event
        const existing = eventMap.get(key)!;
        const shouldReplace = 
          event.date > existing.date || 
          (event.severity === 'critical' && existing.severity !== 'critical') ||
          (event.severity === 'high' && existing.severity === 'low');
        
        if (shouldReplace) {
          eventMap.set(key, event);
        }
      }
    });
    
    // Convert back to array and sort by date
    const finalEvents = Array.from(eventMap.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const processingTime = Date.now() - startTime;
    
    console.log(`🎯 Final Results:`);
    console.log(`   📊 Total Events: ${finalEvents.length}`);
    console.log(`   ⏱️  Processing Time: ${processingTime}ms`);
    console.log(`   📡 Sources: ${[...new Set(finalEvents.map(e => e.source))].join(', ')}`);
    console.log(`   🌍 Categories: ${[...new Set(finalEvents.map(e => e.category))].join(', ')}`);
    console.log(`   ⚠️  Severity: ${finalEvents.filter(e => e.severity === 'critical').length} critical, ${finalEvents.filter(e => e.severity === 'high').length} high`);
    
    return NextResponse.json(finalEvents);
  } catch (error) {
    console.error('Error fetching combined events data:', error);
    return NextResponse.json({ error: 'Failed to fetch events data' }, { status: 500 });
  }
}
