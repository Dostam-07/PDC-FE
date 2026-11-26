export interface LFAOutcome {
  id: string;
  statement: string;
  indicator: string;
  meansOfVerification: string;
}

export interface LFAOutput {
  id: string;
  statement: string;
}

export interface LFAActivity {
  id: string;
  description: string;
  metric: string;
}

export interface LFAPersona {
  role: string;
  responsibilities: string;
}

export interface LFARisk {
  risk: string;
  mitigation: string;
}

export interface LFAMatrix {
  title: string;
  frameworkType: string;
  challengeStatement: string;
  goal: string;
  impact: {
    statement: string;
    indicators: string;
  };
  outcomes: LFAOutcome[];
  outputs: LFAOutput[];
  activities: LFAActivity[];
  personas: LFAPersona[];
  assumptions: string[];
  risks: LFARisk[];
  resources: string[];
}
