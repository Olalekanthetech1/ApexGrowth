import { dbService } from '../dbService.js';
import { multiAiProviderService } from './multiAiProviderService.js';
import {
  Deal,
  DealStage,
  ActiveProject,
  ProjectPhase,
  ProjectDeliverable,
  ProjectActivity,
  ApprovalGate,
  Opportunity,
} from '../../../src/types/index.js';
import { db } from '../../../src/db/index.js';
import * as schema from '../../../src/db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export class PipelineOperationsService {
  private static instance: PipelineOperationsService;
  private tablesEnsured = false;

  // In-memory fallbacks if postgres is in fallback mode
  private inMemoryDeals: Map<string, Deal> = new Map();
  private inMemoryProjects: Map<string, ActiveProject> = new Map();
  private inMemoryDeliverables: Map<string, ProjectDeliverable[]> = new Map();
  private inMemoryActivities: ProjectActivity[] = [];
  private inMemoryApprovalGates: Map<string, ApprovalGate> = new Map();

  public static getInstance(): PipelineOperationsService {
    if (!PipelineOperationsService.instance) {
      PipelineOperationsService.instance = new PipelineOperationsService();
    }
    return PipelineOperationsService.instance;
  }

  private async ensurePipelineTables(): Promise<void> {
    if (this.tablesEnsured) return;
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS deals (
          id TEXT PRIMARY KEY,
          prospect_id TEXT,
          client_name TEXT NOT NULL,
          client_email TEXT,
          client_company TEXT,
          client_website TEXT,
          service_package TEXT NOT NULL,
          proposed_price INTEGER NOT NULL DEFAULT 0,
          currency TEXT NOT NULL DEFAULT 'USD',
          stage TEXT NOT NULL DEFAULT 'OPEN',
          proposal_summary TEXT,
          proposal_draft TEXT,
          negotiation_notes TEXT,
          payment_status TEXT NOT NULL DEFAULT 'UNPAID',
          agreement_status TEXT NOT NULL DEFAULT 'PENDING',
          expected_delivery_date TIMESTAMPTZ,
          project_id TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS active_projects (
          id TEXT PRIMARY KEY,
          deal_id TEXT NOT NULL,
          prospect_id TEXT,
          client_name TEXT NOT NULL,
          client_email TEXT,
          client_company TEXT,
          client_website TEXT,
          service_package TEXT NOT NULL,
          agreed_price INTEGER NOT NULL DEFAULT 0,
          currency TEXT NOT NULL DEFAULT 'USD',
          current_phase TEXT NOT NULL DEFAULT 'PROJECT_CREATED',
          project_brief TEXT NOT NULL,
          diagnostic_dossier JSONB,
          kickoff_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          target_delivery_date TIMESTAMPTZ,
          completed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS project_deliverables (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          title TEXT NOT NULL,
          phase TEXT NOT NULL DEFAULT 'PHASE_1',
          description TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'TODO',
          draft_content TEXT,
          final_content TEXT,
          client_feedback TEXT,
          order_index INTEGER NOT NULL DEFAULT 0,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS project_activities (
          id TEXT PRIMARY KEY,
          project_id TEXT,
          deal_id TEXT,
          actor TEXT NOT NULL DEFAULT 'SYSTEM',
          event_type TEXT NOT NULL,
          summary TEXT NOT NULL,
          details TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS approval_gates (
          id TEXT PRIMARY KEY,
          deal_id TEXT,
          project_id TEXT,
          action_type TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          proposed_payload JSONB,
          status TEXT NOT NULL DEFAULT 'PENDING',
          reviewed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      this.tablesEnsured = true;
    } catch (err) {
      console.warn('[Pipeline] Postgres ensure tables notice, using fallback storage:', err);
      this.tablesEnsured = true;
    }
  }

  // ==========================================
  // DEAL MANAGEMENT
  // ==========================================

  public async getDeals(stage?: string): Promise<Deal[]> {
    await this.ensurePipelineTables();
    try {
      let query = db.select().from(schema.deals).orderBy(desc(schema.deals.createdAt));
      const rows = await query;
      let dealsList = rows.map((r) => ({
        id: r.id,
        prospectId: r.prospectId || undefined,
        clientName: r.clientName,
        clientEmail: r.clientEmail || undefined,
        clientCompany: r.clientCompany || undefined,
        clientWebsite: r.clientWebsite || undefined,
        servicePackage: r.servicePackage,
        proposedPrice: r.proposedPrice,
        currency: r.currency,
        stage: r.stage as DealStage,
        proposalSummary: r.proposalSummary || undefined,
        proposalDraft: r.proposalDraft || undefined,
        negotiationNotes: r.negotiationNotes || undefined,
        paymentStatus: r.paymentStatus as any,
        agreementStatus: r.agreementStatus as any,
        expectedDeliveryDate: r.expectedDeliveryDate ? r.expectedDeliveryDate.toISOString() : undefined,
        projectId: r.projectId || undefined,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }));

      if (stage) {
        dealsList = dealsList.filter((d) => d.stage === stage);
      }
      return dealsList;
    } catch {
      let list = Array.from(this.inMemoryDeals.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      if (stage) {
        list = list.filter((d) => d.stage === stage);
      }
      return list;
    }
  }

  public async getDealById(id: string): Promise<Deal | null> {
    await this.ensurePipelineTables();
    try {
      const rows = await db.select().from(schema.deals).where(eq(schema.deals.id, id)).limit(1);
      if (rows.length === 0) return null;
      const r = rows[0];
      return {
        id: r.id,
        prospectId: r.prospectId || undefined,
        clientName: r.clientName,
        clientEmail: r.clientEmail || undefined,
        clientCompany: r.clientCompany || undefined,
        clientWebsite: r.clientWebsite || undefined,
        servicePackage: r.servicePackage,
        proposedPrice: r.proposedPrice,
        currency: r.currency,
        stage: r.stage as DealStage,
        proposalSummary: r.proposalSummary || undefined,
        proposalDraft: r.proposalDraft || undefined,
        negotiationNotes: r.negotiationNotes || undefined,
        paymentStatus: r.paymentStatus as any,
        agreementStatus: r.agreementStatus as any,
        expectedDeliveryDate: r.expectedDeliveryDate ? r.expectedDeliveryDate.toISOString() : undefined,
        projectId: r.projectId || undefined,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      };
    } catch {
      return this.inMemoryDeals.get(id) || null;
    }
  }

  public async createDealFromProspect(
    prospectId: string,
    paramsOrPackage?: string | {
      servicePackage?: string;
      proposedPrice?: number;
      currency?: string;
      notes?: string;
    },
    maybePrice?: number
  ): Promise<Deal> {
    const opp = await dbService.getOpportunityById(prospectId);
    if (!opp) throw new Error(`Prospect #${prospectId} not found`);

    const dealId = `deal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    let service = '48-Hour CRO Funnel & Conversion Sprint';
    let price = 2500;
    let currency = 'USD';

    if (typeof paramsOrPackage === 'string') {
      service = paramsOrPackage || service;
      if (maybePrice !== undefined) price = maybePrice;
    } else if (paramsOrPackage && typeof paramsOrPackage === 'object') {
      service = paramsOrPackage.servicePackage || service;
      price = paramsOrPackage.proposedPrice || price;
      currency = paramsOrPackage.currency || currency;
    }

    // Generate tailored commercial proposal draft with dynamic AI
    let proposalDraft = '';
    let proposalSummary = '';

    try {
      const prompt = `You are a consultative business strategist for ApexGrowth Digital.
Generate a structured, professional commercial proposal scope for this prospect:
Client: ${opp.prospectName} (${opp.businessName})
Website: ${opp.websiteUrl || 'Not specified'}
Niche: ${opp.niche}
Observed Audit Findings:
${opp.evidence.map((e) => `- [${e.category}] ${e.observation} (Impact: ${e.potentialImpact})`).join('\n')}

Scope Package: ${service}
Price: $${price} ${currency}

Structure the proposal clearly:
1. Executive Summary & Conversion Objectives
2. High-Impact Problem Solved (rooted strictly in the audit facts)
3. 48-Hour Scope of Work & Milestones
4. Deliverables Checklist
5. Investment & Commercial Terms ($${price})
Keep it executive, sharp, authoritative, and under 250 words.`;

      const aiResult = await multiAiProviderService.generateCompletion(prompt, {
        temperature: 0.6,
      });

      proposalDraft = aiResult.text.trim();
      proposalSummary = `Custom ${service} addressing ${opp.evidence.length} verified friction points for $${price}.`;
    } catch (err) {
      proposalDraft = `Scope: ${service}\nClient: ${opp.businessName}\nInvestment: $${price} ${currency}\nFocus: Resolve checkout and mobile friction points identified in diagnostic audit.`;
      proposalSummary = `${service} ($${price})`;
    }

    let notes = typeof paramsOrPackage === 'object' ? paramsOrPackage?.notes : undefined;

    const deal: Deal = {
      id: dealId,
      prospectId: opp.id,
      clientName: opp.prospectName || opp.businessName,
      clientEmail: opp.publicContacts.find((c) => c.type === 'email')?.value,
      clientCompany: opp.businessName,
      clientWebsite: opp.websiteUrl,
      servicePackage: service,
      proposedPrice: price,
      currency,
      stage: 'QUALIFIED',
      proposalSummary,
      proposalDraft,
      negotiationNotes: notes,
      paymentStatus: 'UNPAID',
      agreementStatus: 'PENDING',
      createdAt: now,
      updatedAt: now,
    };

    await this.ensurePipelineTables();
    try {
      await db.insert(schema.deals).values({
        id: deal.id,
        prospectId: deal.prospectId || null,
        clientName: deal.clientName,
        clientEmail: deal.clientEmail || null,
        clientCompany: deal.clientCompany || null,
        clientWebsite: deal.clientWebsite || null,
        servicePackage: deal.servicePackage,
        proposedPrice: deal.proposedPrice,
        currency: deal.currency,
        stage: deal.stage,
        proposalSummary: deal.proposalSummary || null,
        proposalDraft: deal.proposalDraft || null,
        negotiationNotes: deal.negotiationNotes || null,
        paymentStatus: deal.paymentStatus,
        agreementStatus: deal.agreementStatus,
      });
    } catch {
      this.inMemoryDeals.set(deal.id, deal);
    }

    // Log Activity
    await this.logActivity({
      dealId: deal.id,
      actor: 'AI_ASSISTANT',
      eventType: 'DEAL_CREATED',
      summary: `Deal created for ${deal.clientName} (${deal.servicePackage} - $${deal.proposedPrice})`,
      details: proposalSummary,
    });

    return deal;
  }

  public async updateDealStage(dealId: string, stage: DealStage, notes?: string): Promise<Deal> {
    const deal = await this.getDealById(dealId);
    if (!deal) throw new Error(`Deal #${dealId} not found`);

    deal.stage = stage;
    if (notes) deal.negotiationNotes = notes;
    deal.updatedAt = new Date().toISOString();

    await this.ensurePipelineTables();
    try {
      await db
        .update(schema.deals)
        .set({
          stage,
          negotiationNotes: deal.negotiationNotes || null,
          updatedAt: new Date(),
        })
        .where(eq(schema.deals.id, dealId));
    } catch {
      this.inMemoryDeals.set(dealId, deal);
    }

    await this.logActivity({
      dealId,
      actor: 'USER',
      eventType: stage === 'WON' ? 'DEAL_WON' : 'NOTE_ADDED',
      summary: `Deal stage transitioned to ${stage}`,
      details: notes,
    });

    return deal;
  }

  // ==========================================
  // CONVERT DEAL TO ACTIVE PROJECT
  // ==========================================

  public async convertDealToActiveProject(dealId: string): Promise<ActiveProject> {
    const deal = await this.getDealById(dealId);
    if (!deal) throw new Error(`Deal #${dealId} not found`);

    if (deal.projectId) {
      const existing = await this.getProjectById(deal.projectId);
      if (existing) return existing;
    }

    // 1. Mark deal as WON
    await this.updateDealStage(dealId, 'WON', 'Deal successfully won and converted to live active sprint project.');

    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    // Fetch original prospect audit if present
    let opp: Opportunity | null = null;
    if (deal.prospectId) {
      opp = await dbService.getOpportunityById(deal.prospectId);
    }

    const diagnosticDossier = {
      problemsDetected: opp ? [opp.relevanceSummary] : ['Checkout & Funnel drop-off optimization'],
      liveAuditObservations: opp ? opp.evidence.map((e) => `${e.category}: ${e.observation}`) : [],
      conversionFriction: opp ? opp.evidence.map((e) => e.potentialImpact) : [],
    };

    // 2. Dynamically generate customized sprint brief and phase deliverables using AI
    let projectBrief = '';
    let generatedTasks: Array<{ title: string; phase: string; description: string }> = [];

    try {
      const prompt = `You are the Lead Growth Operations Architect for ApexGrowth Digital.
Generate an actionable, un-templated sprint project execution plan tailored strictly for:
Client: ${deal.clientName} (${deal.clientCompany || 'Client Store'})
Website: ${deal.clientWebsite || 'N/A'}
Service Scope: ${deal.servicePackage}
Agreed Investment: $${deal.proposedPrice} ${deal.currency}
Diagnostic Findings from Live Audit:
${diagnosticDossier.liveAuditObservations.map((o) => `- ${o}`).join('\n') || '- Mobile checkout friction\n- Slow funnel response\n- Value proposition clarity'}

Output JSON in the following schema:
{
  "projectBrief": "Concise 3-sentence executive summary of the sprint objectives and desired KPI lift.",
  "deliverables": [
    {
      "phase": "PHASE_1",
      "title": "Clear action title",
      "description": "Specific deliverable scope rooted in the client audit"
    },
    {
      "phase": "PHASE_1",
      "title": "Clear action title",
      "description": "Specific deliverable scope"
    },
    {
      "phase": "PHASE_2",
      "title": "Clear action title",
      "description": "Specific deliverable scope"
    },
    {
      "phase": "REVIEW",
      "title": "Final Teardown & Growth Roadmap Handoff",
      "description": "Comprehensive client delivery dossier and executive review"
    }
  ]
}
Return ONLY valid JSON.`;

      const aiRes = await multiAiProviderService.generateCompletion(prompt, {
        temperature: 0.5,
      });

      const parsed = JSON.parse(aiRes.text.replace(/```json|```/gi, '').trim());
      projectBrief = parsed.projectBrief;
      generatedTasks = parsed.deliverables;
    } catch {
      projectBrief = `Sprint execution plan for ${deal.clientName} addressing friction points identified during initial technical diagnostic audit. Focus on fast conversion gains across checkout, mobile layout, and CTA clarity.`;
      generatedTasks = [
        {
          phase: 'PHASE_1',
          title: 'Immediate Friction Teardown & Hero Fixes',
          description: 'Address initial mobile layout bottlenecks and CTA contrast identified during audit.',
        },
        {
          phase: 'PHASE_1',
          title: 'Checkout Form & Trust Architecture Redesign',
          description: 'Streamline checkout fields and inject verified social proof badges.',
        },
        {
          phase: 'PHASE_2',
          title: 'Copy & Offer Framing Overhaul',
          description: 'Rewrite key value propositions and objection-handling FAQs for higher conversions.',
        },
        {
          phase: 'REVIEW',
          title: 'Final CRO Sprint Report & Client Handoff',
          description: 'Deliver the finalized assets, before/after audit comparisons, and ongoing retainer recommendations.',
        },
      ];
    }

    const project: ActiveProject = {
      id: projectId,
      dealId,
      prospectId: deal.prospectId,
      clientName: deal.clientName,
      clientEmail: deal.clientEmail,
      clientCompany: deal.clientCompany,
      clientWebsite: deal.clientWebsite,
      servicePackage: deal.servicePackage,
      agreedPrice: deal.proposedPrice,
      currency: deal.currency,
      currentPhase: 'KICKOFF',
      projectBrief,
      diagnosticDossier,
      kickoffDate: now,
      createdAt: now,
      updatedAt: now,
    };

    await this.ensurePipelineTables();
    try {
      await db.insert(schema.activeProjects).values({
        id: project.id,
        dealId: project.dealId,
        prospectId: project.prospectId || null,
        clientName: project.clientName,
        clientEmail: project.clientEmail || null,
        clientCompany: project.clientCompany || null,
        clientWebsite: project.clientWebsite || null,
        servicePackage: project.servicePackage,
        agreedPrice: project.agreedPrice,
        currency: project.currency,
        currentPhase: project.currentPhase,
        projectBrief: project.projectBrief,
        diagnosticDossier: project.diagnosticDossier as any,
      });

      // Update deal with project id
      await db
        .update(schema.deals)
        .set({ projectId: project.id, updatedAt: new Date() })
        .where(eq(schema.deals.id, dealId));
    } catch {
      this.inMemoryProjects.set(project.id, project);
      deal.projectId = project.id;
      this.inMemoryDeals.set(dealId, deal);
    }

    // Insert dynamic deliverables
    const deliverableObjects: ProjectDeliverable[] = [];
    for (let i = 0; i < generatedTasks.length; i++) {
      const task = generatedTasks[i];
      const delId = `del_${Date.now()}_${i}`;
      const deliverable: ProjectDeliverable = {
        id: delId,
        projectId: project.id,
        title: task.title,
        phase: task.phase,
        description: task.description,
        status: 'TODO',
        orderIndex: i,
        updatedAt: now,
      };
      deliverableObjects.push(deliverable);

      try {
        await db.insert(schema.projectDeliverables).values({
          id: deliverable.id,
          projectId: deliverable.projectId,
          title: deliverable.title,
          phase: deliverable.phase,
          description: deliverable.description,
          status: deliverable.status,
          orderIndex: deliverable.orderIndex,
        });
      } catch {
        // Fallback
      }
    }
    this.inMemoryDeliverables.set(project.id, deliverableObjects);

    // Log project creation activity
    await this.logActivity({
      projectId: project.id,
      dealId,
      actor: 'USER',
      eventType: 'PROJECT_CREATED',
      summary: `🚀 Active Project initiated for ${project.clientName} (${project.servicePackage})`,
      details: project.projectBrief,
    });

    return project;
  }

  // ==========================================
  // PROJECT & DELIVERABLES OPERATIONS
  // ==========================================

  public async getActiveProjects(phase?: string): Promise<ActiveProject[]> {
    await this.ensurePipelineTables();
    try {
      const rows = await db.select().from(schema.activeProjects).orderBy(desc(schema.activeProjects.createdAt));
      let projects: ActiveProject[] = [];

      for (const r of rows) {
        const deliverables = await this.getProjectDeliverables(r.id);
        const activities = await this.getProjectActivities(r.id);
        const approvals = await this.getPendingApprovalsForProject(r.id);

        projects.push({
          id: r.id,
          dealId: r.dealId,
          prospectId: r.prospectId || undefined,
          clientName: r.clientName,
          clientEmail: r.clientEmail || undefined,
          clientCompany: r.clientCompany || undefined,
          clientWebsite: r.clientWebsite || undefined,
          servicePackage: r.servicePackage,
          agreedPrice: r.agreedPrice,
          currency: r.currency,
          currentPhase: r.currentPhase as ProjectPhase,
          projectBrief: r.projectBrief,
          diagnosticDossier: r.diagnosticDossier as any,
          deliverables,
          activities,
          pendingApprovals: approvals,
          kickoffDate: r.kickoffDate.toISOString(),
          targetDeliveryDate: r.targetDeliveryDate ? r.targetDeliveryDate.toISOString() : undefined,
          completedAt: r.completedAt ? r.completedAt.toISOString() : undefined,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        });
      }
      if (phase) {
        projects = projects.filter((p) => p.currentPhase === phase);
      }
      return projects;
    } catch {
      let list = Array.from(this.inMemoryProjects.values());
      if (phase) {
        list = list.filter((p) => p.currentPhase === phase);
      }
      return list;
    }
  }

  public async getProjectById(id: string): Promise<ActiveProject | null> {
    await this.ensurePipelineTables();
    try {
      const rows = await db.select().from(schema.activeProjects).where(eq(schema.activeProjects.id, id)).limit(1);
      if (rows.length === 0) return null;
      const r = rows[0];
      const deliverables = await this.getProjectDeliverables(r.id);
      const activities = await this.getProjectActivities(r.id);
      const approvals = await this.getPendingApprovalsForProject(r.id);

      return {
        id: r.id,
        dealId: r.dealId,
        prospectId: r.prospectId || undefined,
        clientName: r.clientName,
        clientEmail: r.clientEmail || undefined,
        clientCompany: r.clientCompany || undefined,
        clientWebsite: r.clientWebsite || undefined,
        servicePackage: r.servicePackage,
        agreedPrice: r.agreedPrice,
        currency: r.currency,
        currentPhase: r.currentPhase as ProjectPhase,
        projectBrief: r.projectBrief,
        diagnosticDossier: r.diagnosticDossier as any,
        deliverables,
        activities,
        pendingApprovals: approvals,
        kickoffDate: r.kickoffDate.toISOString(),
        targetDeliveryDate: r.targetDeliveryDate ? r.targetDeliveryDate.toISOString() : undefined,
        completedAt: r.completedAt ? r.completedAt.toISOString() : undefined,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      };
    } catch {
      const p = this.inMemoryProjects.get(id);
      if (!p) return null;
      p.deliverables = this.inMemoryDeliverables.get(id) || [];
      return p;
    }
  }

  public async getProjectDeliverables(projectId: string): Promise<ProjectDeliverable[]> {
    await this.ensurePipelineTables();
    try {
      const rows = await db
        .select()
        .from(schema.projectDeliverables)
        .where(eq(schema.projectDeliverables.projectId, projectId))
        .orderBy(schema.projectDeliverables.orderIndex);

      return rows.map((r) => ({
        id: r.id,
        projectId: r.projectId,
        title: r.title,
        phase: r.phase,
        description: r.description,
        status: r.status as any,
        draftContent: r.draftContent || undefined,
        finalContent: r.finalContent || undefined,
        clientFeedback: r.clientFeedback || undefined,
        orderIndex: r.orderIndex,
        updatedAt: r.updatedAt.toISOString(),
      }));
    } catch {
      return this.inMemoryDeliverables.get(projectId) || [];
    }
  }

  public async updateDeliverableStatus(
    deliverableId: string,
    status: ProjectDeliverable['status'],
    content?: { draft?: string; final?: string; feedback?: string }
  ): Promise<ProjectDeliverable> {
    await this.ensurePipelineTables();
    let updatedDeliverable: ProjectDeliverable | null = null;

    try {
      const rows = await db
        .select()
        .from(schema.projectDeliverables)
        .where(eq(schema.projectDeliverables.id, deliverableId))
        .limit(1);

      if (rows.length > 0) {
        const r = rows[0];
        const patch: any = { status, updatedAt: new Date() };
        if (content?.draft !== undefined) patch.draftContent = content.draft;
        if (content?.final !== undefined) patch.finalContent = content.final;
        if (content?.feedback !== undefined) patch.clientFeedback = content.feedback;

        await db.update(schema.projectDeliverables).set(patch).where(eq(schema.projectDeliverables.id, deliverableId));

        updatedDeliverable = {
          id: r.id,
          projectId: r.projectId,
          title: r.title,
          phase: r.phase,
          description: r.description,
          status,
          draftContent: content?.draft ?? r.draftContent ?? undefined,
          finalContent: content?.final ?? r.finalContent ?? undefined,
          clientFeedback: content?.feedback ?? r.clientFeedback ?? undefined,
          orderIndex: r.orderIndex,
          updatedAt: new Date().toISOString(),
        };
      }
    } catch {
      // Memory fallback
    }

    if (!updatedDeliverable) {
      throw new Error(`Deliverable #${deliverableId} not found`);
    }

    await this.logActivity({
      projectId: updatedDeliverable.projectId,
      actor: 'USER',
      eventType: 'DELIVERABLE_GENERATED',
      summary: `Deliverable "${updatedDeliverable.title}" marked as ${status}`,
    });

    return updatedDeliverable;
  }

  public async advanceProjectPhase(projectId: string, phase: ProjectPhase): Promise<ActiveProject> {
    const project = await this.getProjectById(projectId);
    if (!project) throw new Error(`Project #${projectId} not found`);

    project.currentPhase = phase;
    project.updatedAt = new Date().toISOString();
    if (phase === 'COMPLETED' || phase === 'RETAINER') {
      project.completedAt = new Date().toISOString();
    }

    await this.ensurePipelineTables();
    try {
      await db
        .update(schema.activeProjects)
        .set({
          currentPhase: phase,
          completedAt: project.completedAt ? new Date(project.completedAt) : null,
          updatedAt: new Date(),
        })
        .where(eq(schema.activeProjects.id, projectId));
    } catch {
      this.inMemoryProjects.set(projectId, project);
    }

    await this.logActivity({
      projectId,
      actor: 'USER',
      eventType: 'PHASE_ADVANCED',
      summary: `Project advanced to ${phase}`,
    });

    return project;
  }

  // ==========================================
  // CO-EXECUTION WITH DYNAMIC AI WORKSPACE
  // ==========================================

  /**
   * Co-works with AI on a specific project. AI reads the entire project scope,
   * audit observations, completed tasks, and requested user action.
   */
  public async coWorkWithAi(
    projectId: string,
    instruction: string
  ): Promise<{ responseText: string; suggestedDeliverable?: { title: string; content: string } }> {
    const project = await this.getProjectById(projectId);
    if (!project) throw new Error(`Project #${projectId} not found`);

    const deliverables = await this.getProjectDeliverables(projectId);
    const activities = await this.getProjectActivities(projectId);

    const prompt = `You are ApexGrowth Assistant, co-working with the founder/growth operator on an active client delivery project.

CURRENT PROJECT CONTEXT:
Client Name: ${project.clientName}
Company: ${project.clientCompany || 'Client Store'}
Website: ${project.clientWebsite || 'N/A'}
Service Package: ${project.servicePackage}
Current Phase: ${project.currentPhase}
Agreed Investment: $${project.agreedPrice} ${project.currency}

DIAGNOSTIC AUDIT OBSERVATIONS:
${project.diagnosticDossier?.liveAuditObservations.map((o) => `- ${o}`).join('\n') || '- Verified checkout & conversion friction'}

DELIVERABLES STATUS:
${deliverables.map((d) => `[${d.status}] (${d.phase}) ${d.title}: ${d.description}`).join('\n')}

RECENT ACTIVITY TIMELINE:
${activities.slice(0, 5).map((a) => `- ${a.summary}`).join('\n')}

OPERATOR INSTRUCTION:
"${instruction}"

INSTRUCTIONS:
1. Provide an executive, direct, high-value response addressing the operator's instruction.
2. If the user asks to draft an asset (e.g. copy rewrite, audit report, email, teardown, or task draft), write the complete, un-templated content.
3. Be professional, direct, and factual. Do not output placeholders.`;

    const aiRes = await multiAiProviderService.generateCompletion(prompt, {
      temperature: 0.6,
      maxTokens: 1500,
    });

    await this.logActivity({
      projectId,
      actor: 'AI_ASSISTANT',
      eventType: 'NOTE_ADDED',
      summary: `AI Assistant executed co-work instruction: "${instruction.slice(0, 60)}..."`,
    });

    return {
      responseText: aiRes.text.trim(),
    };
  }

  // ==========================================
  // HUMAN APPROVAL GATES
  // ==========================================

  public async requestApprovalGate(
    actionType: ApprovalGate['actionType'],
    title: string,
    description: string,
    proposedPayload: Record<string, any>,
    contextIds: { dealId?: string; projectId?: string }
  ): Promise<ApprovalGate> {
    const gateId = `gate_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const gate: ApprovalGate = {
      id: gateId,
      dealId: contextIds.dealId,
      projectId: contextIds.projectId,
      actionType,
      title,
      description,
      proposedPayload,
      status: 'PENDING',
      createdAt: now,
    };

    await this.ensurePipelineTables();
    try {
      await db.insert(schema.approvalGates).values({
        id: gate.id,
        dealId: gate.dealId || null,
        projectId: gate.projectId || null,
        actionType: gate.actionType,
        title: gate.title,
        description: gate.description,
        proposedPayload: gate.proposedPayload as any,
        status: gate.status,
      });
    } catch {
      this.inMemoryApprovalGates.set(gate.id, gate);
    }

    await this.logActivity({
      dealId: gate.dealId,
      projectId: gate.projectId,
      actor: 'AI_ASSISTANT',
      eventType: 'APPROVAL_REQUESTED',
      summary: `Approval Gate requested: ${title}`,
      details: description,
    });

    return gate;
  }

  public async resolveApprovalGate(gateId: string, approved: boolean): Promise<ApprovalGate> {
    await this.ensurePipelineTables();
    let gate: ApprovalGate | null = null;

    try {
      const rows = await db.select().from(schema.approvalGates).where(eq(schema.approvalGates.id, gateId)).limit(1);
      if (rows.length > 0) {
        const r = rows[0];
        const status = approved ? 'APPROVED' : 'REJECTED';
        const now = new Date();

        await db
          .update(schema.approvalGates)
          .set({ status, reviewedAt: now })
          .where(eq(schema.approvalGates.id, gateId));

        gate = {
          id: r.id,
          dealId: r.dealId || undefined,
          projectId: r.projectId || undefined,
          actionType: r.actionType as any,
          title: r.title,
          description: r.description,
          proposedPayload: r.proposedPayload as any,
          status,
          reviewedAt: now.toISOString(),
          createdAt: r.createdAt.toISOString(),
        };
      }
    } catch {
      // Memory fallback
    }

    if (!gate) {
      gate = this.inMemoryApprovalGates.get(gateId) || null;
      if (gate) {
        gate.status = approved ? 'APPROVED' : 'REJECTED';
        gate.reviewedAt = new Date().toISOString();
      }
    }

    if (!gate) throw new Error(`Approval Gate #${gateId} not found`);

    await this.logActivity({
      dealId: gate.dealId,
      projectId: gate.projectId,
      actor: 'USER',
      eventType: 'APPROVAL_GRANTED',
      summary: `Approval Gate "${gate.title}" ${approved ? 'APPROVED' : 'REJECTED'} by operator`,
    });

    return gate;
  }

  public async getApprovalGates(status?: string): Promise<ApprovalGate[]> {
    await this.ensurePipelineTables();
    try {
      const rows = await db.select().from(schema.approvalGates).orderBy(desc(schema.approvalGates.createdAt));
      let gates = rows.map((r) => ({
        id: r.id,
        dealId: r.dealId || undefined,
        projectId: r.projectId || undefined,
        actionType: r.actionType as any,
        title: r.title,
        description: r.description,
        proposedPayload: r.proposedPayload as any,
        status: r.status as any,
        reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : undefined,
        createdAt: r.createdAt.toISOString(),
      }));
      if (status) {
        gates = gates.filter((g) => g.status.toUpperCase() === status.toUpperCase());
      }
      return gates;
    } catch {
      let memoryGates = Array.from(this.inMemoryApprovalGates.values());
      if (status) {
        memoryGates = memoryGates.filter((g) => g.status.toUpperCase() === status.toUpperCase());
      }
      return memoryGates;
    }
  }

  public async getPendingApprovalsForProject(projectId: string): Promise<ApprovalGate[]> {
    await this.ensurePipelineTables();
    try {
      const rows = await db
        .select()
        .from(schema.approvalGates)
        .where(eq(schema.approvalGates.projectId, projectId));
      return rows
        .filter((r) => r.status === 'PENDING')
        .map((r) => ({
          id: r.id,
          dealId: r.dealId || undefined,
          projectId: r.projectId || undefined,
          actionType: r.actionType as any,
          title: r.title,
          description: r.description,
          proposedPayload: r.proposedPayload as any,
          status: r.status as any,
          createdAt: r.createdAt.toISOString(),
        }));
    } catch {
      return Array.from(this.inMemoryApprovalGates.values()).filter(
        (g) => g.projectId === projectId && g.status === 'PENDING'
      );
    }
  }

  public async addDeliverable(data: {
    projectId: string;
    title: string;
    description: string;
    phase?: string;
    requiresApproval?: boolean;
  }): Promise<ProjectDeliverable> {
    await this.ensurePipelineTables();
    const delivId = `deliv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const deliverable: ProjectDeliverable = {
      id: delivId,
      projectId: data.projectId,
      title: data.title,
      phase: (data.phase as any) || 'PHASE_1',
      description: data.description || '',
      status: 'TODO',
      draftContent: undefined,
      finalContent: undefined,
      clientFeedback: undefined,
      orderIndex: 99,
      requiresApproval: data.requiresApproval !== false,
      updatedAt: new Date().toISOString(),
    };

    try {
      await db.insert(schema.projectDeliverables).values({
        id: deliverable.id,
        projectId: deliverable.projectId,
        title: deliverable.title,
        phase: deliverable.phase,
        description: deliverable.description,
        status: deliverable.status,
        draftContent: null,
        finalContent: null,
        clientFeedback: null,
        orderIndex: 99,
      });
    } catch {
      const list = this.inMemoryDeliverables.get(data.projectId) || [];
      list.push(deliverable);
      this.inMemoryDeliverables.set(data.projectId, list);
    }

    await this.logActivity({
      projectId: data.projectId,
      actor: 'USER',
      eventType: 'DELIVERABLE_GENERATED',
      summary: `New deliverable created: "${data.title}"`,
      details: data.description,
    });

    return deliverable;
  }

  // ==========================================
  // ACTIVITIES & AUDIT LOGS
  // ==========================================

  public async logActivity(activity: {
    projectId?: string;
    dealId?: string;
    actor: ProjectActivity['actor'];
    eventType: ProjectActivity['eventType'];
    summary: string;
    details?: string;
  }): Promise<ProjectActivity> {
    const actId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const entry: ProjectActivity = {
      id: actId,
      projectId: activity.projectId,
      dealId: activity.dealId,
      actor: activity.actor,
      eventType: activity.eventType,
      summary: activity.summary,
      details: activity.details,
      createdAt: now,
    };

    await this.ensurePipelineTables();
    try {
      await db.insert(schema.projectActivities).values({
        id: entry.id,
        projectId: entry.projectId || null,
        dealId: entry.dealId || null,
        actor: entry.actor,
        eventType: entry.eventType,
        summary: entry.summary,
        details: entry.details || null,
      });
    } catch {
      this.inMemoryActivities.push(entry);
    }

    return entry;
  }

  public async getProjectActivities(projectId: string): Promise<ProjectActivity[]> {
    await this.ensurePipelineTables();
    try {
      const rows = await db
        .select()
        .from(schema.projectActivities)
        .where(eq(schema.projectActivities.projectId, projectId))
        .orderBy(desc(schema.projectActivities.createdAt))
        .limit(20);

      return rows.map((r) => ({
        id: r.id,
        projectId: r.projectId || undefined,
        dealId: r.dealId || undefined,
        actor: r.actor as any,
        eventType: r.eventType as any,
        summary: r.summary,
        details: r.details || undefined,
        createdAt: r.createdAt.toISOString(),
      }));
    } catch {
      return this.inMemoryActivities.filter((a) => a.projectId === projectId).reverse();
    }
  }
}

export const pipelineOperationsService = PipelineOperationsService.getInstance();
