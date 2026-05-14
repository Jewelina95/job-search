// City → lat/lng lookup for WorldMap. Matches keys to substrings of Job.location.
// Order matters: more specific keys should come before general ones (e.g., "San Jose" before "CA").
export const cityCoords: { match: string; lat: number; lng: number; label: string }[] = [
  // US — Bay Area
  { match: "South San Francisco", lat: 37.6547, lng: -122.4077, label: "South SF" },
  { match: "San Francisco", lat: 37.7749, lng: -122.4194, label: "San Francisco" },
  { match: "San Jose", lat: 37.3382, lng: -121.8863, label: "San Jose" },
  { match: "Santa Clara", lat: 37.3541, lng: -121.9552, label: "Santa Clara" },
  { match: "Cupertino", lat: 37.3230, lng: -122.0322, label: "Cupertino" },
  { match: "Mountain View", lat: 37.3861, lng: -122.0839, label: "Mountain View" },
  { match: "Palo Alto", lat: 37.4419, lng: -122.1430, label: "Palo Alto" },
  { match: "Menlo Park", lat: 37.4530, lng: -122.1817, label: "Menlo Park" },
  { match: "Stanford", lat: 37.4275, lng: -122.1697, label: "Stanford" },
  { match: "Redwood City", lat: 37.4852, lng: -122.2364, label: "Redwood City" },
  { match: "Berkeley", lat: 37.8716, lng: -122.2727, label: "Berkeley" },
  { match: "Los Altos", lat: 37.3852, lng: -122.1141, label: "Los Altos" },
  { match: "Sunnyvale", lat: 37.3688, lng: -122.0363, label: "Sunnyvale" },

  // US — PNW
  { match: "Redmond", lat: 47.6740, lng: -122.1215, label: "Redmond" },
  { match: "Bellevue", lat: 47.6101, lng: -122.2015, label: "Bellevue" },
  { match: "Seattle", lat: 47.6062, lng: -122.3321, label: "Seattle" },

  // US — East coast
  { match: "Cambridge, MA", lat: 42.3736, lng: -71.1097, label: "Cambridge, MA" },
  { match: "Pittsburgh", lat: 40.4406, lng: -79.9959, label: "Pittsburgh" },
  { match: "Yorktown", lat: 41.1170, lng: -73.7807, label: "Yorktown" },
  { match: "Baltimore", lat: 39.2904, lng: -76.6122, label: "Baltimore" },
  { match: "New York", lat: 40.7128, lng: -74.006, label: "New York" },
  { match: "NYC", lat: 40.7128, lng: -74.006, label: "NYC" },
  { match: "Princeton", lat: 40.3573, lng: -74.6672, label: "Princeton" },
  { match: "Ithaca", lat: 42.4406, lng: -76.4969, label: "Ithaca" },

  // US — South + Midwest
  { match: "Atlanta", lat: 33.749, lng: -84.388, label: "Atlanta" },
  { match: "Austin", lat: 30.2672, lng: -97.7431, label: "Austin" },
  { match: "Ann Arbor", lat: 42.2808, lng: -83.7430, label: "Ann Arbor" },
  { match: "Evanston", lat: 42.0451, lng: -87.6877, label: "Evanston" },
  { match: "Madison", lat: 43.0731, lng: -89.4012, label: "Madison" },
  { match: "Urbana", lat: 40.1106, lng: -88.2073, label: "Urbana" },
  { match: "Chicago", lat: 41.8781, lng: -87.6298, label: "Chicago" },

  // US — SoCal
  { match: "San Diego", lat: 32.7157, lng: -117.1611, label: "San Diego" },
  { match: "Los Angeles", lat: 34.0522, lng: -118.2437, label: "Los Angeles" },
  { match: "Santa Monica", lat: 34.0195, lng: -118.4912, label: "Santa Monica" },
  { match: "LA", lat: 34.0522, lng: -118.2437, label: "LA" },

  // Canada
  { match: "Toronto", lat: 43.6532, lng: -79.3832, label: "Toronto" },

  // UK + EU
  { match: "Cambridge, UK", lat: 52.2053, lng: 0.1218, label: "Cambridge UK" },
  { match: "Cambridge UK", lat: 52.2053, lng: 0.1218, label: "Cambridge UK" },
  { match: "London", lat: 51.5074, lng: -0.1278, label: "London" },
  { match: "Oxford", lat: 51.7520, lng: -1.2577, label: "Oxford" },
  { match: "Paris", lat: 48.8566, lng: 2.3522, label: "Paris" },
  { match: "Zurich", lat: 47.3769, lng: 8.5417, label: "Zurich" },

  // Remote fallback
  { match: "Remote", lat: 39.0, lng: -77.0, label: "Remote" },
];

export type Coords = { lat: number; lng: number; label: string };

export function lookupCoords(location: string): Coords | null {
  for (const entry of cityCoords) {
    if (location.toLowerCase().includes(entry.match.toLowerCase())) {
      return { lat: entry.lat, lng: entry.lng, label: entry.label };
    }
  }
  return null;
}
