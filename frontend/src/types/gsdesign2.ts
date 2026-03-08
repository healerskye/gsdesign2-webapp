export interface ApiResponse<T = Record<string, unknown>> {
  success?: boolean;
  status?: string;
  result?: T;
  rCode?: string;
  error?: string;
  message?: string;
  // GS design results
  bound?: GSBoundRow[];
  analysis?: Record<string, unknown>[];
  // AHR / expected-time results
  data?: Record<string, unknown>[];
  // expected-event result
  expected_event?: number;
}

// Fixed design results
export interface FixedDesignResult {
  n: number;
  event?: number;
  time?: number;
  ahr?: number;
  bound: number;
  alpha: number;
  power: number;
}

// GS design results
export interface GSBoundRow {
  analysis: number;
  bound: string;
  probability: number;
  probability0: number;
  z: number;
  _hr_at_bound?: number;
  nominal_p?: number;
}

export interface GSAnalysisRow {
  analysis: number;
  time: number;
  n: number;
  event: number;
  ahr?: number;
  theta: number;
  info: number;
  info0: number;
  info_frac: number;
  info_frac0: number;
}

export interface GSDesignResult {
  bound: GSBoundRow[];
  analysis: GSAnalysisRow[];
}

// AHR exploration
export interface AHRRow {
  time: number;
  ahr: number;
  n: number;
  event: number;
  info: number;
  info0: number;
}

export interface AHRResult {
  data: AHRRow[];
}

export interface ExpectedEventResult {
  expected_event: number;
}

export interface ExpectedTimeResult {
  time: number;
  ahr: number;
  event: number;
  info: number;
  info0: number;
}
