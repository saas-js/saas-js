---
'@saas-js/conditions-react': minor
---

Initial release: headless React bindings for `@saas-js/conditions`.

- `createConditionsHook({ definition })` binds a definition so every hook,
  selector, and draft action is fully typed without generic annotations;
  `contexts` is optional.
- Controlled/uncontrolled `useConditions` with a single optional `value` prop
  and deterministic effect-based reconciliation.
- Common data hooks pre-bound on the instance: `useValue`, `useRoot`,
  `useIsEmpty`, `useCondition`, `useGroup`, `useDraft`, `useEditDraft`,
  `useAddDraft`, `useHasAddDraft`, and `useFilter` (plus `filter` on the
  controller).
- `useConditionChip` owns filter-chip orchestration (panel state, edit
  drafts, commit-or-advance selection).
- Typed draft controller with `commitDraft(patch?)`; selector hooks with
  optional `isEqual` for stable derived selections; built-in
  `conditions.ValueEditor` component; `useConditionOptions` with query
  debouncing and default boolean options.
