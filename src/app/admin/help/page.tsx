import type { Metadata } from "next"

import { PageHeader } from "@/components/admin/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = { title: "Справка" }

const ADOPTION_STATUSES: [string, string][] = [
  ["NEW", "Новая: заявка подана, автор ещё не отреагировал"],
  ["CONTACTED", "Автор связался с заявителем"],
  ["MEETING", "Назначена встреча с животным"],
  ["APPROVED", "Автор одобрил заявку"],
  ["REJECTED", "Отклонена автором (окончательный статус)"],
  ["CANCELLED", "Отозвана заявителем (окончательный статус)"],
]

export default function HelpPage() {
  return (
    <>
      <PageHeader
        title="Справка"
        description="Подсказки для ответов пользователям. Здесь только описание, действий над заявками в админке нет"
      />
      <Card>
        <CardHeader>
          <CardTitle>Заявки на постоянный дом</CardTitle>
          <CardDescription>
            Заявки создают и ведут сами пользователи. Модератор видит связанные события в журнале событий
            пользователя: фильтр «Действие» → «Подана заявка на дом» и другие.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 text-sm">
          <section className="flex flex-col gap-2">
            <h3 className="font-medium">Кто и куда может подать заявку</h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Зарегистрированный пользователь на открытое объявление, у которого есть потребность «Постоянный
                дом» (<code className="font-mono text-xs">ADOPTION</code>).
              </li>
              <li>Автор не может подать заявку на своё объявление.</li>
              <li>У пользователя не больше одной активной заявки на одно объявление.</li>
            </ul>
          </section>
          <section className="flex flex-col gap-2">
            <h3 className="font-medium">Статусы</h3>
            <p className="text-muted-foreground">
              Статусы идут вперёд: <span className="font-mono text-xs">NEW → CONTACTED → MEETING → APPROVED</span>.
              Отклонённая и отозванная заявки больше не меняются.
            </p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              {ADOPTION_STATUSES.map(([status, text]) => (
                <div key={status} className="contents">
                  <dt className="font-mono text-xs">{status}</dt>
                  <dd>{text}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="flex flex-col gap-2">
            <h3 className="font-medium">Что происходит после одобрения</h3>
            <p>
              Одобрение не закрывает объявление: автор закрывает его сам с причиной «Постоянный дом».
            </p>
          </section>
          <section className="flex flex-col gap-2">
            <h3 className="font-medium">Лимит подачи</h3>
            <p>
              Действует суточный лимит <code className="font-mono text-xs">ADOPTION_REQUEST_NEW_REQUEST</code>: по
              умолчанию 10 заявок в сутки на пользователя. При превышении пользователь получает ошибку 429. Значение
              меняется в разделе «Лимиты».
            </p>
          </section>
          <section className="flex flex-col gap-2">
            <h3 className="font-medium">Кто видит анкету</h3>
            <p>
              Анкету (жильё, опыт, другие питомцы, поездки, стерилизация) и уточнения автора видят только автор
              объявления и заявитель. В админке их нет.
            </p>
          </section>
          <section className="flex flex-col gap-2">
            <h3 className="font-medium">Удаление аккаунта</h3>
            <p>При удалении аккаунта заявка обезличивается, статистика сохраняется.</p>
          </section>
        </CardContent>
      </Card>
    </>
  )
}
