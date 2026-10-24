// StreetShift shared contracts. Every lane (/sim, /web, /convex, /droid, /agents, /validation)
// builds against these. JSON Schema mirrors for Python live in ./schemas/*.json.

export type City = "NYC" | "SF" | "BERKELEY";

/** Segment of the road network. */
export type Segment = {
  id: string;
  name: string;
  coords: [number, number][]; // [lng, lat]
  lanes: number;
  baselineCarVolume: number | null; // null = no count data, estimated elsewhere
  baselinePedVolume: number | null;
};

export type Business = {
  id: string;
  name: string;
  category: string;
  lng: number;
  lat: number;
  rating: number | null;
  reviewCount: number | null;
  popularTimes: number[][] | null; // [dayOfWeek][hour] 0-100
  carDependence: number; // 0-1, from Elastic review signals
  segmentId: string;
};

export type Programming = "none" | "light" | "heavy";

export type Scenario = {
  id: string;
  city: City;
  corridorId: string;
  closedSegmentIds: string[];
  addedSeating: boolean;
  programming: Programming;
  createdAt: number;
};

export type Verdict = "THRIVES" | "MARGINAL" | "DIES_OFF";

export type Metrics = {
  interaction: {
    lingerIndex: number;
    encountersPerHour: number;
    verdict: Verdict;
    range: [number, number];
  };
  economy: {
    totalRevenueChangePct: number;
    range: [number, number];
    perBusiness: { businessId: string; changePct: number }[];
  };
  traffic: {
    addedVehicleHours: number;
    range: [number, number];
    overflowSegments: { segmentId: string; loadIncreasePct: number }[];
  };
};

export type BacktestRow = {
  corridorId: string;
  corridorName: string;
  split: "calibration" | "holdout";
  predictedGapPct: number;
  actualGapPct: number | null;
  directionCorrect: boolean | null;
  absErrorPts: number | null;
};

export type DroidRunStatus = "planning" | "running" | "done" | "failed";

export type DroidRun = {
  id: string;
  kind: "backtest" | "sweep";
  status: DroidRunStatus;
  plan: string[];
  steps: { label: string; status: string; output?: string }[];
  resultSummary?: string;
  startedAt: number;
};
