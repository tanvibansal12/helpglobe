import { useState, useEffect } from 'react';

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

interface Organization {
  name: string;
  url: string;
  description: string;
  phone: string;
  regions: string[];
  focus: string[];
  verified: boolean;
}

interface DetailPanelProps {
  event: Event | null;
  onClose: () => void;
}

export default function DetailPanel({ event, onClose }: DetailPanelProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  useEffect(() => {
    fetch('/data/regional-organizations.json')
      .then(response => response.json())
      .then(data => {
        // Get region-specific organizations based on event location
        if (event) {
          const relevantOrgs = getRelevantOrganizations(event, data.organizations);
          setOrganizations(relevantOrgs);
        } else {
          // Default to global organizations
          setOrganizations(data.organizations.global || []);
        }
      })
      .catch(error => console.error('Error loading organizations:', error));
  }, [event]);

  // Function to get relevant organizations based on event location and type
  const getRelevantOrganizations = (event: Event, orgData: any): Organization[] => {
    const relevantOrgs: Organization[] = [];
    
    // Always include global organizations
    if (orgData.global) {
      relevantOrgs.push(...orgData.global);
    }
    
    // Add regional organizations based on country/region
    const country = event.country?.toLowerCase() || '';
    const region = getRegionFromCountry(country);
    
    if (region && orgData[region]) {
      relevantOrgs.push(...orgData[region]);
    }
    
    // Add country-specific organizations
    if (orgData.specific_countries) {
      const countryKey = getCountryKey(country);
      if (countryKey && orgData.specific_countries[countryKey]) {
        relevantOrgs.push(...orgData.specific_countries[countryKey]);
      }
    }
    
    // Remove duplicates and return top 8 most relevant
    const uniqueOrgs = relevantOrgs.filter((org, index, self) => 
      index === self.findIndex(o => o.name === org.name)
    );
    
    return uniqueOrgs.slice(0, 8);
  };

  // Helper function to determine region from country
  const getRegionFromCountry = (country: string): string | null => {
    const regionMap: { [key: string]: string } = {
      'ukraine': 'europe',
      'gaza': 'middle-east',
      'palestine': 'middle-east',
      'syria': 'middle-east',
      'afghanistan': 'asia',
      'kenya': 'africa',
      'somalia': 'africa',
      'japan': 'asia',
      'china': 'asia',
      'india': 'asia',
      'usa': 'americas',
      'canada': 'americas',
      'brazil': 'americas',
      'france': 'europe',
      'germany': 'europe',
      'italy': 'europe'
    };
    
    return regionMap[country] || null;
  };

  // Helper function to get country key for specific countries
  const getCountryKey = (country: string): string | null => {
    const countryMap: { [key: string]: string } = {
      'ukraine': 'ukraine',
      'gaza': 'gaza',
      'palestine': 'gaza',
      'syria': 'syria'
    };
    
    return countryMap[country] || null;
  };

  if (!event) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'conflict':
        return 'bg-red-500/20 border-red-500/50 text-red-300';
      case 'disaster':
        return 'bg-blue-500/20 border-blue-500/50 text-blue-300';
      case 'protest':
        return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300';
      case 'health':
        return 'bg-green-500/20 border-green-500/50 text-green-300';
      case 'earthquake':
        return 'bg-orange-500/20 border-orange-500/50 text-orange-300';
      default:
        return 'bg-purple-500/20 border-purple-500/50 text-purple-300';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'conflict':
        return '⚔️';
      case 'disaster':
        return '🌊';
      case 'protest':
        return '📢';
      case 'health':
        return '🏥';
      case 'earthquake':
        return '🌍';
      default:
        return '📰';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700/50">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{getEventTypeIcon(event.type)}</span>
                <h2 className="text-3xl font-bold text-white">{event.title}</h2>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getEventTypeColor(event.type)}`}>
                  {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                </span>
                <span>📍 {event.lat.toFixed(2)}, {event.lon.toFixed(2)}</span>
                <span>🕒 {formatDate(event.date)}</span>
                <span>📡 {event.source}</span>
                {event.magnitude && (
                  <span className="font-medium">🌍 Magnitude: {event.magnitude}</span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-3xl font-bold transition-colors"
            >
              ×
            </button>
          </div>

          {/* Summary */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-3">Summary</h3>
            <p className="text-gray-300 leading-relaxed text-lg">{event.summary}</p>
          </div>

          {/* Source Link */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-3">Source</h3>
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline text-lg transition-colors"
            >
              View official report →
            </a>
          </div>

          {/* How to Help - Region Specific */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">
              How to Help {event.country && `in ${event.country}`}
            </h3>
            <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <div className="text-sm text-blue-300">
                <strong>📍 Location-specific help:</strong> Organizations below are tailored to this region and crisis type.
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto">
              {organizations.map((org, index) => (
                <div key={index} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 hover:bg-gray-800/70 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium text-white text-lg">{org.name}</div>
                    <div className="flex items-center gap-2">
                      {org.verified && (
                        <span className="text-green-400 text-sm">✓ Verified</span>
                      )}
                      <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                        {org.regions[0] || 'Global'}
                      </span>
                    </div>
                  </div>
                  <div className="text-gray-300 text-sm mb-3">
                    {org.description}
                  </div>
                  <div className="flex flex-col gap-2">
                    <a
                      href={org.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                    >
                      🌐 Visit Website
                    </a>
                    <div className="text-gray-400 text-sm">
                      📞 {org.phone}
                    </div>
                    <div className="text-xs text-gray-500">
                      Focus: {org.focus.slice(0, 3).join(', ')}
                    </div>
                    {org.regions.length > 1 && (
                      <div className="text-xs text-gray-500">
                        Regions: {org.regions.slice(0, 2).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {organizations.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <div className="text-lg mb-2">No specific organizations found</div>
                <div className="text-sm">Try checking global humanitarian organizations</div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-6 border-t border-gray-700/50">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium"
            >
              Close
            </button>
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              View Details
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
