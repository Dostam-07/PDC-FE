export interface AdminConfig {
  frameworks: Array<{
    id: string;
    name: string;
    version: string;
    active: boolean;
    description: string;
    components: string[];
  }>;
  mappings: Array<{
    useCase: string;
    frameworkId: string;
    isDefault: boolean;
  }>;
  onboardingQuestions: Array<{
    id: string;
    field: string;
    question: string;
    mandatory: boolean;
    options: string[];
    placeholder: string;
  }>;
  deflectionMessage: string;
}

export interface RepositoryDoc {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  tags: string[];
}

export interface SelectionLog {
  id: string;
  conversationId: string;
  query: string;
  intentDetected: string;
  frameworkSelected: string;
  timestamp: string;
}

export interface KnowledgeGapLog {
  id: string;
  query: string;
  category: string;
  detectedAt: string;
  recommendation: string;
}

const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  frameworks: [
    {
      id: "framework-lfa",
      name: "Logical Framework Approach (LFA)",
      version: "2.1",
      active: true,
      description: "Default framework for structured education program design across India states.",
      components: ["Goal / Impact", "Outcomes", "Outputs", "Activities", "Inputs", "Personas", "Indicators", "Risks & Assumptions"]
    },
    {
      id: "framework-toc",
      name: "Theory of Change (ToC)",
      version: "1.4",
      active: true,
      description: "Long-term pathway mapping from interventions to systemic impact with explicit causal mechanisms.",
      components: ["Ultimate Impact", "Intermediate Outcomes", "Preconditions", "Interventions", "Underlying Assumptions"]
    }
  ],
  mappings: [
    { useCase: "FLN Interventions", frameworkId: "framework-lfa", isDefault: true },
    { useCase: "School Leadership & Mentorship", frameworkId: "framework-lfa", isDefault: true },
    { useCase: "Systemic State Reform", frameworkId: "framework-toc", isDefault: false }
  ],
  onboardingQuestions: [],
  deflectionMessage: "I specialize in school education program design, pedagogy, and Logical Framework Analysis (LFA)."
};

const DEFAULT_REPOSITORY_DOCS: RepositoryDoc[] = [
  {
    id: "doc-001",
    title: "Logical Framework Approach (LFA) Handbook for Education Interventions",
    category: "Frameworks & Standards",
    summary: "Comprehensive guide on building Logical Framework Analysis matrices for large-scale education programs.",
    content: "The Logical Framework Approach (LFA) is a systematic methodology for planning, managing, and evaluating projects.",
    tags: ["LFA", "Logical Framework", "Design", "M&E"]
  }
];

class AdminService {
  private config: AdminConfig = DEFAULT_ADMIN_CONFIG;
  private docs: RepositoryDoc[] = DEFAULT_REPOSITORY_DOCS;
  private gaps: KnowledgeGapLog[] = [];
  private logs: SelectionLog[] = [];

  getAdminConfig(): AdminConfig {
    return this.config;
  }

  updateAdminConfig(updated: AdminConfig): AdminConfig {
    this.config = updated;
    return this.config;
  }

  getKnowledgeGaps(): KnowledgeGapLog[] {
    return this.gaps;
  }

  getSelectionLogs(): SelectionLog[] {
    return this.logs;
  }

  getRepositoryDocs(): RepositoryDoc[] {
    return this.docs;
  }
}

export const adminService = new AdminService();
