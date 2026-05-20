import type { Paginated, QuestionnaireStatus } from '@namo/types';
import type {
  AdminCreateUserInput,
  CreateCampaignInput,
  CreateChildInput,
  CreateChildNoteInput,
  CreateInterventionInput,
  CreateQuestionnaireInput,
  CreateReferralInput,
  CreateUploadInput,
  LoginInput,
  RegisterInput,
  ReviewUploadInput,
  StartAssessmentInput,
  SubmitResponsesInput,
  UpdateCampaignInput,
  UpdateChildInput,
  UpdateInterventionInput,
  UpdateReferralInput,
} from '@namo/validation';
import type {
  AdminChildProfile,
  AdminChildRow,
  AssessmentDetail,
  AssessmentSummary,
  AuditEntryRow,
  AuthResult,
  CampaignRow,
  Child,
  ExecutiveSnapshot,
  InterventionRow,
  PlatformOverview,
  PublicUser,
  QuestionnaireDetail,
  QuestionnaireSummary,
  ReferralRow,
  RiskLevel,
  SystemHealth,
  UploadDetail,
  UploadRow,
} from './models';
import type { TokenStore } from './tokens';

/** Error thrown for any non-successful API response. Carries the API error code. */
export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface NamoClientConfig {
  baseUrl: string;
  tokens: TokenStore;
  /** Called when the session can no longer be recovered (refresh failed). */
  onUnauthorized?: () => void;
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

function isSuccess(value: unknown): value is { success: true; data: unknown } {
  return typeof value === 'object' && value !== null && (value as { success?: unknown }).success === true;
}

function isFailure(
  value: unknown,
): value is { success: false; error: { code: string; message: string; details?: unknown } } {
  return typeof value === 'object' && value !== null && (value as { success?: unknown }).success === false;
}

function query(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (entries.length === 0) return '';
  return `?${entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')}`;
}

/**
 * Typed Namo API client. Unwraps the `{ success, data }` envelope and
 * transparently refreshes an expired access token once per request.
 */
export class NamoClient {
  constructor(private readonly config: NamoClientConfig) {}

  // --- transport -----------------------------------------------------------

  private async send(method: Method, path: string, body: unknown, auth: boolean): Promise<Response> {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth) {
      const token = this.config.tokens.getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    return fetch(`${this.config.baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  private async parse<T>(res: Response): Promise<T> {
    const text = await res.text();
    let json: unknown = null;
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        throw new ApiError('BAD_RESPONSE', 'The server returned an unexpected response.', res.status);
      }
    }
    if (isSuccess(json)) return json.data as T;
    if (isFailure(json)) {
      throw new ApiError(json.error.code, json.error.message, res.status, json.error.details);
    }
    throw new ApiError('REQUEST_FAILED', 'Request failed.', res.status);
  }

  private async tryRefresh(): Promise<boolean> {
    const refreshToken = this.config.tokens.getRefreshToken();
    if (!refreshToken) return false;
    const res = await this.send('POST', '/auth/refresh', { refreshToken }, false);
    if (!res.ok) return false;
    try {
      const json: unknown = await res.json();
      if (isSuccess(json)) {
        const data = json.data as AuthResult;
        this.config.tokens.setTokens({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        });
        return true;
      }
    } catch {
      /* fall through */
    }
    return false;
  }

  private async request<T>(
    method: Method,
    path: string,
    body?: unknown,
    options: { auth?: boolean } = {},
  ): Promise<T> {
    const auth = options.auth ?? true;
    let res = await this.send(method, path, body, auth);

    if (res.status === 401 && auth && this.config.tokens.getRefreshToken()) {
      if (await this.tryRefresh()) {
        res = await this.send(method, path, body, true);
      } else {
        this.config.tokens.clear();
        this.config.onUnauthorized?.();
      }
    }
    return this.parse<T>(res);
  }

  // --- auth ----------------------------------------------------------------

  async register(input: RegisterInput): Promise<AuthResult> {
    const result = await this.request<AuthResult>('POST', '/auth/register', input, { auth: false });
    this.config.tokens.setTokens(result);
    return result;
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const result = await this.request<AuthResult>('POST', '/auth/login', input, { auth: false });
    this.config.tokens.setTokens(result);
    return result;
  }

  async logout(): Promise<void> {
    const refreshToken = this.config.tokens.getRefreshToken();
    if (refreshToken) {
      try {
        await this.request('POST', '/auth/logout', { refreshToken }, { auth: false });
      } catch {
        /* best effort */
      }
    }
    this.config.tokens.clear();
  }

  me(): Promise<PublicUser> {
    return this.request<PublicUser>('GET', '/auth/me');
  }

  // --- children ------------------------------------------------------------

  listChildren(): Promise<Child[]> {
    return this.request<Child[]>('GET', '/children');
  }

  getChild(id: string): Promise<Child> {
    return this.request<Child>('GET', `/children/${id}`);
  }

  createChild(input: CreateChildInput): Promise<Child> {
    return this.request<Child>('POST', '/children', input);
  }

  updateChild(id: string, input: UpdateChildInput): Promise<Child> {
    return this.request<Child>('PATCH', `/children/${id}`, input);
  }

  deleteChild(id: string): Promise<{ deleted: true }> {
    return this.request('DELETE', `/children/${id}`);
  }

  // --- questionnaires ------------------------------------------------------

  questionnairesForChild(childId: string): Promise<QuestionnaireSummary[]> {
    return this.request<QuestionnaireSummary[]>('GET', `/questionnaires/for-child/${childId}`);
  }

  getQuestionnaire(id: string): Promise<QuestionnaireDetail> {
    return this.request<QuestionnaireDetail>('GET', `/questionnaires/${id}`);
  }

  listQuestionnaires(
    params: { status?: QuestionnaireStatus; page?: number; pageSize?: number } = {},
  ): Promise<Paginated<QuestionnaireSummary>> {
    return this.request('GET', `/questionnaires${query(params)}`);
  }

  createQuestionnaire(input: CreateQuestionnaireInput): Promise<QuestionnaireDetail> {
    return this.request<QuestionnaireDetail>('POST', '/questionnaires', input);
  }

  publishQuestionnaire(id: string): Promise<QuestionnaireDetail> {
    return this.request<QuestionnaireDetail>('POST', `/questionnaires/${id}/publish`);
  }

  archiveQuestionnaire(id: string): Promise<QuestionnaireDetail> {
    return this.request<QuestionnaireDetail>('POST', `/questionnaires/${id}/archive`);
  }

  // --- assessments ---------------------------------------------------------

  startAssessment(input: StartAssessmentInput): Promise<AssessmentDetail> {
    return this.request<AssessmentDetail>('POST', '/assessments', input);
  }

  listAssessments(childId?: string): Promise<AssessmentDetail[]> {
    return this.request<AssessmentDetail[]>('GET', `/assessments${query({ childId })}`);
  }

  getAssessment(id: string): Promise<AssessmentDetail> {
    return this.request<AssessmentDetail>('GET', `/assessments/${id}`);
  }

  submitResponses(id: string, input: SubmitResponsesInput): Promise<AssessmentDetail> {
    return this.request<AssessmentDetail>('POST', `/assessments/${id}/responses`, input);
  }

  completeAssessment(id: string): Promise<AssessmentDetail> {
    return this.request<AssessmentDetail>('POST', `/assessments/${id}/complete`);
  }

  // --- admin ---------------------------------------------------------------

  listUsers(params: { page?: number; pageSize?: number } = {}): Promise<Paginated<PublicUser>> {
    return this.request('GET', `/users${query(params)}`);
  }

  createUser(input: AdminCreateUserInput): Promise<PublicUser> {
    return this.request<PublicUser>('POST', '/users', input);
  }

  setUserActive(id: string, isActive: boolean): Promise<PublicUser> {
    return this.request<PublicUser>('PATCH', `/users/${id}/active`, { isActive });
  }

  adminStats(): Promise<PlatformOverview> {
    return this.request<PlatformOverview>('GET', '/admin/stats');
  }

  adminChildren(params: { page?: number; pageSize?: number } = {}): Promise<Paginated<Child>> {
    return this.request('GET', `/admin/children${query(params)}`);
  }

  adminAssessments(
    params: { page?: number; pageSize?: number } = {},
  ): Promise<Paginated<AssessmentSummary>> {
    return this.request('GET', `/admin/assessments${query(params)}`);
  }

  // ---- Executive / system ------------------------------------------------

  adminExecutive(): Promise<ExecutiveSnapshot> {
    return this.request<ExecutiveSnapshot>('GET', '/admin/executive');
  }

  adminSystemHealth(): Promise<SystemHealth> {
    return this.request<SystemHealth>('GET', '/admin/system-health');
  }

  // ---- Children: search, profile, notes ----------------------------------

  adminSearchChildren(
    params: {
      q?: string;
      riskLevel?: RiskLevel;
      ageMinMonths?: number;
      ageMaxMonths?: number;
      page?: number;
      pageSize?: number;
    } = {},
  ): Promise<Paginated<AdminChildRow>> {
    return this.request('GET', `/admin/children/search${query(params)}`);
  }

  adminHighRisk(
    params: { minRiskLevel?: RiskLevel } = {},
  ): Promise<{ items: AdminChildRow[] }> {
    return this.request('GET', `/admin/children/high-risk${query(params)}`);
  }

  adminChildProfile(id: string): Promise<AdminChildProfile> {
    return this.request<AdminChildProfile>('GET', `/admin/children/${id}`);
  }

  adminAddChildNote(id: string, input: CreateChildNoteInput): Promise<{ added: true }> {
    return this.request('POST', `/admin/children/${id}/notes`, input);
  }

  // ---- Referrals ----------------------------------------------------------

  adminReferrals(
    params: {
      status?: string;
      priority?: string;
      page?: number;
      pageSize?: number;
    } = {},
  ): Promise<Paginated<ReferralRow>> {
    return this.request('GET', `/admin/referrals${query(params)}`);
  }

  adminCreateReferral(input: CreateReferralInput): Promise<ReferralRow> {
    return this.request<ReferralRow>('POST', '/admin/referrals', input);
  }

  adminUpdateReferral(id: string, input: UpdateReferralInput): Promise<ReferralRow> {
    return this.request<ReferralRow>('PATCH', `/admin/referrals/${id}`, input);
  }

  // ---- Interventions ------------------------------------------------------

  adminInterventions(
    params: {
      domain?: string;
      published?: 'true' | 'false';
      page?: number;
      pageSize?: number;
    } = {},
  ): Promise<Paginated<InterventionRow>> {
    return this.request('GET', `/admin/interventions${query(params)}`);
  }

  adminGetIntervention(id: string): Promise<InterventionRow> {
    return this.request<InterventionRow>('GET', `/admin/interventions/${id}`);
  }

  adminCreateIntervention(input: CreateInterventionInput): Promise<InterventionRow> {
    return this.request<InterventionRow>('POST', '/admin/interventions', input);
  }

  adminUpdateIntervention(id: string, input: UpdateInterventionInput): Promise<InterventionRow> {
    return this.request<InterventionRow>('PATCH', `/admin/interventions/${id}`, input);
  }

  // ---- AI extraction review ----------------------------------------------

  adminUploads(
    params: { status?: string; page?: number; pageSize?: number } = {},
  ): Promise<Paginated<UploadRow>> {
    return this.request('GET', `/admin/uploads${query(params)}`);
  }

  adminGetUpload(id: string): Promise<UploadDetail> {
    return this.request<UploadDetail>('GET', `/admin/uploads/${id}`);
  }

  adminCreateUpload(input: CreateUploadInput): Promise<UploadRow> {
    return this.request<UploadRow>('POST', '/admin/uploads', input);
  }

  adminRunExtraction(id: string): Promise<UploadDetail> {
    return this.request<UploadDetail>('POST', `/admin/uploads/${id}/extract`);
  }

  adminReviewUpload(id: string, input: ReviewUploadInput): Promise<UploadDetail> {
    return this.request<UploadDetail>('PATCH', `/admin/uploads/${id}/review`, input);
  }

  // ---- Campaigns ----------------------------------------------------------

  adminCampaigns(
    params: { status?: string; page?: number; pageSize?: number } = {},
  ): Promise<Paginated<CampaignRow>> {
    return this.request('GET', `/admin/campaigns${query(params)}`);
  }

  adminCreateCampaign(input: CreateCampaignInput): Promise<CampaignRow> {
    return this.request<CampaignRow>('POST', '/admin/campaigns', input);
  }

  adminUpdateCampaign(id: string, input: UpdateCampaignInput): Promise<CampaignRow> {
    return this.request<CampaignRow>('PATCH', `/admin/campaigns/${id}`, input);
  }

  adminSendCampaign(id: string): Promise<CampaignRow> {
    return this.request<CampaignRow>('POST', `/admin/campaigns/${id}/send`);
  }

  // ---- Audit log ----------------------------------------------------------

  adminAudit(
    params: {
      actorId?: string;
      entityType?: string;
      action?: string;
      page?: number;
      pageSize?: number;
    } = {},
  ): Promise<Paginated<AuditEntryRow>> {
    return this.request('GET', `/admin/audit${query(params)}`);
  }
}
