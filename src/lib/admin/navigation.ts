import {
  BookOpenIcon,
  CircleHelpIcon,
  DatabaseIcon,
  FlagIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  MailIcon,
  ShieldCheckIcon,
  TimerResetIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"

import type { Privilege } from "@/lib/auth/privileges"

export type NavigationItem = {
  title: string
  description: string
  href: string
  icon: LucideIcon
  privilege?: Privilege
}

export const NAVIGATION: { title: string | null; items: NavigationItem[] }[] = [
  {
    title: null,
    items: [
      { title: "Обзор", description: "Сводка по системе", href: "/admin", icon: LayoutDashboardIcon },
      {
        title: "Пользователи",
        description: "Поиск, объявления, отклики и журнал событий",
        href: "/admin/users",
        icon: UsersIcon,
        privilege: "USER_READ",
      },
      {
        title: "Модерация",
        description: "Новые объявления, ожидающие проверки",
        href: "/admin/moderation",
        icon: ShieldCheckIcon,
        privilege: "CONTENT_MODERATE",
      },
      {
        title: "Жалобы",
        description: "Жалобы пользователей на объявления, других пользователей и чаты",
        href: "/admin/complaints",
        icon: FlagIcon,
        privilege: "CONTENT_MODERATE",
      },
      {
        title: "Объявления",
        description: "Все объявления: закрытие и удаление",
        href: "/admin/cases",
        icon: FileTextIcon,
      },
    ],
  },
  {
    title: "Справочники",
    items: [
      {
        title: "Типы помощи",
        description: "Создание, переименование и отключение",
        href: "/admin/need-types",
        icon: BookOpenIcon,
      },
      {
        title: "FAQ",
        description: "Частые вопросы на сайте: тексты ru/be, порядок и публикация",
        href: "/admin/faq",
        icon: CircleHelpIcon,
        privilege: "DICTIONARY_MANAGE",
      },
    ],
  },
  {
    title: "Система",
    items: [
      { title: "Кэш", description: "Записи Redis и их очистка", href: "/admin/cache", icon: DatabaseIcon },
      {
        title: "Шаблоны уведомлений",
        description: "Просмотр email и in-app шаблонов",
        href: "/admin/notification-templates",
        icon: MailIcon,
        privilege: "SETTINGS_MANAGE",
      },
      {
        title: "Фоновые задачи",
        description: "Запуск задач планировщика",
        href: "/admin/jobs",
        icon: TimerResetIcon,
        privilege: "SETTINGS_MANAGE",
      },
    ],
  },
]

/** Navigation without the items whose privilege the user lacks; groups left empty are dropped. */
export function getNavigation(privileges: Privilege[]) {
  return NAVIGATION.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.privilege || privileges.includes(item.privilege)),
  })).filter((group) => group.items.length > 0)
}

export function isActive(pathname: string | null, href: string) {
  if (!pathname) return false
  return href === "/admin" ? pathname === href : pathname.startsWith(href)
}
