import type { RealmModel } from '@nimiplatform/sdk/realm/generated';
import { worldDeclarationIssues } from './lorebook-validation.js';

export type WorldRecord = RealmModel<'WorldCoreDto'>;
export type DraftRule = { id: string; name: string; statement: string; systemRef?: string };
export type DraftPlace = { id: string; name: string; summary: string };
export type DraftCharacter = { id: string; name: string; role: string; summary: string; desire: string; flaw: string; voice: string };
export type WorldContent = {
  name: string; summary: string; genre: string; era: string; setting: string;
  rules: DraftRule[]; places: DraftPlace[]; characters: DraftCharacter[];
};
export type ProposalPart = 'identity' | 'setting' | 'rules' | 'places' | 'characters';
export type WorldProposal = {
  notes: { title: string; detail: string; suggestion: string }[];
  traceId: string;
  sourceUpdatedAt: string;
  accepted: string[];
} & ({ task: 'develop'; content: WorldContent } | { task: 'cast'; characters: DraftCharacter[] } | { task: 'review' });
export type WorldDraft = WorldContent & {
  id: string; createdAt: string; updatedAt: string;
  brief: string; visibility: 'private' | 'unlisted' | 'public';
  source: { id: string; name: string; contentHash: string; contentRevision: number } | null;
  savedWorld: WorldRecord | null;
  proposal: WorldProposal | null;
};

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export function newDraftId(): string {
  let time = Date.now();
  let prefix = '';
  for (let i = 0; i < 10; i++) { prefix = ALPHABET[time % 32] + prefix; time = Math.floor(time / 32); }
  return prefix + Array.from(crypto.getRandomValues(new Uint8Array(16)), value => ALPHABET[value & 31]).join('');
}

export function blankWorldContent(): WorldContent {
  return { name: '', summary: '', genre: '', era: '', setting: '', rules: [], places: [], characters: [] };
}

export function newDraftRule(name = '', statement = ''): DraftRule {
  const id = newDraftId();
  return { id, systemRef: id, name, statement };
}

export function createWorldDraft(brief = '', source: WorldRecord | null = null): WorldDraft {
  const now = new Date().toISOString();
  const content = source ? worldContentFromRecord(source) : blankWorldContent();
  return { ...content, id: newDraftId(), createdAt: now, updatedAt: now, brief, source: source ? { id: source.id, name: source.core.identity.name, contentHash: source.contentHash, contentRevision: source.contentRevision } : null, savedWorld: null, proposal: null, visibility: source?.visibility === 'public' || source?.visibility === 'unlisted' ? source.visibility : 'private' };
}

export function worldContentFromRecord(world: WorldRecord): WorldContent {
  return {
    name: world.core.identity.name,
    summary: world.core.identity.summary,
    genre: world.core.identity.genre ?? '',
    era: world.core.identity.era ?? '',
    setting: world.lorebookDeclaration?.identityBaseSetting ?? '',
    rules: (world.lorebookDeclaration?.worldRules ?? []).map(rule => ({ id: newDraftId(), systemRef: rule.systemRef, name: world.core.systems.find(system => system.systemId === rule.systemRef)?.name ?? '', statement: rule.statement })),
    places: world.core.scenes.map(place => ({ id: place.sceneId, name: place.name, summary: place.summary })),
    characters: [],
  };
}

export function draftIssues(draft: WorldContent): string[] {
  const issues: string[] = [];
  if (!draft.name.trim()) issues.push('name');
  if (!draft.summary.trim()) issues.push('summary');
  if (!draft.setting.trim()) issues.push('setting');
  if (draft.rules.some(rule => (rule.systemRef && !rule.name.trim()) || (!rule.systemRef && rule.name.trim()) || !rule.statement.trim())) issues.push('rules');
  if (draft.places.some(place => !place.name.trim() || !place.summary.trim())) issues.push('places');
  const declaration = { identityBaseSetting: draft.setting, worldRules: draft.rules.map(rule => ({ statement: rule.statement })), rolePlacements: [] };
  for (const issue of worldDeclarationIssues(declaration)) {
    if (issue === 'identityBaseSetting' && !draft.setting.trim()) continue;
    if (issue === 'worldRules' && draft.rules.some(rule => !rule.statement.trim())) continue;
    issues.push(issue === 'identityBaseSetting' ? 'settingLimit' : issue === 'worldRules' ? 'rulesLimit' : 'declarationLimit');
  }
  return [...new Set(issues)];
}

// @nimi-authority: rule.realm-world-studio.scope.r013
export function worldCreateInput(draft: WorldDraft): RealmModel<'CreateWorldCoreDto'> {
  if (draft.source || draft.savedWorld) throw new Error('Only an unpublished new-world draft can create a Realm world.');
  if (draftIssues(draft).length) throw new Error('Complete the required world fields before creating a Realm world.');
  const now = new Date().toISOString();
  return {
    id: draft.id,
    visibility: draft.visibility,
    origin: { kind: 'manual' },
    core: {
      identity: { name: draft.name.trim(), summary: draft.summary.trim(), genre: draft.genre.trim() || undefined, era: draft.era.trim() || undefined },
      presentation: { displayName: draft.name.trim() },
      assets: { intents: [], resourceRefs: [] },
      authoring: { source: 'realm-world-studio' },
      entities: [], relationships: [],
      ontology: { entityKinds: [], relationshipTypes: [] },
      systems: draft.rules.filter(rule => rule.systemRef).map(rule => ({ systemId: rule.systemRef!, name: rule.name.trim(), summary: rule.statement.trim(), principles: [rule.statement.trim()] })),
      scenes: draft.places.map(place => ({ sceneId: place.id, name: place.name.trim(), summary: place.summary.trim() })),
      timeline: { events: [] },
      timeModel: { mode: 'static', isPaused: true, flowRatio: 1, calendar: null, displayFormat: null, pausedWorldTime: now, anchor: { realStartedAt: now, worldStartedAt: now, worldStartedAtDisplay: now } },
    },
    lorebookDeclaration: {
      identityBaseSetting: draft.setting,
      worldRules: draft.rules.map(rule => ({ statement: rule.statement, ...(rule.systemRef ? { systemRef: rule.systemRef } : {}) })),
      rolePlacements: [],
    },
  };
}

export class WorldRevisionConflict extends Error {
  constructor(readonly latest: WorldRecord) { super('WORLD_REVISION_CONFLICT'); }
}

// @nimi-authority: rule.realm-world-studio.scope.r014
export function worldReplaceInput(draft: WorldDraft, latest: WorldRecord): RealmModel<'ReplaceWorldCoreDto'> {
  if (!draft.source || draft.source.id !== latest.id || draft.savedWorld) throw new Error('World revision source mismatch');
  if (draft.source.contentHash !== latest.contentHash) throw new WorldRevisionConflict(latest);
  if (draftIssues(draft).length) throw new Error('Complete the required world fields before saving.');
  if (latest.lorebookDeclaration && worldDeclarationIssues(latest.lorebookDeclaration).some(issue => issue === 'worldRuleReferences' || issue === 'roleReferences')) throw new Error('WORLD_DECLARATION_REFERENCE_UNAVAILABLE');
  const original = structuredClone(latest.core);
  const lorebookDeclaration = {
    identityBaseSetting: draft.setting,
    worldRules: draft.rules.map(rule => ({ statement: rule.statement, ...(rule.systemRef ? { systemRef: rule.systemRef } : {}) })),
    rolePlacements: latest.lorebookDeclaration?.rolePlacements ?? [],
  };
  if (worldDeclarationIssues(lorebookDeclaration).length) throw new Error('WORLD_DECLARATION_INVALID');
  // A declaration row is not its referenced system. Editing or removing its
  // statement must preserve independently authored system content and references.
  const systems = original.systems.map(system => ({ ...system }));
  for (const rule of draft.rules) {
    if (!rule.systemRef) continue;
    const system = systems.find(item => item.systemId === rule.systemRef);
    if (system) system.name = rule.name.trim();
    else systems.push({ systemId: rule.systemRef, name: rule.name.trim(), summary: rule.statement.trim(), principles: [rule.statement.trim()] });
  }
  const core = {
    ...original,
    identity: { ...original.identity, name: draft.name.trim(), summary: draft.summary.trim(), genre: draft.genre.trim() || undefined, era: draft.era.trim() || undefined },
    presentation: { ...original.presentation, ...(draft.name !== latest.core.identity.name && original.presentation.displayName === latest.core.identity.name ? { displayName: draft.name.trim() } : {}) },
    systems,
    scenes: draft.places.map(place => ({ ...original.scenes.find(scene => scene.sceneId === place.id), sceneId: place.id, name: place.name.trim(), summary: place.summary.trim() })),
  };
  return {
    id: latest.id, baseContentHash: latest.contentHash, origin: latest.origin, visibility: draft.visibility, core,
    lorebookDeclaration,
  };
}

export function notebookMarkdown(draft: WorldDraft): string {
  return [
    `# ${draft.name || 'World draft'}`, 'Draft · Realm World Studio',
    draft.summary, `## Setting\n${draft.setting}`,
    `## Rules\n${draft.rules.map(rule => `### ${rule.name}\n${rule.statement}`).join('\n\n')}`,
    `## Places\n${draft.places.map(place => `### ${place.name}\n${place.summary}`).join('\n\n')}`,
    `## Character concepts (not Realm characters)\n${draft.characters.map(character => `### ${character.name} — ${character.role}\n${character.summary}\n\nDesire: ${character.desire}\nContradiction: ${character.flaw}\nVoice: ${character.voice}`).join('\n\n')}`,
  ].join('\n\n');
}
