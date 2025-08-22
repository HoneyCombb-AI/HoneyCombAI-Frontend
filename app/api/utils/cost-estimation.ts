export enum TaskType {
  COMPANY_ENRICHMENT = "company_enrichment",
  NEWS_ENRICHMENT = "news_enrichment",
  EMPLOYEE_DISCOVERY = "employee_discovery",
  COMPLETE_CONTACT_ENRICHMENT = "complete_contact_enrichment",
  SIGNALS_AGENT = "signals_agent"
}

export const SERVICE_TOKEN_COSTS = {
  apollo: 1,
  serp: 1,
  linkedin: 3,
  twitter: 1,
  instagram: 1,
  employee_discovery: 1,
  contact_profile: 1,
  ai_analysis: 1,
  internal_processing: 1
} as const;

export const WORKFLOW_TOKEN_COSTS = {
  [TaskType.COMPANY_ENRICHMENT]: {
    services: ["apollo", "serp"],
    tokens_per_entity: 2,
    description: "Company data enrichment"
  },
  
  [TaskType.NEWS_ENRICHMENT]: {
    services: ["serp"],
    tokens_per_entity: 1,
    description: "News and SERP data collection"
  },
  
  [TaskType.EMPLOYEE_DISCOVERY]: {
    services: ["employee_discovery"],
    tokens_per_entity: 1,
    description: "Employee discovery"
  },
  
  [TaskType.COMPLETE_CONTACT_ENRICHMENT]: {
    services: ["linkedin", "twitter", "instagram", "ai_analysis"],
    tokens_per_entity: 6,
    description: "Complete contact enrichment with social media and AI"
  },
  
  [TaskType.SIGNALS_AGENT]: {
    services: ["linkedin", "twitter", "instagram", "ai_analysis"],
    tokens_per_entity: 6,
    description: "Contact scraping + AI signals analysis"
  }
} as const;

/**
 * Get token cost for a workflow.
 * 
 * @param workflowType - Type of workflow (string or TaskType enum)
 * @param entityCount - Number of entities to process (default: 1)
 * @returns Total number of tokens needed
 */
export function getWorkflowTokenCost(
  workflowType: string | TaskType, 
  entityCount: number = 1
): number {
  const workflowStr = typeof workflowType === 'string' 
    ? workflowType.toLowerCase() as TaskType
    : workflowType;
  
  const workflowConfig = WORKFLOW_TOKEN_COSTS[workflowStr];
  if (!workflowConfig) {
    return entityCount; // Default to 1 token per entity if workflow not found
  }
  
  return workflowConfig.tokens_per_entity * entityCount;
}

/**
 * Get detailed cost breakdown for a workflow.
 * 
 * @param workflowType - Type of workflow
 * @param entityCount - Number of entities to process
 * @returns Detailed cost information
 */
export function getWorkflowCostBreakdown(
  workflowType: string | TaskType,
  entityCount: number = 1
) {
  const workflowStr = typeof workflowType === 'string' 
    ? workflowType.toLowerCase() as TaskType
    : workflowType;
  
  const workflowConfig = WORKFLOW_TOKEN_COSTS[workflowStr];
  if (!workflowConfig) {
    return {
      workflow_type: workflowStr,
      entity_count: entityCount,
      tokens_per_entity: 1,
      total_tokens: entityCount,
      services: [],
      description: "Unknown workflow type"
    };
  }
  
  return {
    workflow_type: workflowStr,
    entity_count: entityCount,
    tokens_per_entity: workflowConfig.tokens_per_entity,
    total_tokens: workflowConfig.tokens_per_entity * entityCount,
    services: workflowConfig.services,
    description: workflowConfig.description
  };
}

/**
 * Calculate cost for multiple workflows.
 * 
 * @param workflows - Array of workflow configurations
 * @returns Total cost and breakdown
 */
export function calculateMultipleWorkflowsCost(
  workflows: Array<{ type: string | TaskType; entityCount: number }>
) {
  const breakdowns = workflows.map(({ type, entityCount }) => 
    getWorkflowCostBreakdown(type, entityCount)
  );
  
  const totalTokens = breakdowns.reduce(
    (sum, breakdown) => sum + breakdown.total_tokens, 
    0
  );
  
  return {
    total_tokens: totalTokens,
    workflow_breakdowns: breakdowns
  };
}