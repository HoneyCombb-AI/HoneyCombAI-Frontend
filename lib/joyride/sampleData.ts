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
        nudges: [],
        company_analysis_completed : true,
        company_analysis_requested : true,
        news_requested : true
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
        temperature: "hot",
        in_crm: false,
        created_at: "2025-08-02 03:23:45.810097",
        updated_at: "2025-08-02 03:23:45.810097",
        company: {
          id: "2c4eb2c3-fd20-42df-bfd1-b2b9c1841298",
          name: "CoCreate Ventures",
          logo_url: null,
          industry: "Technology"
        },
        tags: [
          {
            id: "tag-1",
            name: "High Priority",
            color: "#ef4444"
          },
          {
            id: "tag-2",
            name: "Investor",
            color: "#3b82f6"
          }
        ],
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
      {
        id: "a64e3f85-0f96-4c05-9523-1fd003b1861f",
        company_id: "2c4eb2c3-fd20-42df-bfd1-b2b9c1841298",
        full_name: "John Smith",
        title: "Lead Investment Analyst",
        city: "Bangalore Urban district",
        state: "Karnataka",
        country: "India",
        email: null,
        phone: null,
        linkedin_url: "https://www.linkedin.com/in/ACwAABKbuZkBFBLNP1gNlo1MMDmxeZklYrbxaXo",
        profile_picture: "https://media.licdn.com/dms/image/v2/C4E03AQHfrFdTRj_89Q/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1602054106271?e=1756944000&v=beta&t=mGjNWN9gIZVY0TZDdl5KNea7xqulVnvhV7gJ8sCqlKU",
        isTracked: true,
        primaryAnalysisCompleted: true,
        primaryAnalysisRequested: false,
        temperature: "warm",
        in_crm: false,
        created_at: "2025-08-02 03:23:45.810097",
        updated_at: "2025-08-02 03:23:45.810097",
        company: {
          id: "2c4eb2c3-fd20-42df-bfd1-b2b9c1841298",
          name: "CoCreate Ventures",
          logo_url: null,
          industry: "Technology"
        },
        tags: [
          {
            id: "tag-3",
            name: "Analyst",
            color: "#10b981"
          }
        ],
        signals: [
          {
            id: "sig-kiriti-1",
            signal_type: "INVESTMENT ROLE",
            confidence_score: 85
          },
          {
            id: "sig-kiriti-2",
            signal_type: "ICP MATCH",
            confidence_score: 80
          }
        ]
      },
      {
        id: "4fcd9beb-3448-4333-a855-2d2efba1d80f",
        company_id: "2c4eb2c3-fd20-42df-bfd1-b2b9c1841298",
        full_name: "Michael BS",
        title: "Product Developer",
        city: "Bengaluru",
        state: "Karnataka",
        country: "India",
        email: null,
        phone: null,
        linkedin_url: "https://www.linkedin.com/in/ACwAADvRneoBccQwYxGlUYF3bUyLPX07u5Vu8zM",
        profile_picture: "https://media.licdn.com/dms/image/v2/C4E03AQF6bSyriefCXQ/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1654869943225?e=1756944000&v=beta&t=mRAqXyn5HJPHS_0UXgrzd9c3XsxBvIZa-Qzx8N5YSNE",
        isTracked: false,
        primaryAnalysisCompleted: false,
        primaryAnalysisRequested: false,
        temperature: "cold",
        in_crm: false,
        created_at: "2025-08-02 03:23:45.810097",
        updated_at: "2025-08-02 03:23:45.810097",
        company: {
          id: "2c4eb2c3-fd20-42df-bfd1-b2b9c1841298",
          name: "CoCreate Ventures",
          logo_url: null,
          industry: "Technology"
        },
        tags: [
          {
            id: "tag-4",
            name: "Developer",
            color: "#8b5cf6"
          },
          {
            id: "tag-5",
            name: "Product",
            color: "#f59e0b"
          }
        ],
        signals: [
          {
            id: "sig-rakshith-1",
            signal_type: "PRODUCT INNOVATION",
            confidence_score: 82
          },
          {
            id: "sig-rakshith-2",
            signal_type: "ACTIVE LINKEDIN",
            confidence_score: 75
          }
        ]
      },
      {
        id: "38f01052-23f9-4fc4-a3e5-e9753f91d281",
        company_id: "2c4eb2c3-fd20-42df-bfd1-b2b9c1841298",
        full_name: "Sarah Johnson",
        title: "Human Resources Intern",
        city: "Bengaluru",
        state: "Karnataka",
        country: "India",
        email: null,
        phone: null,
        linkedin_url: "https://www.linkedin.com/in/ACwAAE4NKTIBPTZO06tjEqFG_wAD_5V156N7Fug",
        profile_picture: "https://media.licdn.com/dms/image/v2/D5603AQHlYbqAySS8sQ/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1732884757037?e=1756944000&v=beta&t=HQsYVLZ6OI6lg8vEQWywal2MKnAqe4otnfmQc9Rc_kA",
        isTracked: false,
        primaryAnalysisCompleted: false,
        primaryAnalysisRequested: true,
        temperature: "warm",
        in_crm: false,
        created_at: "2025-08-02 03:23:45.810097",
        updated_at: "2025-08-02 03:23:45.810097",
        company: {
          id: "2c4eb2c3-fd20-42df-bfd1-b2b9c1841298",
          name: "CoCreate Ventures",
          logo_url: null,
          industry: "Technology"
        },
        tags: [
          {
            id: "tag-6",
            name: "HR",
            color: "#ec4899"
          }
        ],
        signals: [
          {
            id: "sig-savitri-1",
            signal_type: "HR ROLE",
            confidence_score: 70
          },
          {
            id: "sig-savitri-2",
            signal_type: "EARLY CAREER",
            confidence_score: 60
          }
        ]
      },
      {
        id: "97d66b5c-23d4-4102-9fa1-76c60e533442",
        company_id: "2c4eb2c3-fd20-42df-bfd1-b2b9c1841298",
        full_name: "Emma Rodriguez",
        title: "Partnerships Specialist",
        city: "Greater Bengaluru Area",
        state: "Karnataka",
        country: "India",
        email: null,
        phone: null,
        linkedin_url: "https://www.linkedin.com/in/ACwAAFY6rYQBrwtlZTF8H6vT4jpBm0Uf19Nyr5o",
        profile_picture: "https://media.licdn.com/dms/image/v2/D5603AQFbGPqd32a5uA/profile-displayphoto-shrink_100_100/B56ZQllp9gHoAU-/0/1735797416046?e=1756944000&v=beta&t=bVBfE6FF02_xy79cGtumg-IHou_lR7HEgauPYhIV8ZA",
        isTracked: false,
        primaryAnalysisCompleted: false,
        primaryAnalysisRequested: false,
        temperature: "hot",
        in_crm: false,
        created_at: "2025-08-02 03:23:45.810097",
        updated_at: "2025-08-02 03:23:45.810097",
        company: {
          id: "2c4eb2c3-fd20-42df-bfd1-b2b9c1841298",
          name: "CoCreate Ventures",
          logo_url: null,
          industry: "Technology"
        },
        tags: [
          {
            id: "tag-7",
            name: "Partnerships",
            color: "#14b8a6"
          },
          {
            id: "tag-8",
            name: "Strategic",
            color: "#f97316"
          }
        ],
        signals: [
          {
            id: "sig-shweta-1",
            signal_type: "PARTNERSHIP BUILDER",
            confidence_score: 83
          },
          {
            id: "sig-shweta-2",
            signal_type: "DECISION MAKER INFLUENCE",
            confidence_score: 78
          }
        ]
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