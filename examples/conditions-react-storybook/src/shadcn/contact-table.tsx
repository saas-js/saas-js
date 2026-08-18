import { Braces, ChevronDown, UsersRound } from 'lucide-react'

import { contacts, formatContactValue } from '../shared/definition.ts'
import { base } from './conditions-hook.ts'
import { cn } from './lib/utils.ts'

export function ContactTable() {
  const conditions = base.useConditionsContext()
  const matches = conditions.useFilter(contacts)
  return (
    <section
      className="overflow-hidden rounded-xl border bg-white"
      aria-label="Matching contacts"
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Contacts</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Live results from the portable condition query
          </p>
        </div>
        <span className="rounded-md bg-zinc-100 px-2 py-1 font-mono text-xs text-zinc-600">
          {matches.length} of {contacts.length}
        </span>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[620px]">
          <div className="grid grid-cols-[minmax(12rem,1.5fr)_minmax(10rem,1fr)_7rem_9rem] gap-4 border-b bg-zinc-50/70 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">
            <span>Contact</span>
            <span>Status</span>
            <span>ARR</span>
            <span>Owner</span>
          </div>
          {matches.map((contact) => (
            <div
              key={contact.id}
              className="grid grid-cols-[minmax(12rem,1.5fr)_minmax(10rem,1fr)_7rem_9rem] items-center gap-4 border-b px-4 py-3 text-sm last:border-0 hover:bg-zinc-50/70"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600">
                  {contact.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium">{contact.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {contact.company}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 capitalize">
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    contact.status === 'customer'
                      ? 'bg-indigo-500'
                      : contact.status === 'lead'
                        ? 'bg-amber-400'
                        : 'bg-zinc-400',
                  )}
                />
                {contact.status}
              </div>
              <span className="font-mono text-xs">
                {formatContactValue('arr', contact.arr)}
              </span>
              <span className="truncate text-zinc-600">
                {formatContactValue('owner', contact.owner).split(' ')[0]}
              </span>
            </div>
          ))}
          {!matches.length ? (
            <div className="px-4 py-14 text-center">
              <UsersRound className="mx-auto h-5 w-5 text-zinc-400" />
              <p className="mt-3 text-sm font-medium">No matching contacts</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try widening or removing a filter.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export function QueryDetails() {
  const conditions = base.useConditionsContext()
  const query = conditions.useValue()
  return (
    <details className="group rounded-xl border bg-white">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <Braces className="h-4 w-4 text-zinc-500" /> Current query
        <ChevronDown className="ml-auto h-4 w-4 text-zinc-400 transition-transform group-open:rotate-180" />
      </summary>
      <pre className="max-h-72 overflow-auto border-t bg-zinc-950 p-4 font-mono text-xs leading-5 text-zinc-100">
        {JSON.stringify(query, null, 2)}
      </pre>
    </details>
  )
}
