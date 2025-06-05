
import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface LocationResult {
  display_name: string;
  lat: string;
  lon: string;
  boundingbox: [string, string, string, string];
}

interface LocationSearchProps {
  onLocationSelect: (lat: number, lon: number, boundingbox?: [number, number, number, number]) => void;
  placeholder?: string;
}

const LocationSearch: React.FC<LocationSearchProps> = ({ 
  onLocationSelect, 
  placeholder = "Buscar localização..." 
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const searchLocation = async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=BR&addressdetails=1`
      );
      const data = await response.json();
      setResults(data || []);
      setShowResults(true);
    } catch (error) {
      console.error('Erro na busca de localização:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (result: LocationResult) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    const boundingbox: [number, number, number, number] = [
      parseFloat(result.boundingbox[0]),
      parseFloat(result.boundingbox[1]),
      parseFloat(result.boundingbox[2]),
      parseFloat(result.boundingbox[3])
    ];
    
    onLocationSelect(lat, lon, boundingbox);
    setQuery(result.display_name);
    setShowResults(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query) {
        searchLocation(query);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
          {results.map((result, index) => (
            <button
              key={index}
              onClick={() => handleLocationSelect(result)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-start gap-3"
            >
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {result.display_name}
                </p>
                <p className="text-xs text-gray-500">
                  {result.lat}, {result.lon}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
