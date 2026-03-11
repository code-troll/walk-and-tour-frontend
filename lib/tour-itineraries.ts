import type { TourId } from "@/lib/landing-data";

export type CommuteMode =
  | "walk"
  | "bike"
  | "bus"
  | "train"
  | "metro"
  | "tram"
  | "ferry"
  | "privateTransport"
  | "boat"
  | "other";

export type ItineraryCoordinates = {
  lat: number;
  lng: number;
};

export type ItineraryConnection = {
  durationMinutes?: number;
  mode: CommuteMode;
};

export type SharedItineraryStop = {
  id: string;
  durationMinutes?: number;
  coordinates?: ItineraryCoordinates;
  nextConnection?: ItineraryConnection;
};

export type SharedTourItinerary = {
  stops: SharedItineraryStop[];
};

export type LocalizedItineraryStopCopy = {
  title: string;
  description: string;
};

export type ResolvedItineraryStop = SharedItineraryStop & LocalizedItineraryStopCopy;

export type ResolvedTourItinerary = {
  stops: ResolvedItineraryStop[];
};

const sharedTourItineraries: Partial<Record<TourId, SharedTourItinerary>> = {
  copenhagenFreeTour: {
    stops: [
      {
        id: "city-hall-square",
        coordinates: {
          lat: 55.67615282157321,
          lng: 12.568633408264471,
        },
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "nytorv-gammeltorv",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "christiansborg-palace",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "kongens-nytorv",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "nyhavn",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "marble-church",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "amalienborg-palace",
        coordinates: {
          lat: 55.68424787557431,
          lng: 12.592881629028156,
        },
      },
    ],
  },
  malmoExcursion: {
    stops: [
      {
        id: "copenhagen-central-station",
        coordinates: {
          lat: 55.67302389198277,
          lng: 12.565862214483651,
        },
        nextConnection: {
          durationMinutes: 45,
          mode: "train",
        },
      },
      {
        id: "malmo-central",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "st-peters-church",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "malmo-town-hall",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "malmo-library",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "slottsmollan",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "malmohus-castle",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "old-town-malmo",
        nextConnection: {
          mode: "walk",
        },
      },
    ],
  },
  copenhagenEssentials: {
    stops: [
      {
        id: "city-hall-square",
        coordinates: {
          lat: 55.67615282157321,
          lng: 12.568633408264471,
        },
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "glyptotek-area",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "dante-plads",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "old-town",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "christiansborg-palace",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "old-library",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "black-diamond",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "harbour-ferry",
        nextConnection: {
          mode: "ferry",
        },
      },
      {
        id: "opera-house",
        nextConnection: {
          mode: "ferry",
        },
      },
      {
        id: "nyhavn",
        nextConnection: {
          mode: "ferry",
        },
      },
      {
        id: "kastellet",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "little-mermaid",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "amalienborg-palace",
      },
    ],
  },
  tivoliGardensEntry: {
    stops: [
      {
        id: "nyhavn",
        coordinates: {
          lat: 55.68058211228183,
          lng: 12.587756971967556,
        },
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "amalienborg-palace",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "marble-church",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "kongens-nytorv",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "royal-theatre",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "christiansborg-palace",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "city-hall-square",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "tivoli-gardens",
      },
    ],
  },
  boatTour: {
    stops: [
      {
        id: "gammel-strand-pier",
        coordinates: {
          lat: 55.67771000594161,
          lng: 12.579282382329074,
        },
        nextConnection: {
          mode: "boat",
        },
      },
      {
        id: "little-mermaid",
        nextConnection: {
          mode: "boat",
        },
      },
      {
        id: "opera-house",
        nextConnection: {
          mode: "boat",
        },
      },
      {
        id: "black-diamond",
        nextConnection: {
          mode: "boat",
        },
      },
      {
        id: "cirkelbroen-bridge",
        nextConnection: {
          mode: "boat",
        },
      },
      {
        id: "gammel-strand-pier-return",
      },
    ],
  },
  royalDeerParkBikeTour: {
    stops: [
      {
        id: "copenhagen-central-station",
        coordinates: {
          lat: 55.67302389198277,
          lng: 12.565862214483651,
        },
        nextConnection: {
          mode: "train",
        },
      },
      {
        id: "klampenborg-station",
        nextConnection: {
          mode: "bike",
        },
      },
      {
        id: "dyrehaven-secret-trails",
        nextConnection: {
          mode: "bike",
        },
      },
      {
        id: "deer-grazing-area",
        nextConnection: {
          mode: "bike",
        },
      },
      {
        id: "hermitage-hunting-lodge",
        nextConnection: {
          mode: "bike",
        },
      },
      {
        id: "arne-jacobsen-lifeguard-tower",
      },
    ],
  },
  harborArchitecture: {
    stops: [
      {
        id: "ofelia-plads",
        coordinates: {
          lat: 55.681209784523475,
          lng: 12.594349304928116,
        },
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "nyhavn",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "papiroen",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "opera-house",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "cirkelbroen",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "danish-architecture-center",
      },
    ],
  },
  frederiksborgAndKronborgCastle: {
    stops: [
      {
        id: "norreport-station",
        coordinates: {
          lat: 55.6831563511507,
          lng: 12.571380551355826,
        },
        nextConnection: {
          mode: "train",
        },
      },
      {
        id: "hillerod-station-arrival",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "frederiksborg-castle",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "hillerod-station-departure",
        nextConnection: {
          mode: "train",
        },
      },
      {
        id: "helsingor-station",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "helsingor-harbor",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "kronborg-castle",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "oresund-viewpoint",
        nextConnection: {
          mode: "train",
        },
      },
      {
        id: "norreport-station-return",
      },
    ],
  },
  roskilde: {
    stops: [
      {
        id: "copenhagen-central-station",
        coordinates: {
          lat: 55.67302389198277,
          lng: 12.565862214483651,
        },
        nextConnection: {
          mode: "train",
        },
      },
      {
        id: "roskilde-station-arrival",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "roskilde-cathedral",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "roskilde-historic-center",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "roskilde-harbor",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "viking-ship-museum",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "roskilde-station-departure",
        nextConnection: {
          mode: "train",
        },
      },
      {
        id: "copenhagen-central-station-return",
      },
    ],
  },
  nordhavnArchitecture: {
    stops: [
      {
        id: "orientkaj",
        coordinates: {
          lat: 55.71161628631354,
          lng: 12.595244446738965,
        },
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "arhusgade-quarter",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "frihavnstarnet",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "konditaget-luders",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "gotenborg-plads",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "harbour-bath",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "nordhavn-station",
      },
    ],
  },
  shoreExcursion: {
    stops: [
      {
        id: "orientkaj-metro-station",
        coordinates: {
          lat: 55.711645649734145,
          lng: 12.595160270802975,
        },
        nextConnection: {
          mode: "metro",
        },
      },
      {
        id: "gammel-strand",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "christiansborg-palace",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "kongens-nytorv",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "medieval-streets",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "nyhavn",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "amalienborg-palace",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "marble-church",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "rosenborg-castle-views",
        nextConnection: {
          mode: "metro",
        },
      },
      {
        id: "orientkaj-metro-station-return",
      },
    ],
  },
  copenhagenCityToCoast: {
    stops: [
      {
        id: "city-hall-square",
        coordinates: {
          lat: 55.67615282157321,
          lng: 12.568633408264471,
        },
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "slotsholmen",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "librarians-garden",
        nextConnection: {
          mode: "walk",
        },
      },
      {
        id: "black-diamond",
        nextConnection: {
          mode: "ferry",
        },
      },
      {
        id: "circle-bridge",
        nextConnection: {
          mode: "ferry",
        },
      },
      {
        id: "kayak-bar",
        nextConnection: {
          mode: "ferry",
        },
      },
      {
        id: "harbour-bus",
        nextConnection: {
          mode: "ferry",
        },
      },
      {
        id: "refshaleoen",
        nextConnection: {
          mode: "ferry",
        },
      },
      {
        id: "reffen-street-market",
      },
    ],
  },
};

export const getSharedTourItinerary = (
  tourId: TourId
): SharedTourItinerary | null => sharedTourItineraries[tourId] ?? null;
