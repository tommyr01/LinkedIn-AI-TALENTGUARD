/**
 * Customer Intelligence Processor
 * Analyzes customer data to generate insights similar to the EthosEnergy report
 */

import { OpenAI } from 'openai';

export interface CustomerData {
  companyName: string;
  meetings: MeetingTranscript[];
  emails: EmailThread[];
  supportTickets: SupportTicket[];
  productUsage: UsageMetrics;
  crmData: CRMRecord;
}

export interface MeetingTranscript {
  date: string;
  participants: Participant[];
  transcript: string;
  duration: number;
  topics: string[];
}

export interface Participant {
  name: string;
  title: string;
  email: string;
  role?: 'champion' | 'decision_maker' | 'influencer' | 'blocker';
}

export interface Insight {
  type: 'pain_point' | 'opportunity' | 'feature_request' | 'objection';
  description: string;
  priority: 'high' | 'medium' | 'low';
  source: string;
  date: string;
  quotes: string[];
}

export interface Opportunity {
  title: string;
  need: string;
  validation: 'strong' | 'medium' | 'weak';
  source: string;
  product: string;
  chroValue: string;
  dealAccelerators: string[];
}

export class IntelligenceProcessor {
  private openai: OpenAI;
  
  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }
  
  async processCustomerData(data: CustomerData): Promise<CustomerIntelligenceReport> {
    // Step 1: Extract insights from all data sources
    const insights = await this.extractInsights(data);
    
    // Step 2: Identify key opportunities
    const opportunities = await this.identifyOpportunities(insights, data);
    
    // Step 3: Map stakeholders and their roles
    const stakeholderMap = await this.mapStakeholders(data);
    
    // Step 4: Generate sales strategy
    const salesStrategy = await this.generateSalesStrategy(opportunities, stakeholderMap);
    
    // Step 5: Create personalized outreach
    const outreach = await this.generateOutreach(stakeholderMap, opportunities);
    
    return {
      companyName: data.companyName,
      executiveSummary: this.createExecutiveSummary(insights, opportunities),
      insights,
      opportunities,
      stakeholderMap,
      salesStrategy,
      outreach,
      appendix: {
        meetingHighlights: this.extractMeetingHighlights(data.meetings),
        keyQuotes: this.extractKeyQuotes(data.meetings),
        timeline: this.createTimeline(data)
      }
    };
  }
  
  private async extractInsights(data: CustomerData): Promise<Insight[]> {
    const insights: Insight[] = [];
    
    // Process meeting transcripts
    for (const meeting of data.meetings) {
      const meetingInsights = await this.analyzeMeeting(meeting);
      insights.push(...meetingInsights);
    }
    
    // Process support tickets
    const ticketInsights = await this.analyzeTickets(data.supportTickets);
    insights.push(...ticketInsights);
    
    // Process product usage patterns
    const usageInsights = await this.analyzeUsage(data.productUsage);
    insights.push(...usageInsights);
    
    // Deduplicate and prioritize
    return this.consolidateInsights(insights);
  }
  
  private async analyzeMeeting(meeting: MeetingTranscript): Promise<Insight[]> {
    const prompt = `
      Analyze this meeting transcript and extract:
      1. Pain points mentioned by the customer
      2. Feature requests or product feedback
      3. Objections or concerns raised
      4. Success criteria or goals mentioned
      5. Budget or timeline indicators
      
      For each insight, provide:
      - Type (pain_point, opportunity, feature_request, objection)
      - Description
      - Priority (high, medium, low)
      - Direct quotes supporting the insight
      
      Transcript: ${meeting.transcript}
    `;
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });
    
    return this.parseInsightsFromResponse(response.choices[0].message.content, meeting);
  }
  
  private async identifyOpportunities(
    insights: Insight[], 
    data: CustomerData
  ): Promise<Opportunity[]> {
    const opportunities: Opportunity[] = [];
    
    // Map insights to product opportunities
    const painPointGroups = this.groupInsightsByTheme(insights);
    
    for (const [theme, themeInsights] of Object.entries(painPointGroups)) {
      const opportunity = await this.createOpportunity(theme, themeInsights, data);
      if (opportunity) {
        opportunities.push(opportunity);
      }
    }
    
    // Sort by validation strength and priority
    return opportunities.sort((a, b) => {
      const validationScore = { strong: 3, medium: 2, weak: 1 };
      return validationScore[b.validation] - validationScore[a.validation];
    });
  }
  
  private async createOpportunity(
    theme: string, 
    insights: Insight[], 
    data: CustomerData
  ): Promise<Opportunity | null> {
    // Map common themes to specific opportunities
    const opportunityMap: Record<string, Partial<Opportunity>> = {
      'reporting': {
        title: 'Reliable Goal Status Dashboards',
        product: 'Check-ins and Reviews',
        chroValue: 'Restores HR credibility with executives; improves accountability'
      },
      'user_experience': {
        title: 'Persona-Based UX Simplification',
        product: 'Persona-based Configuration + Microlearning',
        chroValue: 'Empowers all HR roles, reduces training load'
      },
      'analytics': {
        title: 'Function-Level Development Insights',
        product: 'Talent Frameworks + Career Pathing Analytics',
        chroValue: 'Strategic development focus by region and function'
      },
      'integration': {
        title: 'Dynamic, HRIS-Integrated Reporting',
        product: 'Reporting Suite + HRIS Integration Layer',
        chroValue: 'One source of truth for talent data'
      }
    };
    
    const baseOpportunity = opportunityMap[theme];
    if (!baseOpportunity) return null;
    
    return {
      ...baseOpportunity,
      title: baseOpportunity.title!,
      need: this.summarizeNeed(insights),
      validation: this.calculateValidation(insights),
      source: insights[0].source,
      product: baseOpportunity.product!,
      chroValue: baseOpportunity.chroValue!,
      dealAccelerators: this.identifyAccelerators(theme, data)
    };
  }
  
  private async mapStakeholders(data: CustomerData): Promise<StakeholderMap> {
    const stakeholders: Map<string, Stakeholder> = new Map();
    
    // Extract from meetings
    for (const meeting of data.meetings) {
      for (const participant of meeting.participants) {
        const existing = stakeholders.get(participant.email) || participant;
        
        // Enhance with meeting context
        const enhanced = await this.enhanceStakeholderProfile(
          existing,
          meeting,
          data
        );
        
        stakeholders.set(participant.email, enhanced);
      }
    }
    
    // Categorize by role
    return this.categorizeStakeholders(Array.from(stakeholders.values()));
  }
  
  private async generateOutreach(
    stakeholderMap: StakeholderMap,
    opportunities: Opportunity[]
  ): Promise<OutreachTemplates> {
    const templates: OutreachTemplates = {};
    
    // Generate for key personas
    const keyPersonas = [
      ...stakeholderMap.decisionMakers,
      ...stakeholderMap.champions
    ];
    
    for (const persona of keyPersonas) {
      const relevantOpps = opportunities.filter(opp => 
        this.matchesPersonaNeeds(opp, persona)
      );
      
      templates[persona.name] = await this.createEmailSequence(
        persona,
        relevantOpps
      );
    }
    
    return templates;
  }
  
  private async createEmailSequence(
    persona: Stakeholder,
    opportunities: Opportunity[]
  ): Promise<EmailSequence> {
    const prompt = `
      Create a 3-email outreach sequence for:
      
      Name: ${persona.name}
      Title: ${persona.title}
      Department: ${persona.department}
      Pain Points: ${persona.painPoints.join(', ')}
      Communication Style: ${persona.communicationStyle}
      
      Product Solutions: ${opportunities.map(o => o.title).join(', ')}
      
      Requirements:
      - Email 1: Hook with their specific pain point
      - Email 2: Build value with social proof
      - Email 3: Clear call to action
      - Keep each email under 150 words
      - Match their communication style
      - Include specific value props
    `;
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });
    
    return this.parseEmailSequence(response.choices[0].message.content);
  }
  
  // Helper methods
  private groupInsightsByTheme(insights: Insight[]): Record<string, Insight[]> {
    const groups: Record<string, Insight[]> = {};
    
    for (const insight of insights) {
      const theme = this.categorizeTheme(insight);
      if (!groups[theme]) groups[theme] = [];
      groups[theme].push(insight);
    }
    
    return groups;
  }
  
  private categorizeTheme(insight: Insight): string {
    const keywords = {
      reporting: ['report', 'dashboard', 'metrics', 'visibility', 'data'],
      user_experience: ['UI', 'UX', 'interface', 'navigation', 'confusing'],
      analytics: ['insights', 'analytics', 'trends', 'patterns'],
      integration: ['integrate', 'sync', 'HRIS', 'API', 'connect']
    };
    
    const description = insight.description.toLowerCase();
    
    for (const [theme, words] of Object.entries(keywords)) {
      if (words.some(word => description.includes(word))) {
        return theme;
      }
    }
    
    return 'general';
  }
  
  private calculateValidation(insights: Insight[]): 'strong' | 'medium' | 'weak' {
    const highPriorityCount = insights.filter(i => i.priority === 'high').length;
    const totalCount = insights.length;
    
    if (highPriorityCount >= 3 || totalCount >= 5) return 'strong';
    if (highPriorityCount >= 1 || totalCount >= 3) return 'medium';
    return 'weak';
  }
}

// Type definitions
export interface CustomerIntelligenceReport {
  companyName: string;
  executiveSummary: ExecutiveSummary;
  insights: Insight[];
  opportunities: Opportunity[];
  stakeholderMap: StakeholderMap;
  salesStrategy: SalesStrategy;
  outreach: OutreachTemplates;
  appendix: Appendix;
}

export interface StakeholderMap {
  decisionMakers: Stakeholder[];
  champions: Stakeholder[];
  influencers: Stakeholder[];
  endUsers: Stakeholder[];
  blockers: Stakeholder[];
}

export interface Stakeholder extends Participant {
  department: string;
  painPoints: string[];
  priorities: string[];
  communicationStyle: string;
  engagementLevel: 'high' | 'medium' | 'low';
}

export interface EmailSequence {
  email1: EmailTemplate;
  email2: EmailTemplate;
  email3: EmailTemplate;
}

export interface EmailTemplate {
  subject: string;
  body: string;
  callToAction: string;
} 