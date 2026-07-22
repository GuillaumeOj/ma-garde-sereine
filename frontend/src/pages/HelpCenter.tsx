import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { helpArticlesByCategory } from '@/src/content/help'
import { useSeoMeta } from '@/src/hooks/useSeoMeta'
import { useI18n } from '@/src/i18n/I18nContext'
import type { TranslationKey } from '@/src/i18n/translations'

// The help center index: articles grouped onto their category shelves, each a
// card that links to the article. Public (crawlable) so the guides also serve
// SEO; the same URL works signed in, reached from the dashboard's Help link.
export default function HelpCenter() {
  const { t, lang } = useI18n()
  useSeoMeta({
    title: t('seo.help.title'),
    description: t('seo.help.description'),
    canonical: '/help',
  })

  const groups = helpArticlesByCategory()

  return (
    <>
      <header className="mx-auto w-full max-w-[1120px] px-4 py-16 sm:px-6 sm:py-20">
        <h1 className="max-w-3xl font-heading text-4xl font-semibold leading-tight tracking-tight text-balance sm:text-5xl">
          {t('help.page.title')}
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          {t('help.page.subtitle')}
        </p>
      </header>

      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-14 px-4 pb-24 sm:px-6">
        {groups.map(({ category, articles }) => (
          <section key={category}>
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-brand-emerald">
              {t(`help.category.${category}` as TranslationKey)}
            </h2>
            <ul className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              {articles.map((article) => {
                const Icon = article.icon
                return (
                  <li key={article.slug}>
                    <Link
                      to={`/help/${article.slug}`}
                      className="group flex h-full items-start gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-brand-emerald/40 hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-emerald/10 text-brand-emerald">
                        <Icon size={22} aria-hidden="true" />
                      </span>
                      <span className="flex min-w-0 flex-col gap-1">
                        <span className="flex items-center gap-1 font-heading text-lg font-medium">
                          {article.title[lang]}
                          <ChevronRight
                            size={18}
                            aria-hidden="true"
                            className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                          />
                        </span>
                        <span className="text-sm leading-relaxed text-muted-foreground">
                          {article.summary[lang]}
                        </span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </>
  )
}
