import { type ConditionValidationIssue } from '@saas-js/conditions';
import type { AnyConditionsDefinition, DefinitionFieldId, DefinitionOperatorId, DefinitionStore } from './types.ts';
export type ConditionDraftMode = 'add' | 'edit';
export interface ConditionDraft<TDefinition extends AnyConditionsDefinition = AnyConditionsDefinition> {
    mode: ConditionDraftMode;
    /** Target group for `add` drafts. Absent while editing an existing condition. */
    parentId?: string;
    index?: number;
    conditionId?: string;
    field?: DefinitionFieldId<TDefinition>;
    operator?: DefinitionOperatorId<TDefinition>;
    value?: unknown;
    errors: readonly ConditionValidationIssue[];
}
export interface ConditionDraftState<TDefinition extends AnyConditionsDefinition = AnyConditionsDefinition> {
    draft?: ConditionDraft<TDefinition>;
}
export interface BeginAddConditionOptions<TDefinition extends AnyConditionsDefinition = AnyConditionsDefinition> {
    parentId?: string;
    index?: number;
    field?: DefinitionFieldId<TDefinition>;
    operator?: DefinitionOperatorId<TDefinition>;
    value?: unknown;
}
export interface ConditionDraftPatch<TDefinition extends AnyConditionsDefinition = AnyConditionsDefinition> {
    field?: DefinitionFieldId<TDefinition>;
    operator?: DefinitionOperatorId<TDefinition>;
    value?: unknown;
}
export interface ConditionDraftValidation {
    valid: boolean;
    issues: readonly ConditionValidationIssue[];
}
export interface ConditionDraftController<TDefinition extends AnyConditionsDefinition = AnyConditionsDefinition> {
    get(): ConditionDraftState<TDefinition>;
    subscribe(listener: () => void): () => void;
    beginAddCondition(options?: BeginAddConditionOptions<TDefinition>): void;
    beginEditCondition(id: string): void;
    updateDraft(patch: ConditionDraftPatch<TDefinition>): void;
    validateDraft(): ConditionDraftValidation;
    /**
     * Validate and commit the draft, optionally applying a final patch first.
     * Returns the committed condition id, or `undefined` when validation failed.
     */
    commitDraft(patch?: ConditionDraftPatch<TDefinition>): string | undefined;
    cancelDraft(): void;
}
export declare function createConditionDraftController<TDefinition extends AnyConditionsDefinition>(definition: TDefinition, store: DefinitionStore<TDefinition>): ConditionDraftController<TDefinition>;
