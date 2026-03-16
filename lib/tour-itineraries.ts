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
