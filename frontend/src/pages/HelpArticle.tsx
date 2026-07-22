import { ArrowLeft, ChevronRight } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArticleBody } from '@/src/components/help/ArticleBody'
import { getHelpArticle } from '@/src/content/help'
import { useSeoMeta } from '@/src/hooks/useSeoMeta'
import { useI18n } from '@/src/i18n/I18nContext'

// A single help article. Reached at /help/:slug; an unknown slug bounces back to
// the help index rather than showing a dead end.
export default function HelpArticle() {
  const { t, lang } = useI18n()
  const { slug } = useParams<{ slug: string }>()
  const article = getHelpArticle(slug)

  // useSeoMeta must run every render (hooks can't be conditional); feed it empty
  // strings when there's no article — we redirect away immediately below anyway.
  useSeoMeta({
    title: article ? article.title[lang] : '',
    description: article ? article.summary[lang] : '',
    canonical: article ? `/help/${article.slug}` : undefined,
  })

  if (!article) {
    return <Navigate to="/help" replace />
  }

  // Resolve related slugs to articles, dropping any that don't exist.
  const related = (article.related ?? [])
    .map((relatedSlug) => getHelpArticle(relatedSlug))
    .filter((a): a is NonNullable<typeof a> => a != null)

  return (
    <article className="mx-auto w-full max-w-[1120px] px-4 py-12 sm:px-6 sm:py-16">
      <Link
        to="/help"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        {t('help.backToIndex')}
      </Link>

      <h1 className="mt-6 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {article.title[lang]}
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        {article.summary[lang]}
      </p>

      <div className="mt-10">
        <ArticleBody blocks={article.body[lang]} />
      </div>

      {related.length > 0 && (
        <section className="mt-16 border-t border-border pt-8">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-brand-emerald">
            {t('help.related')}
          </h2>
          <ul className="mt-4 flex flex-col gap-2">
            {related.map((rel) => (
              <li key={rel.slug}>
                <Link
                  to={`/help/${rel.slug}`}
                  className="group inline-flex items-center gap-1.5 text-foreground transition-colors hover:text-brand-emerald"
                >
                  {rel.title[lang]}
                  <ChevronRight
                    size={16}
                    aria-hidden="true"
                    className="text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}
