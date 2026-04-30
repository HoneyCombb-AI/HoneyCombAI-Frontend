// --- Individual service statuses ---

export interface GmailStatus {
  isConnected: boolean;
  email: string | null;
}

export interface LinkedInStatus {
  status: "pending" | "connected" | "failed" | null;
  email: string | null;
  error: string | null;
}

export interface OutlookStatus {
  isConnected: boolean;
  email: string | null;
}

// --- Unified response from RPC ---

export interface IntegrationStatuses {
  gmail: GmailStatus;
  linkedin: LinkedInStatus;
  outlook: OutlookStatus;
}
