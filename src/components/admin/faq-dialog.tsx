"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CircleAlertIcon, PencilIcon, PlusIcon } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { createFaq, updateFaq } from "@/lib/admin/actions"
import type { Faq } from "@/lib/api/admin-types"
import type { ApiError } from "@/lib/api/types"

const QUESTION_MAX = 300
const ANSWER_MAX = 4000

// Same idea as the backend check: a tag starts with "<" followed by a letter or "/"; "котята < 3" is fine.
const HTML_TAG = /<\/?[a-z][^>]*>/i

const LANGUAGES = [
  { value: "ru", label: "Русский", question: "questionRu", answer: "answerRu" },
  { value: "be", label: "Беларуская", question: "questionBe", answer: "answerBe" },
] as const

type TextField = (typeof LANGUAGES)[number]["question" | "answer"]

/** Create or edit a FAQ entry; texts are plain text, the answer preview renders them as the site does. */
export function FaqDialog({ faq, nextSortOrder }: { faq?: Faq; nextSortOrder?: number }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<ApiError>()
  const [pending, startTransition] = useTransition()
  const [texts, setTexts] = useState<Record<TextField, string>>(initialTexts(faq))

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setError(undefined)
      setTexts(initialTexts(faq))
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const input = {
      questionRu: texts.questionRu.trim(),
      answerRu: texts.answerRu.trim(),
      questionBe: texts.questionBe.trim(),
      answerBe: texts.answerBe.trim(),
      sortOrder: Number(form.get("sortOrder")),
      published: form.get("published") === "on",
    }

    startTransition(async () => {
      const result = faq ? await updateFaq(faq.id, input) : await createFaq(input)
      if (!result.ok) {
        if (result.error.code === "FAQ_NOT_FOUND") {
          setOpen(false)
          toast.add({ title: "Вопрос уже удалён", description: result.error.message, type: "error" })
          router.refresh()
          return
        }
        setError(result.error)
        return
      }
      setOpen(false)
      toast.add({ title: faq ? "Вопрос сохранён" : "Вопрос добавлен", type: "success" })
      router.refresh()
    })
  }

  const fieldError = (name: string) => error?.fields?.[name]
  const complete = Object.values(texts).every((text) => text.trim().length > 0)
  const hasHtml = Object.values(texts).some((text) => HTML_TAG.test(text))

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {faq ? (
        <DialogTrigger render={<Button variant="ghost" size="sm" />}>
          <PencilIcon data-icon="inline-start" />
          Изменить
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button />}>
          <PlusIcon data-icon="inline-start" />
          Добавить вопрос
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-2xl">
        <form onSubmit={handleSubmit} className="flex min-w-0 flex-col gap-6">
          <DialogHeader>
            <DialogTitle>{faq ? "Изменение вопроса" : "Новый вопрос"}</DialogTitle>
            <DialogDescription>
              Только обычный текст: HTML-теги не допускаются, переносы строк сохраняются.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            {error && !error.fields && (
              <Alert variant="destructive">
                <CircleAlertIcon />
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}
            {hasHtml && (
              <Alert variant="destructive">
                <CircleAlertIcon />
                <AlertDescription>В тексте есть HTML-теги — сервер не примет такой текст.</AlertDescription>
              </Alert>
            )}
            <Tabs defaultValue="ru" className="gap-4">
              <TabsList>
                {LANGUAGES.map((language) => (
                  <TabsTrigger key={language.value} value={language.value}>
                    {language.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {LANGUAGES.map((language) => (
                <TabsContent key={language.value} value={language.value} keepMounted className="flex flex-col gap-4">
                  <Field data-invalid={Boolean(fieldError(language.question))}>
                    <FieldLabel htmlFor={language.question}>Вопрос</FieldLabel>
                    <Input
                      id={language.question}
                      maxLength={QUESTION_MAX}
                      value={texts[language.question]}
                      onChange={(event) => setTexts({ ...texts, [language.question]: event.target.value })}
                      aria-invalid={Boolean(fieldError(language.question))}
                    />
                    <FieldDescription className="tabular-nums">
                      {texts[language.question].length}/{QUESTION_MAX}
                    </FieldDescription>
                    <FieldError>{fieldError(language.question)}</FieldError>
                  </Field>
                  <Field data-invalid={Boolean(fieldError(language.answer))}>
                    <FieldLabel htmlFor={language.answer}>Ответ</FieldLabel>
                    <Textarea
                      id={language.answer}
                      rows={6}
                      maxLength={ANSWER_MAX}
                      value={texts[language.answer]}
                      onChange={(event) => setTexts({ ...texts, [language.answer]: event.target.value })}
                      aria-invalid={Boolean(fieldError(language.answer))}
                    />
                    <FieldDescription className="tabular-nums">
                      {texts[language.answer].length}/{ANSWER_MAX}
                    </FieldDescription>
                    <FieldError>{fieldError(language.answer)}</FieldError>
                  </Field>
                  {texts[language.answer].trim() && (
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-muted-foreground">Предпросмотр</span>
                      <div className="max-h-48 overflow-y-auto rounded-lg border bg-muted/40 p-3 text-sm break-words whitespace-pre-line">
                        {texts[language.answer].trim()}
                      </div>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
            <Field data-invalid={Boolean(fieldError("sortOrder"))}>
              <FieldLabel htmlFor="sortOrder">Порядок отображения</FieldLabel>
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                required
                step={1}
                defaultValue={faq?.sortOrder ?? nextSortOrder}
                aria-invalid={Boolean(fieldError("sortOrder"))}
              />
              <FieldDescription>Вопросы сортируются по возрастанию</FieldDescription>
              <FieldError>{fieldError("sortOrder")}</FieldError>
            </Field>
            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="published">Опубликован</FieldLabel>
                <FieldDescription>Неопубликованные вопросы видны только в админке</FieldDescription>
              </FieldContent>
              <Switch id="published" name="published" defaultChecked={faq?.published ?? false} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Отмена</DialogClose>
            <Button type="submit" disabled={pending || !complete}>
              {pending && <Spinner data-icon="inline-start" />}
              Сохранить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function initialTexts(faq?: Faq): Record<TextField, string> {
  return {
    questionRu: faq?.questionRu ?? "",
    answerRu: faq?.answerRu ?? "",
    questionBe: faq?.questionBe ?? "",
    answerBe: faq?.answerBe ?? "",
  }
}
