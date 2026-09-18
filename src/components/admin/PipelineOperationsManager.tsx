import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Layers,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Plus,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  DollarSign,
  User,
  Building,
  Send,
  MessageSquare,
  ChevronRight,
  ExternalLink,
  Sliders,
  Check,
  Bot,
  Zap,
} from 'lucide-react';
import { api } from '../../lib/api';
import {
  Deal,
  ActiveProject,
  ProjectDeliverable,
  ApprovalGate,
  DealStage,
  ProjectPhase,
  DeliverableStatus,
} from '../../types/index';

export const PipelineOperationsManager: React.FC = () => {
  const [activeView, setActiveView] = useState<'pipeline' | 'deals' | 'projects' | 'approvals'>('pipeline');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [projects, setProjects] = useState<ActiveProject[]>([]);
  const [approvals, setApprovals] = useState<ApprovalGate[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Co-working state
  const [coWorkModalProject, setCoWorkModalProject] = useState<ActiveProject | null>(null);
  const [coWorkInstruction, setCoWorkInstruction] = useState('');
  const [coWorkRunning, setCoWorkRunning] = useState(false);
  const [coWorkOutput, setCoWorkOutput] = useState<string | null>(null);

  // Create Deal Modal
  const [createDealModal, setCreateDealModal] = useState(false);
  const [newDealProspectId, setNewDealProspectId] = useState('');
  const [newDealService, setNewDealService] = useState('$2,500 Full-Funnel CRO Sprint');
  const [newDealPrice, setNewDealPrice] = useState<number>(2500);

  // New Deliverable Modal
  const [addDeliverableProject, setAddDeliverableProject] = useState<ActiveProject | null>(null);
  const [newDelivTitle, setNewDelivTitle] = useState('');
  const [newDelivDesc, setNewDelivDesc] = useState('');
  const [newDelivPhase, setNewDelivPhase] = useState<ProjectPhase>('PHASE_1');
  const [newDelivApproval, setNewDelivApproval] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dealsData, projectsData, approvalsData] = await Promise.all([
        api.getDeals(),
        api.getActiveProjects(),
        api.getApprovalGates(),
      ]);
      setDeals(Array.isArray(dealsData) ? dealsData : []);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
      setApprovals(Array.isArray(approvalsData) ? approvalsData : []);
    } catch (err) {
      console.error('Failed to load pipeline operations data:', err);
      setDeals([]);
      setProjects([]);
      setApprovals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConvertToProject = async (dealId: string) => {
    setActionLoading(`convert-${dealId}`);
    try {
      await api.convertDealToProject(dealId);
      await loadData();
      setActiveView('projects');
    } catch (err: any) {
      alert(err?.message || 'Failed to convert deal to active project');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateDealStage = async (dealId: string, newStage: DealStage) => {
    setActionLoading(`stage-${dealId}`);
    try {
      await api.updateDealStage(dealId, newStage);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to update deal stage');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAdvanceProjectPhase = async (projectId: string, newPhase: ProjectPhase) => {
    setActionLoading(`phase-${projectId}`);
    try {
      await api.updateProjectPhase(projectId, newPhase);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to update project phase');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateDeliverableStatus = async (deliverableId: string, status: DeliverableStatus) => {
    setActionLoading(`deliv-${deliverableId}`);
    try {
      await api.updateDeliverableStatus(deliverableId, status);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to update deliverable status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprovalDecision = async (approvalId: string, status: 'APPROVED' | 'REJECTED') => {
    setActionLoading(`appr-${approvalId}`);
    try {
      await api.decideApprovalGate(approvalId, status);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to process approval decision');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCoWorkSubmit = async () => {
    if (!coWorkModalProject || !coWorkInstruction.trim()) return;
    setCoWorkRunning(true);
    try {
      const res = await api.coWorkWithAi(coWorkModalProject.id, coWorkInstruction);
      setCoWorkOutput(res.responseText);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Co-working failed');
    } finally {
      setCoWorkRunning(false);
    }
  };

  const handleCreateDeliverable = async () => {
    if (!addDeliverableProject || !newDelivTitle.trim()) return;
    setActionLoading('add-deliv');
    try {
      await api.addDeliverable({
        projectId: addDeliverableProject.id,
        title: newDelivTitle,
        description: newDelivDesc,
        phase: newDelivPhase,
        requiresApproval: newDelivApproval,
      });
      setAddDeliverableProject(null);
      setNewDelivTitle('');
      setNewDelivDesc('');
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to create deliverable');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateNewDeal = async () => {
    if (!newDealProspectId.trim()) {
      alert('Please enter an audited opportunity or prospect ID');
      return;
    }
    setActionLoading('create-deal');
    try {
      await api.createDeal({
        prospectId: newDealProspectId.trim(),
        servicePackage: newDealService,
        proposedPrice: Number(newDealPrice),
      });
      setCreateDealModal(false);
      setNewDealProspectId('');
      await loadData();
      setActiveView('deals');
    } catch (err: any) {
      alert(err?.message || 'Failed to create deal');
    } finally {
      setActionLoading(null);
    }
  };

  const safeDeals = Array.isArray(deals) ? deals : [];
  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeApprovals = Array.isArray(approvals) ? approvals : [];

  const totalDealValue = safeDeals.reduce((acc, d) => acc + (d.proposedPrice || 0), 0);
  const totalActiveProjectValue = safeProjects.reduce((acc, p) => acc + (p.agreedPrice || 0), 0);
  const pendingApprovalsCount = safeApprovals.filter((a) => a.status === 'PENDING').length;

  return (
    <div className="space-y-6" id="pipeline-operations-manager">
      {/* Top Banner & Metrics */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              ApexGrowth Business Operations
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold font-display tracking-tight text-white">
              Deal-to-Delivery Pipeline
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Seamlessly bridge positive outreach replies into closed commercial deals, structured sprint projects, and AI co-working delivery with strict human approval gates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCreateDealModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/30 border border-indigo-500/50"
            >
              <Plus className="w-4 h-4" />
              Create Deal
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
            <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-indigo-400" /> Commercial Deals
            </div>
            <div className="text-2xl font-bold text-white mt-1">{deals.length}</div>
            <div className="text-xs text-emerald-400 mt-0.5 font-medium">${totalDealValue.toLocaleString()} in pipeline</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
            <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-400" /> Active Projects
            </div>
            <div className="text-2xl font-bold text-white mt-1">{projects.length}</div>
            <div className="text-xs text-blue-400 mt-0.5 font-medium">${totalActiveProjectValue.toLocaleString()} in execution</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
            <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Approval Gates
            </div>
            <div className="text-2xl font-bold text-white mt-1">{pendingApprovalsCount}</div>
            <div className="text-xs text-amber-400 mt-0.5 font-medium">Require Operator Signoff</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
            <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-teal-400" /> Telegram Co-Work
            </div>
            <div className="text-2xl font-bold text-white mt-1">Ready</div>
            <div className="text-xs text-teal-400 mt-0.5 font-medium">Use /work &lt;client&gt; in bot</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveView('pipeline')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
            activeView === 'pipeline'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Zap className="w-4 h-4" />
          End-to-End Pipeline
        </button>
        <button
          onClick={() => setActiveView('deals')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
            activeView === 'deals'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Commercial Deals ({deals.length})
        </button>
        <button
          onClick={() => setActiveView('projects')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
            activeView === 'projects'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Active Sprints & Projects ({projects.length})
        </button>
        <button
          onClick={() => setActiveView('approvals')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
            activeView === 'approvals'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Approval Gates ({pendingApprovalsCount})
        </button>
      </div>

      {/* VIEW: Pipeline Visualizer */}
      {activeView === 'pipeline' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Step 1 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Stage 1</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Discovery
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Prospect Scouted</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                24/7 worker extracts DOM checkout friction, mobile speed, and public contacts.
              </p>
              <div className="pt-2">
                <a
                  href="#scout-intelligence"
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                >
                  View in Scout Intelligence <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-indigo-500" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-500 uppercase">Stage 2</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-xs font-semibold text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {deals.length} Deals
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Deal & Proposal</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Positive reply triggers deal scoping with executive audit proposal and package pricing.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setActiveView('deals')}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                >
                  Manage Deals <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-blue-500" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-500 uppercase">Stage 3</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-xs font-semibold text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {projects.length} Active
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Active Sprints</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Sprint phases, deliverable teardowns, and live AI co-working (/work Marcus in Telegram).
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setActiveView('projects')}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                >
                  View Active Sprints <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-amber-500" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-500 uppercase">Stage 4</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-xs font-semibold text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {pendingApprovalsCount} Pending
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Approval Gates</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Strict human approval before sending proposals, deliverables, or marking project milestones.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setActiveView('approvals')}
                  className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
                >
                  Review Approvals <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Active Deals & Projects Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Deals Preview */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-indigo-500" />
                  Recent Commercial Deals
                </h3>
                <button
                  onClick={() => setActiveView('deals')}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  View All
                </button>
              </div>
              {deals.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">
                  No deals created yet. Click "Create Deal" to scope an audited prospect.
                </div>
              ) : (
                <div className="space-y-3">
                  {deals.slice(0, 3).map((deal) => (
                    <div
                      key={deal.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white text-sm">
                          {deal.clientName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {deal.servicePackage} • ${deal.proposedPrice.toLocaleString()} {deal.currency}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                          {deal.stage}
                        </span>
                        {!deal.projectId && (
                          <button
                            onClick={() => handleConvertToProject(deal.id)}
                            disabled={actionLoading === `convert-${deal.id}`}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center gap-1"
                          >
                            Convert
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Sprints Preview */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-500" />
                  Active Client Sprints
                </h3>
                <button
                  onClick={() => setActiveView('projects')}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View All
                </button>
              </div>
              {projects.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">
                  No active projects currently in sprint execution.
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.slice(0, 3).map((project) => (
                    <div
                      key={project.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white text-sm">
                          {project.clientName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Phase: <span className="font-semibold text-blue-500">{project.currentPhase}</span> • {project.deliverables?.length || 0} Deliverables
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setCoWorkModalProject(project);
                            setCoWorkOutput(null);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition flex items-center gap-1 shadow-sm"
                        >
                          <Bot className="w-3 h-3" /> Co-Work
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: Commercial Deals */}
      {activeView === 'deals' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Commercial Deals Pipeline</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track proposals, negotiate scopes, and convert won opportunities into active execution sprints.
              </p>
            </div>
            <button
              onClick={() => setCreateDealModal(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> New Deal
            </button>
          </div>

          {deals.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              <Briefcase className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-700" />
              <div className="font-semibold text-slate-700 dark:text-slate-300">No deals in pipeline</div>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Create a deal from a positive lead reply or convert an audited prospect directly.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {deals.map((deal) => (
                <div
                  key={deal.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                        {deal.stage}
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        ${deal.proposedPrice?.toLocaleString()} {deal.currency}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-1.5">
                        <User className="w-4 h-4 text-indigo-500" />
                        {deal.clientName}
                      </h3>
                      {deal.clientCompany && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <Building className="w-3.5 h-3.5" />
                          {deal.clientCompany}
                        </div>
                      )}
                    </div>

                    <div className="text-xs bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 leading-relaxed">
                      <div className="font-semibold text-slate-900 dark:text-white mb-1">
                        {deal.servicePackage}
                      </div>
                      {deal.proposalSummary || deal.proposalDraft || 'No scope summary generated.'}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Status Actions:</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleUpdateDealStage(deal.id, 'WON')}
                          className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 font-semibold"
                        >
                          Won
                        </button>
                        <button
                          onClick={() => handleUpdateDealStage(deal.id, 'NEGOTIATING')}
                          className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 font-semibold"
                        >
                          Negotiating
                        </button>
                        <button
                          onClick={() => handleUpdateDealStage(deal.id, 'LOST')}
                          className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 font-semibold"
                        >
                          Lost
                        </button>
                      </div>
                    </div>

                    {deal.projectId ? (
                      <div className="w-full py-2 text-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-semibold border border-blue-200 dark:border-blue-900">
                        🚀 Active Sprint Project Running
                      </div>
                    ) : (
                      <button
                        onClick={() => handleConvertToProject(deal.id)}
                        disabled={actionLoading === `convert-${deal.id}`}
                        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        Convert to Active Sprint Project
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: Active Projects & Sprints */}
      {activeView === 'projects' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Active Delivery Projects</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Execute client sprints, track phase deliverables, and co-work with AI on teardowns and assets.
              </p>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              <Layers className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-700" />
              <div className="font-semibold text-slate-700 dark:text-slate-300">No active projects</div>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Convert an agreed commercial deal into an active project to begin sprint execution.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          {project.clientName}
                        </h3>
                        {project.clientCompany && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {project.clientCompany}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3">
                        <span>Scope: <b>{project.servicePackage}</b></span>
                        <span>•</span>
                        <span>Investment: <b>${project.agreedPrice?.toLocaleString()} {project.currency}</b></span>
                        <span>•</span>
                        <span>Telegram: <code>/work {project.clientName.split(' ')[0]}</code></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setCoWorkModalProject(project);
                          setCoWorkOutput(null);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-sm"
                      >
                        <Bot className="w-3.5 h-3.5" /> Co-Work with AI
                      </button>
                      <button
                        onClick={() => setAddDeliverableProject(project)}
                        className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Task
                      </button>
                    </div>
                  </div>

                  {/* Phase Progression Stepper */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-500 uppercase">Phase Progression:</div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {(['ONBOARDING', 'PHASE_1', 'PHASE_2', 'PHASE_3', 'RETAINER'] as ProjectPhase[]).map((ph) => (
                        <button
                          key={ph}
                          onClick={() => handleAdvanceProjectPhase(project.id, ph)}
                          className={`py-2 px-3 rounded-xl text-xs font-semibold text-center transition border ${
                            project.currentPhase === ph
                              ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {ph.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Deliverables List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                        Deliverables & Assets ({project.deliverables?.length || 0})
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(project.deliverables || []).map((deliv) => (
                        <div
                          key={deliv.id}
                          className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between space-y-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-blue-500 uppercase">{deliv.phase}</span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  deliv.status === 'DELIVERED'
                                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                                    : deliv.status === 'IN_PROGRESS'
                                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                {deliv.status}
                              </span>
                            </div>
                            <div className="font-semibold text-sm text-slate-900 dark:text-white">
                              {deliv.title}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                              {deliv.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/40">
                            <span className="text-[11px] text-slate-400">
                              {deliv.requiresApproval ? '🛡️ Requires Approval' : 'Direct task'}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {deliv.status !== 'IN_PROGRESS' && deliv.status !== 'DELIVERED' && (
                                <button
                                  onClick={() => handleUpdateDeliverableStatus(deliv.id, 'IN_PROGRESS')}
                                  className="px-2 py-1 rounded bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 text-xs font-semibold"
                                >
                                  Start
                                </button>
                              )}
                              {deliv.status !== 'DELIVERED' && (
                                <button
                                  onClick={() => handleUpdateDeliverableStatus(deliv.id, 'DELIVERED')}
                                  className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 text-xs font-semibold"
                                >
                                  Deliver
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: Approval Gates */}
      {activeView === 'approvals' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Human Approval Gates</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Strict governance boundary: client proposals, deliverable dispatches, and milestone completions require manual operator sign-off.
            </p>
          </div>

          {safeApprovals.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-500" />
              <div className="font-semibold text-slate-700 dark:text-slate-300">All gates cleared</div>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No client-facing actions or deliverables are currently awaiting operator approval.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {safeApprovals.map((appr) => (
                <div
                  key={appr.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                        {appr.actionType}
                      </span>
                      <span className="text-xs text-slate-400">
                        Requested {new Date(appr.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        appr.status === 'APPROVED'
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border border-emerald-200'
                          : appr.status === 'REJECTED'
                          ? 'bg-rose-50 dark:bg-rose-950 text-rose-600 border border-rose-200'
                          : 'bg-amber-50 dark:bg-amber-950 text-amber-600 border border-amber-200'
                      }`}
                    >
                      {appr.status}
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {appr.targetEntity} #{appr.targetId}
                  </div>

                  {appr.payloadSnapshot && (
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-xs text-slate-600 dark:text-slate-300 font-mono overflow-x-auto">
                      {JSON.stringify(appr.payloadSnapshot, null, 2)}
                    </div>
                  )}

                  {appr.status === 'PENDING' && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => handleApprovalDecision(appr.id, 'REJECTED')}
                        disabled={actionLoading === `appr-${appr.id}`}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-semibold transition"
                      >
                        Reject Action
                      </button>
                      <button
                        onClick={() => handleApprovalDecision(appr.id, 'APPROVED')}
                        disabled={actionLoading === `appr-${appr.id}`}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition flex items-center gap-1 shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve & Execute
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: AI Co-Working */}
      {coWorkModalProject && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-4 sm:p-5 shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Bot className="w-5 h-5 text-teal-500" />
                  Co-Work with AI: {coWorkModalProject.clientName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Execute project sprint deliverables, write CRO audits, or draft executive updates grounded in project evidence.
                </p>
              </div>
              <button
                onClick={() => setCoWorkModalProject(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 overscroll-contain">
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Co-Working Prompt / Deliverable Request
                </label>
                <textarea
                  value={coWorkInstruction}
                  onChange={(e) => setCoWorkInstruction(e.target.value)}
                  placeholder="e.g. 'Draft the Phase 1 CRO audit teardown highlighting mobile checkout latency and cart abandonment hooks'"
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs text-slate-400">
                    Tip: In Telegram, you can run: <code>/work {coWorkModalProject.clientName.split(' ')[0]}</code>
                  </span>
                  <button
                    onClick={handleCoWorkSubmit}
                    disabled={coWorkRunning || !coWorkInstruction.trim()}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-md self-end sm:self-auto"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${coWorkRunning ? 'animate-spin' : ''}`} />
                    {coWorkRunning ? 'Drafting with AI...' : 'Generate Deliverable'}
                  </button>
                </div>
              </div>

              {coWorkOutput && (
                <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Generated Deliverable Teardown:
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto font-sans">
                    {coWorkOutput}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create Deal */}
      {createDealModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-4 sm:p-5 shrink-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-500" />
                Create Commercial Deal
              </h3>
              <button
                onClick={() => setCreateDealModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Opportunity / Prospect ID
                </label>
                <input
                  type="text"
                  value={newDealProspectId}
                  onChange={(e) => setNewDealProspectId(e.target.value)}
                  placeholder="e.g. opp_123 or prospect ID"
                  className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Service Tier Package
                </label>
                <select
                  value={newDealService}
                  onChange={(e) => setNewDealService(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                >
                  <option value="$99 Starter Evidence Audit">$99 Starter Evidence Audit</option>
                  <option value="$2,500 Full-Funnel CRO Sprint">$2,500 Full-Funnel CRO Sprint</option>
                  <option value="$4,000 Monthly Growth Retainer">$4,000 Monthly Growth Retainer</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Proposed Investment ($ USD)
                </label>
                <input
                  type="number"
                  value={newDealPrice}
                  onChange={(e) => setNewDealPrice(Number(e.target.value))}
                  className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 shrink-0">
              <button
                onClick={() => setCreateDealModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewDeal}
                disabled={actionLoading === 'create-deal'}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Create Deal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add Deliverable */}
      {addDeliverableProject && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-4 sm:p-5 shrink-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-500" />
                Add Sprint Deliverable
              </h3>
              <button
                onClick={() => setAddDeliverableProject(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Deliverable Title
                </label>
                <input
                  type="text"
                  value={newDelivTitle}
                  onChange={(e) => setNewDelivTitle(e.target.value)}
                  placeholder="e.g. Mobile Checkout Teardown & Fix Roadmap"
                  className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Description & Key Scope
                </label>
                <textarea
                  value={newDelivDesc}
                  onChange={(e) => setNewDelivDesc(e.target.value)}
                  placeholder="Provide scope notes or acceptance criteria..."
                  rows={3}
                  className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Phase
                  </label>
                  <select
                    value={newDelivPhase}
                    onChange={(e) => setNewDelivPhase(e.target.value as ProjectPhase)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                  >
                    <option value="ONBOARDING">ONBOARDING</option>
                    <option value="PHASE_1">PHASE 1</option>
                    <option value="PHASE_2">PHASE 2</option>
                    <option value="PHASE_3">PHASE 3</option>
                    <option value="RETAINER">RETAINER</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="requireApprCheck"
                    checked={newDelivApproval}
                    onChange={(e) => setNewDelivApproval(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="requireApprCheck" className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    Requires Gate Signoff
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 shrink-0">
              <button
                onClick={() => setAddDeliverableProject(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDeliverable}
                disabled={actionLoading === 'add-deliv' || !newDelivTitle.trim()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
              >
                Save Deliverable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
