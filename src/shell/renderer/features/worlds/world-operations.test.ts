import { beforeEach, expect, it, vi } from 'vitest';
import { createWorldDraft, draftIssues, newDraftRule, worldReplaceInput, WorldRevisionConflict } from './world-draft.js';
import { characterDeclarationIssues, worldDeclarationIssues } from './lorebook-validation.js';
import { characterWriteBody, characterForm, characterIssues, newCharacterDraft, saveWorldCharacter } from './world-character-model.js';
import { getStudioLocalAppClient } from '../../app-shell/studio-platform.js';
import { TEST_WORLD_CORE, TEST_WORLD_CHARACTER_CORE } from './world-core-test-fixtures.js';

vi.mock('../../app-shell/studio-platform.js', () => ({ getStudioLocalAppClient: vi.fn() }));
beforeEach(() => vi.clearAllMocks());

it('world replacement preserves hidden source fields and stable rule identities', () => {
  const source = structuredClone(TEST_WORLD_CORE);
  const draft = createWorldDraft('', source);
  draft.name = 'A revised name';
  const body = worldReplaceInput(draft, source);
  expect(body.baseContentHash).toBe(source.contentHash);
  expect(body.core.identity.name).toBe('A revised name');
  for (const key of ['ontology', 'timeModel', 'timeline', 'entities', 'relationships', 'assets', 'authoring'] as const) expect(body.core[key]).toEqual(source.core[key]);
  expect(body.lorebookDeclaration.rolePlacements).toEqual(source.lorebookDeclaration?.rolePlacements);
  expect(body.lorebookDeclaration.worldRules.map(rule => rule.systemRef)).toEqual(source.lorebookDeclaration?.worldRules.map(rule => rule.systemRef));
  expect(source.core.identity.name).toBe(TEST_WORLD_CORE.core.identity.name);
});

it('world replacement refuses a changed source before producing a write', () => {
  const draft = createWorldDraft('', TEST_WORLD_CORE);
  expect(() => worldReplaceInput(draft, { ...TEST_WORLD_CORE, contentHash: 'f'.repeat(64) })).toThrow(WorldRevisionConflict);
});

it('maintains reference-free rules without requiring a title or creating systems', () => {
  const source = { ...TEST_WORLD_CORE, lorebookDeclaration: { identityBaseSetting: 'A world.', worldRules: [{ statement: '  Letters cross at dawn.\n' }], rolePlacements: [] } };
  const draft = createWorldDraft('', source);
  draft.setting = 'A coastal world.';
  expect(draftIssues(draft)).toEqual([]);
  const body = worldReplaceInput(draft, source);
  expect(body.lorebookDeclaration.worldRules).toEqual(source.lorebookDeclaration.worldRules);
  expect(body.core.systems).toEqual(source.core.systems);
  draft.rules[0]!.statement = 'Letters cross at dusk.';
  expect(worldReplaceInput(draft, source).lorebookDeclaration.worldRules).toEqual([{ statement: 'Letters cross at dusk.' }]);
});

it('keeps referenced system content when declarations are maintained or removed', () => {
  const system = { systemId: 'system-letters', name: 'Letters', summary: 'Independently authored system description.', principles: ['A separately authored principle.'] };
  const source = { ...TEST_WORLD_CORE, core: { ...TEST_WORLD_CORE.core, systems: [system] }, lorebookDeclaration: { identityBaseSetting: 'A world.', worldRules: [{ statement: 'One rule.', systemRef: system.systemId }, { statement: 'Another rule.', systemRef: system.systemId }], rolePlacements: [] } };
  const draft = createWorldDraft('', source);
  expect(new Set(draft.rules.map(row => row.id)).size).toBe(2);
  draft.setting = 'A revised world.';
  const body = worldReplaceInput(draft, source);
  expect(body.lorebookDeclaration.worldRules).toEqual(source.lorebookDeclaration.worldRules);
  expect(body.core.systems).toEqual(source.core.systems);
  draft.rules = [];
  expect(worldReplaceInput(draft, source).core.systems).toEqual(source.core.systems);
  draft.rules = [newDraftRule('New rule', 'A new statement.')];
  const added = worldReplaceInput(draft, source);
  expect(added.core.systems).toHaveLength(source.core.systems.length + 1);
  expect(added.lorebookDeclaration.worldRules[0]?.systemRef).toBe(draft.rules[0]?.systemRef);
});

it('preserves a world display name and origin when only its setting changes', () => {
  const source = { ...TEST_WORLD_CORE, origin: { kind: 'forge' as const, sourceId: 'source-1' }, core: { ...TEST_WORLD_CORE.core, presentation: { ...TEST_WORLD_CORE.core.presentation, displayName: 'A distinct world title' } } };
  const draft = createWorldDraft('', source);
  draft.setting += ' A revised setting.';
  const body = worldReplaceInput(draft, source);
  expect(body.core.presentation).toEqual(source.core.presentation);
  expect(body.origin).toEqual(source.origin);
});

it('changes only a mirrored world display name on explicit renaming', () => {
  const draft = createWorldDraft('', TEST_WORLD_CORE);
  draft.name = 'New world name';
  expect(worldReplaceInput(draft, TEST_WORLD_CORE).core.presentation.displayName).toBe('New world name');
});

function completeCharacter() {
  const draft = newCharacterDraft('world-1', 'character-1', null);
  draft.form = { ...characterForm(), name: 'Ira', summary: 'The keeper of the tide.', role: 'Keeper', drives: 'Recover a lost memory.', traits: 'Distrustful', tone: 'Brief and patient.', greeting: 'The tide is turning.', identityStatement: 'Remain Ira, the keeper of the tide.', behavior: 'Ask before touching a memory.', speaking: 'Use short, concrete sentences.', boundaries: 'Never claim to know an unseen future.' };
  return draft;
}

it('requires explicit role instructions instead of deriving them from biography', () => {
  const draft = newCharacterDraft('world-1', 'character-1', null, { id: 'idea-1', name: 'Ira', summary: 'Keeper', role: 'Keeper', desire: 'Remember', flaw: 'Fear', voice: 'Calm' });
  expect(draft.form.identityStatement).toBe('');
  expect(characterIssues(draft.form)).toEqual(['identityStatement', 'behavior', 'speaking', 'boundaries']);
  expect(() => characterWriteBody(draft, null)).toThrow('CHARACTER_FIELDS_INCOMPLETE');
});

it('keeps role declarations separate and leaves the source profile read hashes out of a replacement', () => {
  const draft = completeCharacter();
  const body = characterWriteBody(draft, null);
  expect(body.worldEntityRef).toEqual({ kind: 'worldEntity', worldId: 'world-1', entityId: draft.entityId });
  expect(body.lorebookDeclaration.identity).toBe(draft.form.identityStatement);
  expect(body.profile.identity.summary).toBe(draft.form.summary);
  expect(body.profile).not.toHaveProperty('profileHash');
  expect(body.profile).not.toHaveProperty('profileCoverage');
});

it('preserves a separately authored display name when only character behavior changes', () => {
  const source = { ...TEST_WORLD_CHARACTER_CORE, profile: { ...TEST_WORLD_CHARACTER_CORE.profile, presentation: { ...TEST_WORLD_CHARACTER_CORE.profile.presentation, displayName: 'The harbor keeper' } } };
  const draft = newCharacterDraft(source.worldId, source.id, source);
  draft.form.behavior = 'Ask before opening a letter.';
  expect(characterWriteBody(draft, source).profile.presentation.displayName).toBe('The harbor keeper');
  expect(source.profile.presentation.displayName).toBe('The harbor keeper');
  const { profileHash, profileCoverage, ...profileInput } = source.profile;
  void profileHash; void profileCoverage;
  expect(characterWriteBody(draft, source).profile).toEqual(profileInput);
  expect(characterWriteBody(draft, source).origin).toEqual(source.origin);
});

it('updates a display name that still mirrors the identity name on an explicit rename', () => {
  const source = { ...TEST_WORLD_CHARACTER_CORE, profile: { ...TEST_WORLD_CHARACTER_CORE.profile, presentation: { ...TEST_WORLD_CHARACTER_CORE.profile.presentation, displayName: TEST_WORLD_CHARACTER_CORE.profile.identity.name } } };
  const draft = newCharacterDraft(source.worldId, source.id, source);
  draft.form.name = 'A new name';
  expect(characterWriteBody(draft, source).profile.presentation.displayName).toBe('A new name');
});

it('validates declaration limits by Unicode scalars rather than UTF-16 length', () => {
  const draft = completeCharacter();
  draft.form.identityStatement = '𠮷'.repeat(240);
  draft.form.behavior = '𠮷'.repeat(160);
  expect(characterIssues(draft.form)).toEqual([]);
  draft.form.identityStatement += '𠮷';
  draft.form.behavior += '𠮷';
  expect(characterIssues(draft.form)).toEqual(['identityStatement', 'behavior']);
});

it('rejects invalid declarations before creating a character entity', async () => {
  const draft = completeCharacter();
  draft.form.identityStatement = '界'.repeat(241);
  const api = { getCharacter: vi.fn().mockRejectedValue({ reasonCode: 'not-found' }), getEntity: vi.fn(), createEntity: vi.fn(), createCharacter: vi.fn() };
  vi.mocked(getStudioLocalAppClient).mockReturnValue({ realm: { worldCore: api } } as unknown as ReturnType<typeof getStudioLocalAppClient>);
  await expect(saveWorldCharacter(draft, async () => {})).rejects.toThrow('CHARACTER_FIELDS_INCOMPLETE');
  expect(api.createEntity).not.toHaveBeenCalled();
  expect(api.createCharacter).not.toHaveBeenCalled();
});

it('enforces world scalar and row bounds in the review preflight', () => {
  const draft = createWorldDraft('', TEST_WORLD_CORE);
  draft.setting = '𠮷'.repeat(320);
  draft.rules = Array.from({ length: 8 }, () => newDraftRule('Rule', '𠮷'.repeat(180)));
  expect(draftIssues(draft)).toEqual([]);
  draft.setting += '𠮷';
  draft.rules.push(newDraftRule('Rule', 'A rule.'));
  expect(draftIssues(draft)).toEqual(['settingLimit', 'rulesLimit']);
  draft.setting = 'A valid setting'; draft.rules = [newDraftRule('Rule', '界'.repeat(181))];
  expect(draftIssues(draft)).toEqual(['rulesLimit']);
});

it('checks full declaration totals, optional rows and NFC scalar text', () => {
  const character = { identity: 'e\u0301'.repeat(240), behavior: ['A'], speaking: ['B'], immutableBoundaries: ['C'], relationshipPostures: [] };
  expect(characterDeclarationIssues(character)).toEqual([]);
  expect(characterDeclarationIssues({ ...character, behavior: Array(7).fill('A') })).toContain('behavior');
  expect(characterDeclarationIssues({ ...character, speaking: Array(5).fill('A') })).toContain('speaking');
  expect(characterDeclarationIssues({ ...character, immutableBoundaries: Array(7).fill('A') })).toContain('immutableBoundaries');
  expect(characterDeclarationIssues({ ...character, behavior: ['A'.repeat(3601)] })).toContain('total');
  const world = { identityBaseSetting: '界'.repeat(320), worldRules: Array.from({ length: 8 }, () => ({ statement: '界'.repeat(180) })), rolePlacements: Array.from({ length: 4 }, () => ({ statement: '界'.repeat(160) })) };
  expect(worldDeclarationIssues(world)).toEqual([]);
  expect(worldDeclarationIssues({ ...world, rolePlacements: [...world.rolePlacements, { statement: 'A' }] })).toContain('total');
});

it('matches the distinct Character and World schema newline normalization', () => {
  const character = { identity: 'A'.repeat(238) + '\r\nB', behavior: ['A'], speaking: ['B'], immutableBoundaries: ['C'], relationshipPostures: [] };
  expect(characterDeclarationIssues(character)).toEqual([]);
  expect(characterDeclarationIssues({ ...character, identity: character.identity + 'C' })).toEqual(['identity']);
  expect(worldDeclarationIssues({ identityBaseSetting: 'A'.repeat(318) + '\r\nB', worldRules: [], rolePlacements: [] })).toEqual(['identityBaseSetting']);
  const draft = createWorldDraft('', TEST_WORLD_CORE);
  draft.setting = ' ' + 'A'.repeat(320);
  expect(draftIssues(draft)).toContain('settingLimit');
});

it('reuses a created entity when the character write fails and never reports partial success', async () => {
  const draft = completeCharacter();
  const notFound = Object.assign(new Error('absent'), { reasonCode: 'not-found' });
  const failure = Object.assign(new Error('Realm unavailable'), { reasonCode: 'realm-unavailable' });
  const entity = { id: draft.entityId, worldId: draft.worldId, kind: 'character' };
  const api = { getCharacter: vi.fn().mockRejectedValue(notFound), getEntity: vi.fn().mockRejectedValueOnce(notFound).mockResolvedValue(entity), createEntity: vi.fn().mockResolvedValue(entity), createCharacter: vi.fn().mockRejectedValue(failure) };
  vi.mocked(getStudioLocalAppClient).mockReturnValue({ realm: { worldCore: api } } as unknown as ReturnType<typeof getStudioLocalAppClient>);
  const checkpoint = vi.fn(async () => {});
  await expect(saveWorldCharacter(draft, checkpoint)).rejects.toBe(failure);
  await expect(saveWorldCharacter(draft, checkpoint)).rejects.toBe(failure);
  expect(api.createEntity).toHaveBeenCalledOnce();
  expect(api.createCharacter).toHaveBeenCalledTimes(2);
  expect(checkpoint).toHaveBeenCalledTimes(2);
  expect(draft.saved).toBe(false);
});

it('rejects a returned entity from another world before creating a character', async () => {
  const draft = completeCharacter();
  const api = { getCharacter: vi.fn().mockRejectedValue({ reasonCode: 'not-found' }), getEntity: vi.fn().mockResolvedValue({ id: draft.entityId, worldId: 'other-world', kind: 'character' }), createCharacter: vi.fn() };
  vi.mocked(getStudioLocalAppClient).mockReturnValue({ realm: { worldCore: api } } as unknown as ReturnType<typeof getStudioLocalAppClient>);
  await expect(saveWorldCharacter(draft, async () => {})).rejects.toThrow('CHARACTER_ENTITY_MISMATCH');
  expect(api.createCharacter).not.toHaveBeenCalled();
});
