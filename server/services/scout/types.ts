import {
  ContactChannel,
  ContactConfidence,
  EvidenceObservation,
  OpportunityScore,
  OutreachStatus,
  PublicContact,
  Opportunity,
  ScoutSettings,
} from '../../../src/types/index.js';

export type {
  ContactChannel,
  ContactConfidence,
  EvidenceObservation,
  OpportunityScore,
  OutreachStatus,
  PublicContact,
  Opportunity,
  ScoutSettings,
};

export interface RawOpportunityCandidate {
  title: string;
  prospectName: string;
  businessName: string;
  websiteUrl?: string;
  niche: string;
  sourcePlatform: 'reddit' | 'twitter' | 'web_search' | 'shopify_community' | 'manual_audit';
  sourceUrl: string;
  sourcePostExcerpt: string;
  detectedPainPoints: string[];
  publicFoundContacts: {
    type: ContactChannel;
    value: string;
    sourceLocation: string;
    confidence: ContactConfidence;
    directLink?: string;
  }[];
  timestamp: string;
}

export interface ScoutRunResult {
  runId: string;
  timestamp: string;
  candidatesDiscovered: number;
  opportunitiesCreated: number;
  telegramAlertsDispatched: number;
  skippedDuplicates: number;
  errors: string[];
}

export interface RefinementRequest {
  opportunityId: string;
  userFeedback: string;
}
