
export type FHTTNodeType = 'OLT' | 'SPLITTER_BALANCED' | 'SPLITTER_UNBALANCED' | 'ATTENUATOR' | 'ONU';

export interface FHTTNodeData extends Record<string, unknown> {
  label: string;
  type: FHTTNodeType;
  // OLT
  power?: number; // dBm

  // Splitter
  ratio?: string; // e.g., "1:2", "5:95"
  loss?: number; // dB (for balanced) or map for unbalanced?
  // For unbalanced, we might need specific losses per port. 
  // Let's simplify: if it's unbalanced "5:95", we know the losses roughly. 
  // Or we can store them: { "out-5": 14.0, "out-95": 1.0 }
  portLosses?: Record<string, number>;

  // Attenuator
  attenuation?: number; // dB

  // Calculated values (to display)
  inputSignal?: number | null;
  outputSignals?: Record<string, number>; // per handle
}

export interface FHTTEdgeData extends Record<string, unknown> {
  length: number; // meters
  lossPerKm: number; // dB/km, default 0.35
  sourcePort?: string; // Logical port (e.g. 'out-1', 'out-95')
}
