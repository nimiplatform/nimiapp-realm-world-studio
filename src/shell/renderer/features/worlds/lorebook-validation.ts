import type { RealmModel } from '@nimiplatform/sdk/realm/generated';

type CharacterDeclaration = RealmModel<'CharacterLorebookDeclarationV1Dto'>;
type WorldDeclaration = RealmModel<'WorldLorebookDeclarationV1Dto'>;

// @nimi-authority: rule.realm-world-studio.setting.r010
// UI preflight for Realm core r024 / Forge's declaration schemas. These are
// semantic Unicode-scalar limits, not the platform's larger UTF-8 wire budgets.
export const DECLARATION_LIMITS = {
  characterIdentity: 240, characterLine: 160, behaviorRows: 6, speakingRows: 4,
  boundaryRows: 6, postureRows: 4, postureLine: 180, characterTotal: 3600,
  worldSetting: 320, worldRule: 180, worldRuleRows: 8, roleRows: 4,
  roleLine: 160, worldTotal: 2400,
} as const;

export function scalarLength(text: string): number {
  const characters = Array.from(text.normalize('NFC'));
  return characters.some(char => char.length === 1 && char.charCodeAt(0) >= 0xd800 && char.charCodeAt(0) <= 0xdfff) ? Infinity : characters.length;
}

const characterScalarLength = (text: string) => scalarLength(text.replace(/\r\n?/g, '\n'));
const bounded = (text: string, limit: number, length = scalarLength) => Boolean(text.trim()) && length(text) <= limit;
const rowsValid = (rows: readonly string[], maxRows: number, maxLength: number, required = true, length = scalarLength) => (!required || rows.length > 0) && rows.length <= maxRows && rows.every(text => bounded(text, maxLength, length));

export function characterDeclarationIssues(value: CharacterDeclaration): string[] {
  const limits = DECLARATION_LIMITS;
  const issues: string[] = [];
  // Forge's Character schema also normalizes CRLF / CR; the World schema uses NFC only.
  if (!bounded(value.identity, limits.characterIdentity, characterScalarLength)) issues.push('identity');
  if (!rowsValid(value.behavior, limits.behaviorRows, limits.characterLine, true, characterScalarLength)) issues.push('behavior');
  if (!rowsValid(value.speaking, limits.speakingRows, limits.characterLine, true, characterScalarLength)) issues.push('speaking');
  if (!rowsValid(value.immutableBoundaries, limits.boundaryRows, limits.characterLine, true, characterScalarLength)) issues.push('immutableBoundaries');
  if (!rowsValid(value.relationshipPostures.map(row => row.statement), limits.postureRows, limits.postureLine, false, characterScalarLength)) issues.push('relationshipPostures');
  // Current Realm source writes do not admit relationship-posture reference identities.
  if (value.relationshipPostures.length && !issues.includes('relationshipPostures')) issues.push('relationshipPostures');
  if ([value.identity, ...value.behavior, ...value.speaking, ...value.immutableBoundaries, ...value.relationshipPostures.map(row => row.statement)].reduce((sum, text) => sum + characterScalarLength(text), 0) > limits.characterTotal) issues.push('total');
  return issues;
}

export function worldDeclarationIssues(value: WorldDeclaration): string[] {
  const limits = DECLARATION_LIMITS;
  const issues: string[] = [];
  if (!bounded(value.identityBaseSetting, limits.worldSetting)) issues.push('identityBaseSetting');
  if (!rowsValid(value.worldRules.map(row => row.statement), limits.worldRuleRows, limits.worldRule, false)) issues.push('worldRules');
  if (!rowsValid(value.rolePlacements.map(row => row.statement), limits.roleRows, limits.roleLine, false)) issues.push('rolePlacements');
  if (value.worldRules.some(row => row.principleRef !== undefined || row.evidenceRef !== undefined)) issues.push('worldRuleReferences');
  if (value.rolePlacements.some(row => row.roleRef !== undefined)) issues.push('roleReferences');
  if ([value.identityBaseSetting, ...value.worldRules.map(row => row.statement), ...value.rolePlacements.map(row => row.statement)].reduce((sum, text) => sum + scalarLength(text), 0) > limits.worldTotal) issues.push('total');
  return issues;
}
