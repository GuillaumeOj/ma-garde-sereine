import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/src/components/ui/alert-dialog'
import { Button } from '@/src/components/ui/button'
import { useI18n } from '@/src/i18n/I18nContext'

// An irreversible action guarded by a confirm dialog. Shared by the app's delete
// flows so the AlertDialog markup and styling live in one place.
export function ConfirmButton({
  trigger,
  title,
  description,
  onConfirm,
  variant = 'destructive',
  disabled = false,
}: {
  trigger: string
  title: string
  description: string
  onConfirm: () => void
  // Not everything worth confirming is a deletion: filing a declaration is just
  // as final, but it commits rather than destroys, and reads as the primary
  // action on the card rather than a red warning.
  variant?: 'destructive' | 'default'
  disabled?: boolean
}) {
  const { t } = useI18n()
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size="sm" type="button" disabled={disabled}>
          {trigger}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            className={
              variant === 'destructive'
                ? 'bg-destructive text-white hover:bg-destructive/90'
                : undefined
            }
            onClick={onConfirm}
          >
            {trigger}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
