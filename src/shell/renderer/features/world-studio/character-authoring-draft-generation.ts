import type { NimiAIConfigTargetRef } from '@nimiplatform/sdk/ai';
import {
  createNimiRuntimeRouteOptionsHostDeps,
  listNimiRuntimeRouteOptionsWithHost,
  type NimiRuntimeRouteBinding,
  type NimiRuntimeRouteOptionsSnapshot,
  type Runtime,
} from '@nimiplatform/sdk/runtime';
import {
  ExecutionMode,
  FallbackPolicy,
  FinishReason,
  RoutePolicy,
  ScenarioType,
  type ExecuteScenarioRequest,
  type ExecuteScenarioResponse,
} from '@nimiplatform/sdk/runtime/generated';
import { STUDIO_RUNTIME_APP_ID } from '@renderer/app-shell/studio-platform.js';
import { createStudioRuntimeClient } from '@renderer/data/runtime-client.js';
import { readStudioAIConfigSelectedParams, readStudioAIConfigTargetRef } from '@renderer/features/ai-config/studio-ai-config-store.js';
import { ensureStudioRuntimeClientReady } from '@renderer/infra/studio-bootstrap.js';
import {
  createCreatorWorldCharacterAuthoringDraftBatch,
  type CreateCreatorWorldCharacterAuthoringDraftBatchInput,
  type CreatorWorldCharacterAuthoringDraftBatch,
  type CreatorWorldCharacterAuthoringGenerationContext,
} from './world-studio-client.js';

export const WORLD_STUDIO_AUTHORING_PROMPT_TEMPLATE_ID = 'realm-world-studio.cbdb-authoring-draft.v1';
export const WORLD_STUDIO_AUTHORING_SCENARIO_ID = 'realm-world-studio.character-authoring.generate-draft-batch.v1';
export const WORLD_STUDIO_AUTHORING_SURFACE_ID = 'realm-world-studio.character-authoring.draft-batch';
const TOOL_CHOICE_NONE = 2;
const RESPONSE_FORMAT_JSON_OBJECT = 2;

type DraftCandidateInput = CreateCreatorWorldCharacterAuthoringDraftBatchInput['candidates'][number];
type CandidateTargetKey = DraftCandidateInput['targetKey'];
type CandidateValueInput = DraftCandidateInput['value'];
type CandidateValueProvenanceInput = CandidateValueInput['provenance'][number];
type CandidateSourceRefInput = DraftCandidateInput['sourceRefs'][number];
type CandidateValueKind = CandidateValueInput['kind'];

type ResolvedRuntimeRouteBinding = {
  readonly model: string;
  readonly route: 'local' | 'cloud';
  readonly connectorId?: string;
  readonly selectedParams: Readonly<Record<string, unknown>>;
  readonly snapshot: NimiRuntimeRouteOptionsSnapshot;
  readonly targetRef: NimiAIConfigTargetRef;
};

type RuntimeAuthoringDraftGenerationResult = {
  readonly batch: CreatorWorldCharacterAuthoringDraftBatch;
  readonly runtimeTraceId: string;
  readonly promptDigestSha256: string;
};

const TARGET_KEYS = [
  'description',
  'contentStyle',
  'publicPositioning',
  'avatar',
  'profileCover',
  'voice',
  'greeting',
  'dialogueExemplars',
  'behaviorDna',
] as const satisfies readonly CandidateTargetKey[];

const VALUE_KINDS = ['text', 'media', 'voice', 'dialogue', 'behavior'] as const satisfies readonly CandidateValueKind[];
const VALUE_PROVENANCE_CATEGORIES = [
  'source_fact',
  'historical_inference',
  'creator_preference',
  'ai_authored_texture',
] as const satisfies readonly CandidateValueProvenanceInput['category'][];

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readNumberParam(
  params: Readonly<Record<string, unknown>>,
  key: string,
): number | undefined {
  const raw = params[key];
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw !== 'string' || !raw.trim()) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function jsonRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Runtime authoring draft response must be a JSON object.');
  }
  return value as Record<string, unknown>;
}

function requireString(value: unknown, field: string): string {
  const normalized = normalizeText(value);
  if (!normalized) {
    throw new Error(`Runtime authoring draft candidate is missing ${field}.`);
  }
  return normalized;
}

function requireFiniteNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Runtime authoring draft candidate is missing ${field}.`);
  }
  return value;
}

function requireNonEmptyStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Runtime authoring draft candidate ${field} is required.`);
  }
  return value.map((item) => requireString(item, `${field}[]`));
}

function isTargetKey(value: string): value is CandidateTargetKey {
  return (TARGET_KEYS as readonly string[]).includes(value);
}

function isValueKind(value: string): value is CandidateValueKind {
  return (VALUE_KINDS as readonly string[]).includes(value);
}

function isValueProvenanceCategory(value: string): value is CandidateValueProvenanceInput['category'] {
  return (VALUE_PROVENANCE_CATEGORIES as readonly string[]).includes(value);
}

function bindingModel(binding: NimiRuntimeRouteBinding): string {
  return normalizeText(binding.modelId || binding.model);
}

function routeCandidates(snapshot: NimiRuntimeRouteOptionsSnapshot): NimiRuntimeRouteBinding[] {
  return [
    ...snapshot.local.models.map((model): NimiRuntimeRouteBinding => ({
      source: 'local',
      connectorId: '',
      model: normalizeText(model.modelId || model.model),
      modelId: normalizeText(model.modelId || model.model) || undefined,
      provider: normalizeText(model.provider || model.engine) || undefined,
      localModelId: normalizeText(model.localModelId) || undefined,
      engine: normalizeText(model.engine) || undefined,
      endpoint: normalizeText(model.endpoint || snapshot.local.defaultEndpoint) || undefined,
      goRuntimeLocalModelId: normalizeText(model.goRuntimeLocalModelId) || undefined,
      goRuntimeStatus: normalizeText(model.goRuntimeStatus || model.status) || undefined,
    })),
    ...snapshot.connectors.flatMap((connector) =>
      connector.models.map((model): NimiRuntimeRouteBinding => ({
        source: 'cloud',
        connectorId: connector.id,
        model,
        modelId: model,
        provider: normalizeText(connector.provider) || undefined,
      }))),
  ].filter((binding) => bindingModel(binding));
}

function bindingToResolved(
  binding: NimiRuntimeRouteBinding,
  snapshot: NimiRuntimeRouteOptionsSnapshot,
  targetRef: NimiAIConfigTargetRef,
  selectedParams: Readonly<Record<string, unknown>>,
): ResolvedRuntimeRouteBinding | null {
  const model = bindingModel(binding);
  if (!model) return null;
  if (binding.source === 'cloud') {
    const connectorId = normalizeText(binding.connectorId);
    if (!connectorId) return null;
    return { model, route: 'cloud', connectorId, selectedParams, snapshot, targetRef };
  }
  return { model, route: 'local', selectedParams, snapshot, targetRef };
}

function localTargetRefCandidates(targetRef: Extract<NimiAIConfigTargetRef, { readonly kind: 'local-runtime' }>): string[] {
  const readinessParts = normalizeText(targetRef.readinessRef).split(':').map(normalizeText);
  return [
    normalizeText(targetRef.profileId),
    readinessParts[0] === 'runtime-route' && readinessParts[1] === 'local' ? normalizeText(readinessParts[3]) : '',
  ].filter(Boolean);
}

function findTargetRefRouteCandidate(
  candidates: readonly NimiRuntimeRouteBinding[],
  targetRef: NimiAIConfigTargetRef,
): NimiRuntimeRouteBinding | null {
  if (targetRef.kind === 'profile-slice') return null;
  if (targetRef.kind === 'cloud-connector') {
    const connectorId = normalizeText(targetRef.connectorId).toLowerCase();
    const providerModelId = normalizeText(targetRef.providerModelId).toLowerCase();
    const matches = candidates.filter((candidate) => {
      if (candidate.source !== 'cloud') return false;
      const candidateConnectorId = normalizeText(candidate.connectorId).toLowerCase();
      const modelTokens = [candidate.model, candidate.modelId].map((value) => normalizeText(value).toLowerCase()).filter(Boolean);
      return candidateConnectorId === connectorId && modelTokens.includes(providerModelId);
    });
    return matches.length === 1 ? matches[0]! : null;
  }
  const targetTokens = new Set(localTargetRefCandidates(targetRef).map((value) => value.toLowerCase()));
  if (targetTokens.size === 0) return null;
  const matches = candidates.filter((candidate) => {
    if (candidate.source !== 'local') return false;
    const candidateTokens = [
      candidate.model,
      candidate.modelId,
      candidate.localModelId,
      candidate.goRuntimeLocalModelId,
    ].map((value) => normalizeText(value).toLowerCase()).filter(Boolean);
    return candidateTokens.some((token) => targetTokens.has(token));
  });
  return matches.length === 1 ? matches[0]! : null;
}

async function resolveAuthoringTextRoute(runtime: Runtime): Promise<ResolvedRuntimeRouteBinding> {
  const targetRef = readStudioAIConfigTargetRef('text.generate');
  const selectedParams = readStudioAIConfigSelectedParams('text.generate');
  if (!targetRef) {
    throw new Error('NimiAIConfig targetRef missing for text.generate. Configure AI models before generating authoring drafts.');
  }
  if (targetRef.kind === 'profile-slice') {
    throw new Error('NimiAIConfig targetRef for text.generate is a profile-slice and cannot execute Runtime authoring drafts.');
  }
  const snapshot = await listNimiRuntimeRouteOptionsWithHost(
    { capability: 'text.generate' },
    createNimiRuntimeRouteOptionsHostDeps(runtime),
  );
  const candidate = findTargetRefRouteCandidate(routeCandidates(snapshot), targetRef);
  const resolved = candidate ? bindingToResolved(candidate, snapshot, targetRef, selectedParams) : null;
  if (!resolved) {
    throw new Error('Runtime text.generate route binding is missing or ambiguous for configured NimiAIConfig target.');
  }
  return resolved;
}

async function sha256Hex(input: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Web Crypto SHA-256 is unavailable; Runtime authoring prompt digest failed closed.');
  }
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function textMessage(role: string, content: string) {
  return {
    role,
    content,
    name: '',
    parts: [],
    toolCalls: [],
    toolCallId: '',
    toolResults: [],
    toolApprovalResponses: [],
  };
}

function routePolicyToRuntime(route: ResolvedRuntimeRouteBinding['route']): RoutePolicy {
  return route === 'local' ? RoutePolicy.LOCAL : RoutePolicy.CLOUD;
}

function routePolicyLabel(routePolicy: RoutePolicy, fallback: ResolvedRuntimeRouteBinding['route']): 'local' | 'cloud' {
  if (routePolicy === RoutePolicy.LOCAL) return 'local';
  if (routePolicy === RoutePolicy.CLOUD) return 'cloud';
  return fallback;
}

function buildAuthoringPrompt(context: CreatorWorldCharacterAuthoringGenerationContext): string {
  return JSON.stringify({
    contract:
      'Return a JSON object with candidates[]. Each candidate must contain targetKey, value, sourceRefs. Do not include final settings. Do not invent media resources. Media candidates are valid only with existing resourceId/url/prompt/model/mime/width/height/moderation/provenance. Voice candidates must use historicalClaim narration_direction_not_authentic_voice and must not claim authentic historical voice.',
    sourceSkeleton: context.sourceSkeleton,
    requiredTargets: context.requiredTargets,
    groundingRefs: context.groundingRefs,
    currentTargetStatuses: context.targetStatuses,
    currentFinalState: context.currentFinalState,
  });
}

function buildExecuteScenarioRequest(input: {
  readonly binding: ResolvedRuntimeRouteBinding;
  readonly prompt: string;
  readonly timeoutMs: number;
}): ExecuteScenarioRequest {
  return {
    head: {
      appId: STUDIO_RUNTIME_APP_ID,
      subjectUserId: '',
      modelId: input.binding.model,
      routePolicy: routePolicyToRuntime(input.binding.route),
      fallback: FallbackPolicy.DENY,
      timeoutMs: input.timeoutMs,
      connectorId: input.binding.connectorId || '',
    },
    scenarioType: ScenarioType.TEXT_GENERATE,
    executionMode: ExecutionMode.SYNC,
    spec: {
      spec: {
        oneofKind: 'textGenerate',
        textGenerate: {
          input: [textMessage('user', input.prompt)],
          systemPrompt:
            'You create auditable Realm character authoring draft candidates. Output only strict JSON matching the requested candidate contract. Unsupported targets must be omitted, not filled.',
          tools: [],
          temperature: readNumberParam(input.binding.selectedParams, 'temperature') ?? 0.2,
          topP: readNumberParam(input.binding.selectedParams, 'topP') ?? 0,
          maxTokens: readNumberParam(input.binding.selectedParams, 'maxTokens') ?? 2400,
          toolChoice: TOOL_CHOICE_NONE,
          toolChoiceName: '',
          responseFormat: {
            kind: RESPONSE_FORMAT_JSON_OBJECT,
            schemaName: 'CharacterAuthoringDraftCandidates',
            schemaDescription: 'JSON object containing non-empty candidates array for Realm authoring draft persistence.',
            strict: true,
          },
          topK: readNumberParam(input.binding.selectedParams, 'topK') ?? 0,
          presencePenalty: readNumberParam(input.binding.selectedParams, 'presencePenalty') ?? 0,
          frequencyPenalty: readNumberParam(input.binding.selectedParams, 'frequencyPenalty') ?? 0,
          stop: [],
          seed: '0',
          includeRawChunks: false,
        },
      },
    },
    extensions: [],
  };
}

function parseRuntimeJsonResponse(response: ExecuteScenarioResponse): Record<string, unknown> {
  if (response.finishReason !== FinishReason.STOP) {
    throw new Error(`Runtime authoring draft generation did not finish cleanly: ${FinishReason[response.finishReason] || response.finishReason}.`);
  }
  const output = response.output?.output;
  if (output?.oneofKind !== 'textGenerate') {
    throw new Error('Runtime authoring draft response did not contain textGenerate output.');
  }
  const text = normalizeText(output.textGenerate.text);
  if (!text) {
    throw new Error('Runtime authoring draft response was empty.');
  }
  return jsonRecord(JSON.parse(text));
}

function validateSourceRef(value: unknown): CandidateSourceRefInput {
  const record = jsonRecord(value);
  const sourceRef = requireString(record.sourceRef, 'sourceRefs[].sourceRef');
  return {
    sourceRef,
    ...(normalizeText(record.sourceKind) ? { sourceKind: normalizeText(record.sourceKind) } : {}),
    ...(normalizeText(record.label) ? { label: normalizeText(record.label) } : {}),
    ...(normalizeText(record.factPath) ? { factPath: normalizeText(record.factPath) } : {}),
  };
}

function validateValueProvenance(value: unknown): CandidateValueProvenanceInput[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('Runtime authoring draft candidate value provenance is required.');
  }
  return value.map((entry) => {
    const record = jsonRecord(entry);
    const category = requireString(record.category, 'value.provenance[].category');
    if (!isValueProvenanceCategory(category)) {
      throw new Error(`Runtime authoring draft candidate has unsupported provenance category ${category}.`);
    }
    return {
      category,
      refs: requireNonEmptyStringArray(record.refs, 'value.provenance[].refs'),
      summary: requireString(record.summary, 'value.provenance[].summary'),
    };
  });
}

function validateCandidateValue(value: unknown): CandidateValueInput {
  const record = jsonRecord(value);
  const kind = requireString(record.kind, 'value.kind');
  if (!isValueKind(kind)) {
    throw new Error(`Runtime authoring draft candidate has unsupported value kind ${kind}.`);
  }
  const provenance = validateValueProvenance(record.provenance);
  if (kind === 'text') {
    return {
      kind,
      text: requireString(record.text, 'value.text'),
      provenance,
    };
  }
  if (kind === 'media') {
    const media = jsonRecord(record.media);
    const moderation = jsonRecord(media.moderation);
    const moderationStatus = requireString(moderation.status, 'value.media.moderation.status');
    if (!['passed', 'blocked', 'not_checked'].includes(moderationStatus)) {
      throw new Error(`Runtime authoring draft media candidate has invalid moderation status ${moderationStatus}.`);
    }
    return {
      kind,
      media: {
        resourceId: requireString(media.resourceId, 'value.media.resourceId'),
        url: requireString(media.url, 'value.media.url'),
        prompt: requireString(media.prompt, 'value.media.prompt'),
        model: requireString(media.model, 'value.media.model'),
        mime: requireString(media.mime, 'value.media.mime'),
        width: requireFiniteNumber(media.width, 'value.media.width'),
        height: requireFiniteNumber(media.height, 'value.media.height'),
        moderation: {
          status: moderationStatus as 'passed' | 'blocked' | 'not_checked',
          ...(normalizeText(moderation.provider) ? { provider: normalizeText(moderation.provider) } : {}),
          ...(normalizeText(moderation.reason) ? { reason: normalizeText(moderation.reason) } : {}),
        },
        provenance: validateValueProvenance(media.provenance),
      },
      provenance,
    };
  }
  if (kind === 'voice') {
    const voice = jsonRecord(record.voice);
    if (voice.historicalClaim !== 'narration_direction_not_authentic_voice') {
      throw new Error('Runtime authoring draft voice candidate must not claim authentic historical voice.');
    }
    const speechRoutePolicy = normalizeText(voice.speechRoutePolicy);
    if (speechRoutePolicy && speechRoutePolicy !== 'local' && speechRoutePolicy !== 'cloud') {
      throw new Error(`Runtime authoring draft voice candidate has invalid speech route policy ${speechRoutePolicy}.`);
    }
    return {
      kind,
      voice: {
        historicalClaim: 'narration_direction_not_authentic_voice',
        narrationDirection: requireString(voice.narrationDirection, 'value.voice.narrationDirection'),
        ...(normalizeText(voice.providerVoiceRef) ? { providerVoiceRef: normalizeText(voice.providerVoiceRef) } : {}),
        ...(normalizeText(voice.voiceAssetResourceId) ? { voiceAssetResourceId: normalizeText(voice.voiceAssetResourceId) } : {}),
        ...(normalizeText(voice.speechModelId) ? { speechModelId: normalizeText(voice.speechModelId) } : {}),
        ...(speechRoutePolicy ? { speechRoutePolicy: speechRoutePolicy as 'local' | 'cloud' } : {}),
      },
      provenance,
    };
  }
  if (kind === 'dialogue') {
    const dialogue = jsonRecord(record.dialogue);
    return {
      kind,
      dialogue: {
        exemplars: requireNonEmptyStringArray(dialogue.exemplars, 'value.dialogue.exemplars'),
      },
      provenance,
    };
  }
  const behavior = jsonRecord(record.behavior);
  return {
    kind,
    behavior: {
      directives: requireNonEmptyStringArray(behavior.directives, 'value.behavior.directives'),
    },
    provenance,
  };
}

function validateRuntimeCandidate(value: unknown): Pick<DraftCandidateInput, 'targetKey' | 'value' | 'sourceRefs'> {
  const record = jsonRecord(value);
  const targetKey = requireString(record.targetKey, 'targetKey');
  if (!isTargetKey(targetKey)) {
    throw new Error(`Runtime authoring draft candidate has unsupported targetKey ${targetKey}.`);
  }
  if (!Array.isArray(record.sourceRefs) || record.sourceRefs.length === 0) {
    throw new Error('Runtime authoring draft candidate sourceRefs are required.');
  }
  return {
    targetKey,
    value: validateCandidateValue(record.value),
    sourceRefs: record.sourceRefs.map(validateSourceRef),
  };
}

function buildCreateBatchBody(input: {
  readonly context: CreatorWorldCharacterAuthoringGenerationContext;
  readonly response: ExecuteScenarioResponse;
  readonly parsed: Record<string, unknown>;
  readonly binding: ResolvedRuntimeRouteBinding;
  readonly promptDigestSha256: string;
  readonly sourceDigestSha256: string;
  readonly generatedAt: string;
}): CreateCreatorWorldCharacterAuthoringDraftBatchInput {
  if (!input.response.traceId) {
    throw new Error('Runtime authoring draft response is missing traceId.');
  }
  const rawCandidates = input.parsed.candidates;
  if (!Array.isArray(rawCandidates) || rawCandidates.length === 0) {
    throw new Error('Runtime authoring draft response must contain non-empty candidates.');
  }
  const trace = {
    runtimeAppId: STUDIO_RUNTIME_APP_ID,
    surfaceId: WORLD_STUDIO_AUTHORING_SURFACE_ID,
    skeletonId: input.context.sourceSkeleton.skeletonId,
    scenarioId: WORLD_STUDIO_AUTHORING_SCENARIO_ID,
    promptTemplateId: WORLD_STUDIO_AUTHORING_PROMPT_TEMPLATE_ID,
    sourceDigestSha256: input.sourceDigestSha256,
  };
  return {
    skeletonId: input.context.sourceSkeleton.skeletonId,
    metadata: {
      runtimeAppId: STUDIO_RUNTIME_APP_ID,
      surfaceId: WORLD_STUDIO_AUTHORING_SURFACE_ID,
    },
    candidates: rawCandidates.map((candidate) => {
      const validated = validateRuntimeCandidate(candidate);
      return {
        ...validated,
        generatedAt: input.generatedAt,
        modelId: normalizeText(input.response.modelResolved) || input.binding.model,
        routePolicy: routePolicyLabel(input.response.routeDecision, input.binding.route),
        promptDigestSha256: input.promptDigestSha256,
        runtimeTraceId: input.response.traceId,
        provenance: trace,
      };
    }),
  };
}

export async function generateCreatorWorldCharacterAuthoringDraftBatch(
  worldId: string,
  characterId: string,
  context: CreatorWorldCharacterAuthoringGenerationContext,
): Promise<RuntimeAuthoringDraftGenerationResult> {
  await ensureStudioRuntimeClientReady();
  const runtime = await createStudioRuntimeClient();
  if (!runtime) {
    throw new Error('Runtime unavailable; authoring draft generation failed closed.');
  }
  const binding = await resolveAuthoringTextRoute(runtime);
  const prompt = buildAuthoringPrompt(context);
  const [promptDigestSha256, sourceDigestSha256] = await Promise.all([
    sha256Hex(prompt),
    sha256Hex(JSON.stringify(context.sourceSkeleton)),
  ]);
  const request = buildExecuteScenarioRequest({
    binding,
    prompt,
    timeoutMs: readNumberParam(binding.selectedParams, 'timeoutMs') ?? 120_000,
  });
  const response = await runtime.ai.executeScenario(request, {
    timeoutMs: request.head?.timeoutMs || 120_000,
    metadata: {
      callerKind: 'third-party-app',
      callerId: STUDIO_RUNTIME_APP_ID,
      surfaceId: WORLD_STUDIO_AUTHORING_SURFACE_ID,
    },
  });
  const body = buildCreateBatchBody({
    context,
    response,
    parsed: parseRuntimeJsonResponse(response),
    binding,
    promptDigestSha256,
    sourceDigestSha256,
    generatedAt: new Date().toISOString(),
  });
  const batch = await createCreatorWorldCharacterAuthoringDraftBatch(worldId, characterId, body);
  return {
    batch,
    runtimeTraceId: response.traceId,
    promptDigestSha256,
  };
}
