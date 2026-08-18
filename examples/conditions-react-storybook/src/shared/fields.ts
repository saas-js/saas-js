import {
  Bell,
  Building2,
  CalendarDays,
  CircleDollarSign,
  Filter,
  type LucideIcon,
  MailCheck,
  UserRound,
} from 'lucide-react'

import { getConditionField, getConditionOperator } from '@saas-js/conditions'

import { contactsDefinition, formatContactValue } from './definition.ts'

export type ContactFieldId = keyof typeof contactsDefinition.fields

export const fieldEntries = Object.entries(contactsDefinition.fields) as [
  ContactFieldId,
  (typeof contactsDefinition.fields)[ContactFieldId],
][]

const fieldIcons: Partial<Record<ContactFieldId, LucideIcon>> = {
  status: Bell,
  company: Building2,
  arr: CircleDollarSign,
  createdAt: CalendarDays,
  subscribed: MailCheck,
  owner: UserRound,
}

export function fieldIcon(fieldId: string | undefined): LucideIcon {
  return fieldIcons[fieldId as ContactFieldId] ?? Filter
}

export function fieldDetails(fieldId?: string) {
  const field = fieldId
    ? getConditionField(contactsDefinition, fieldId)
    : undefined
  return { field, label: field?.label ?? fieldId ?? 'Choose field' }
}

export function operatorDetails(operatorId?: string) {
  return operatorId
    ? getConditionOperator(contactsDefinition, operatorId)
    : undefined
}

const operatorChipLabels: Record<string, string> = {
  equals: 'is',
  not: 'is not',
  gte: '≥',
  lte: '≤',
  in: 'is any of',
  isNull: 'is empty',
}

export function operatorChipLabel(operatorId?: string) {
  return operatorId
    ? (operatorChipLabels[operatorId] ?? operatorDetails(operatorId)?.label)
    : 'is'
}

export function valueLabel(fieldId: string | undefined, value: unknown) {
  if (!fieldId) return ''
  if (Array.isArray(value)) {
    return value.map((item) => formatContactValue(fieldId, item)).join(' – ')
  }
  if (fieldId === 'status') {
    const options = contactsDefinition.fields.status.options
    const option = Array.isArray(options)
      ? options.find((item) => item.value === value)
      : undefined
    return option?.label ?? String(value ?? '')
  }
  if (fieldId === 'subscribed') return value ? 'Yes' : 'No'
  return value == null ? '' : formatContactValue(fieldId, value)
}
