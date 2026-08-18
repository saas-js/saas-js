import type { ConditionDraft, ConditionDraftPatch } from './draft.ts';
import type { AnyConditionsDefinition, ConditionsController, DefinitionCondition, DefinitionFieldId, DefinitionOperatorId } from './types.ts';
export type ConditionChipPanel = 'field' | 'operator' | 'value';
export interface UseConditionChipOptions<TDefinition extends AnyConditionsDefinition = AnyConditionsDefinition> {
    /** The committed condition this chip renders. Omit for an add-draft chip. */
    condition?: DefinitionCondition<TDefinition>;
    /**
     * The active draft when this chip owns it: an add draft, or the edit draft
     * for `condition`.
     */
    draft?: ConditionDraft<TDefinition>;
}
export interface ConditionChipApi<TDefinition extends AnyConditionsDefinition = AnyConditionsDefinition> {
    /** Draft values when a draft is active, otherwise the committed condition. */
    field: DefinitionFieldId<TDefinition> | undefined;
    operator: DefinitionOperatorId<TDefinition> | undefined;
    value: unknown;
    /** First validation message of the active draft, if any. */
    error: string | undefined;
    isDraft: boolean;
    /** The currently open editing panel, or `null` when closed. */
    panel: ConditionChipPanel | null;
    /**
     * Open an editing panel. Editing a committed condition cancels any other
     * active draft and begins an edit draft for it.
     */
    openPanel(panel: ConditionChipPanel): void;
    /** Close the open panel and cancel the active draft. */
    close(): void;
    /**
     * Set the draft field. Commits immediately when the field's default
     * operator takes no value; otherwise advances to the value panel.
     */
    selectField(field: DefinitionFieldId<TDefinition>): void;
    /**
     * Set the draft operator. Commits immediately when it takes no value;
     * otherwise advances to the value panel.
     */
    selectOperator(operator: DefinitionOperatorId<TDefinition>): void;
    /** Update the draft value without committing. */
    setValue(value: unknown): void;
    /**
     * Validate and commit the draft, optionally applying a final patch first.
     * Closes the panel on success. Returns the committed condition id.
     */
    apply(patch?: ConditionDraftPatch<TDefinition>): string | undefined;
    /** Cancel the draft chip, or remove the committed condition. */
    remove(): void;
}
/**
 * Interaction orchestration for a filter-chip UI: which panel is open, when a
 * draft begins, and when a selection commits. Rendering stays entirely with
 * the caller.
 */
export declare function useConditionChip<TDefinition extends AnyConditionsDefinition>(conditions: ConditionsController<TDefinition>, { condition, draft }?: UseConditionChipOptions<TDefinition>): ConditionChipApi<TDefinition>;
