import { createConditionsHook } from '@saas-js/conditions-react'

import { contactsDefinition } from '../shared/definition.ts'

/**
 * The definition-bound hook: every context hook, selector, and draft action
 * is typed against `contactsDefinition` without generic annotations.
 */
export const base = createConditionsHook({ definition: contactsDefinition })
