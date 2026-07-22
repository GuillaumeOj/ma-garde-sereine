import { ExternalLink, Info, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { HelpBlock } from '@/src/content/help'
import { cn } from '@/src/lib/utils'

// Renders one help article's body from its structured blocks. The block list is
// closed (see HelpBlock), so this switch stays exhaustive: a new block kind is a
// type error here until it is handled.

function Resource({ href, label }: { href: string; label: string }) {
  // Hrefs starting with "/" stay inside the SPA; everything else is an outbound
  // reference (Pajemploi, Legifrance) opened in a new tab.
  const internal = href.startsWith('/')
  const className =
    'inline-flex items-center gap-2 text-sm font-medium text-brand-emerald underline-offset-4 hover:underline'

  if (internal) {
    return (
      <Link to={href} className={className}>
        {label}
      </Link>
    )
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {label}
      <ExternalLink size={14} aria-hidden="true" className="shrink-0" />
    </a>
  )
}

function Block({ block }: { block: HelpBlock }) {
  switch (block.kind) {
    case 'heading':
      return (
        <h2 className="mt-10 font-heading text-xl font-medium first:mt-0">
          {block.text}
        </h2>
      )
    case 'p':
      return (
        <p className="leading-relaxed text-muted-foreground">{block.text}</p>
      )
    case 'list':
      return (
        <ul className="flex list-disc flex-col gap-2 pl-5 text-muted-foreground marker:text-brand-emerald">
          {block.items.map((item) => (
            <li key={item} className="leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      )
    case 'steps':
      return (
        <ol className="flex flex-col gap-3">
          {block.items.map((item, index) => (
            <li key={item} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-emerald/10 text-sm font-semibold text-brand-emerald"
              >
                {index + 1}
              </span>
              <span className="leading-relaxed text-muted-foreground">
                {item}
              </span>
            </li>
          ))}
        </ol>
      )
    case 'note': {
      const warning = block.tone === 'warning'
      const Icon = warning ? TriangleAlert : Info
      return (
        <div
          className={cn(
            'flex items-start gap-3 rounded-xl border p-4 text-sm leading-relaxed',
            warning
              ? 'border-destructive/30 bg-destructive/5 text-foreground'
              : 'border-brand-emerald/25 bg-brand-emerald/5 text-foreground',
          )}
        >
          <Icon
            size={18}
            aria-hidden="true"
            className={cn(
              'mt-0.5 shrink-0',
              warning ? 'text-destructive' : 'text-brand-emerald',
            )}
          />
          <p>{block.text}</p>
        </div>
      )
    }
    case 'links':
      return (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-secondary/30 p-4">
          {block.items.map((item) => (
            <Resource key={item.href} href={item.href} label={item.label} />
          ))}
        </div>
      )
  }
}

export function ArticleBody({ blocks }: { blocks: HelpBlock[] }) {
  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, index) => (
        // Blocks have no id; their position is their identity within one article.
        // biome-ignore lint/suspicious/noArrayIndexKey: static, never reordered
        <Block key={index} block={block} />
      ))}
    </div>
  )
}
