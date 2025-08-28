export const SAMPLE_COMPANY_DATA = {
    companies: [
      {
        id: "2c4eb2c3-fd20-42df-bfd1-b2b9c1841298",
        name: "CoCreate Ventures",
        logo_url: "https://zenprospect-production.s3.amazonaws.com/uploads/pictures/685d2b6257107a0001f8cd20/picture",
        industry: "venture capital & private equity",
        city: "Bengaluru",
        state: "Karnataka",
        country: "India",
        contact_count: 11,
        nudges: []
      }
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false
    }
  };


export const SAMPLE_ORGANIZATION_DATA = {
  id: "sample-org-123",
  name: "HoneyComb Demo",
  invite_code: "DEMO12345678",
  created_by: "current-user-id",
  created_at: "2024-01-15T10:00:00Z",
  total_tokens: 25000,
  memberCount: 4,
  isOwner: true,
  members: [
    {
      id: "member-1",
      user_id: "current-user-id",
      full_name: "Sarah Johnson",
      token_limit: null,
      tokens_used: 2500,
      joined_at: "2024-01-15T10:00:00Z"
    },
    {
      id: "member-2", 
      user_id: "user-2",
      full_name: "Michael Chen",
      token_limit: 5000,
      tokens_used: 3200,
      joined_at: "2024-02-01T14:30:00Z"
    },
    {
      id: "member-3",
      user_id: "user-3", 
      full_name: "Emma Rodriguez",
      token_limit: 3000,
      tokens_used: 1800,
      joined_at: "2024-02-15T09:15:00Z"
    },
  ]
};
  

  export const SAMPLE_CONTACT_DATA = {
    contacts: [
      {
        id: "4efe18b0-4563-49ef-9a07-949f66a5e07c",
        company_id: "2c4eb2c3-fd20-42df-bfd1-b2b9c1841298",
        full_name: "Suresh Narasimha",
        title: "CoCreator",
        city: "Bengaluru",
        state: "Karnataka", 
        country: "India",
        email: null,
        phone: null,
        linkedin_url: "https://www.linkedin.com/in/ACwAAAAT53oBIckJIrePgJEOcsOoN9s40sjHx9A",
        profile_picture: "https://media.licdn.com/dms/image/v2/C4E03AQGc0hsy5t0cfQ/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1660897129896?e=1756944000&v=beta&t=nVwwkghR_HtWSaQqPSN4yqc2-blvE8Is8HWKApMrj1Y",
        isTracked: false,
        primaryAnalysisCompleted: true,
        primaryAnalysisRequested: true,
        in_crm: false,
        created_at: "2025-08-02 03:23:45.810097",
        updated_at: "2025-08-02 03:23:45.810097",
        company: {
          id: "2c4eb2c3-fd20-42df-bfd1-b2b9c1841298",
          name: "CoCreate Ventures",
          logo_url: null,
          industry: "Technology"
        },
        signals: [
          {
            id: "1a4baaf2-2f36-4cad-962a-7e428608269f",
            signal_type: "ICP MATCH",
            confidence_score: 88
          },
          {
            id: "44db513c-c3bb-4c6e-93ed-690903d8f3ce",
            signal_type: "ACTIVE LINKEDIN",
            confidence_score: 88
          },
          {
            id: "4d512708-350a-45a4-b817-3eb77896df4e",
            signal_type: "DECISION MAKER INFLUENCE",
            confidence_score: 88
          },
          {
            id: "5848c38a-e86c-44e3-8960-b6bfed78551c",
            signal_type: "INTEREST MATCH EXPLICIT",
            confidence_score: 88
          }
        ]
      },
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false
    }
  };