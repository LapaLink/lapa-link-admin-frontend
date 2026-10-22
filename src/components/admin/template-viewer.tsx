"use client"

import { useState, useTransition } from "react"
import { CircleAlertIcon, CodeIcon, EyeIcon } from "lucide-react"

import { JsonView } from "@/components/admin/json-view"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { getNotificationTemplate } from "@/lib/admin/actions"
import { buildPreviewDocument, splitTemplate } from "@/lib/admin/template-preview"
import type { NotificationTemplate, NotificationTemplateContent } from "@/lib/api/admin-types"
import type { ApiError } from "@/lib/api/types"

type Locale = NotificationTemplate["locales"][number]

const LOCALE_LABELS: Record<Locale, string> = { RU: "Русский", BE: "Беларуская" }

export function TemplateViewer({ template }: { template: NotificationTemplate }) {
  const locales = template.locales.toSorted().reverse()
  const [open, setOpen] = useState(false)
  const [locale, setLocale] = useState<Locale>(locales[0])
  const [result, setResult] = useState<NotificationTemplateContent | ApiError>()
  const [loading, startLoading] = useTransition()

  function load(next: Locale) {
    setLocale(next)
    setResult(undefined)
    startLoading(async () => {
      const response = await getNotificationTemplate(template.eventType, template.channel, next)
      setResult(response.ok ? response.data : response.error)
    })
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) load(locale)
  }

  const content = result && "content" in result ? result : undefined
  const error = result && !("content" in result) ? result : undefined
  const parts = content ? splitTemplate(content.content) : undefined

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger render={<Button variant="ghost" size="sm" />}>
        <EyeIcon data-icon="inline-start" />
        Просмотр
      </SheetTrigger>
      <SheetContent className="w-full gap-0 sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle className="font-mono">{template.eventType}</SheetTitle>
          <SheetDescription>
            {template.channel === "EMAIL" ? "Email" : "Уведомление в приложении"}. Переменные{" "}
            <code className="font-mono">{"${…}"}</code> показаны без подстановки.
          </SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 pb-4">
          <ToggleGroup
            value={[locale]}
            onValueChange={(value) => value[0] && load(value[0] as Locale)}
            variant="outline"
            size="sm"
          >
            {locales.map((item) => (
              <ToggleGroupItem key={item} value={item}>
                {LOCALE_LABELS[item]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {loading && <Skeleton className="h-96" />}
          {error && (
            <Alert variant="destructive">
              <CircleAlertIcon />
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}
          {parts && content && (
            <Tabs defaultValue="preview" className="min-h-0 flex-1">
              <TabsList>
                <TabsTrigger value="preview">
                  <EyeIcon data-icon="inline-start" />
                  Превью
                </TabsTrigger>
                <TabsTrigger value="source">
                  <CodeIcon data-icon="inline-start" />
                  Исходник
                </TabsTrigger>
              </TabsList>
              <TabsContent value="preview" className="flex min-h-0 flex-col gap-3">
                {parts.subject && (
                  <div className="flex flex-col gap-1 rounded-lg border bg-muted/40 px-3 py-2">
                    <span className="text-xs text-muted-foreground">Тема</span>
                    <span className="text-sm font-medium">{parts.subject}</span>
                  </div>
                )}
                <iframe
                  title={`Превью ${template.eventType}`}
                  sandbox=""
                  srcDoc={buildPreviewDocument(parts.body, template.channel)}
                  className="min-h-96 w-full flex-1 rounded-lg border bg-background"
                />
              </TabsContent>
              <TabsContent value="source" className="min-h-0">
                <JsonView value={content.content} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
