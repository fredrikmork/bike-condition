export const BIKE_TYPES = ['road', 'mtb', 'tt', 'hybrid', 'ebike'] as const;
export type BikeType = typeof BIKE_TYPES[number];

export const BIKE_TYPE_LABELS: Record<BikeType, string> = {
  road:   'Road bike',
  mtb:    'Mountain bike',
  tt:     'Time trial / Triathlon',
  hybrid: 'Hybrid / Commuter',
  ebike:  'E-bike',
};

// Strava frame_type integer → BikeType
export const STRAVA_FRAME_TYPE_MAP: Record<number, BikeType> = {
  1:  'mtb',
  2:  'hybrid',
  3:  'road',
  4:  'tt',
  5:  'hybrid',
  7:  'hybrid',
  8:  'hybrid',
  9:  'road',
  10: 'ebike',
  11: 'ebike',
  12: 'tt',
  14: 'road',
};
