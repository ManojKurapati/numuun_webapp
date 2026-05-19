import type { Paginated, QuestionnaireStatus } from '@namo/types';
import type {
  AdminCreateUserInput,
  CreateChildInput,
  CreateQuestionnaireInput,
  LoginInput,
  RegisterInput,
  StartAssessmentInput,
  SubmitResponsesInput,
  UpdateChildInput,
} from '@namo/validation';
import type {
  AssessmentDetail,
  AssessmentSummary,
  AuthResult,
  Child,
  PlatformOverview,
  PublicUser,
  QuestionnaireDetail,
  QuestionnaireSummary,
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
}
