"use client"

import { RotateCwIcon, ServerCrashIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default function AdminError({ retry }: { error: Error; retry: () => void }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ServerCrashIcon />
        </EmptyMedia>
        <EmptyTitle>Не удалось загрузить страницу</EmptyTitle>
        <EmptyDescription>
          Сервер недоступен или ответил ошибкой. Попробуйте ещё раз через несколько секунд.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={() => retry()}>
          <RotateCwIcon data-icon="inline-start" />
          Повторить
        </Button>
      </EmptyContent>
    </Empty>
  )
}
