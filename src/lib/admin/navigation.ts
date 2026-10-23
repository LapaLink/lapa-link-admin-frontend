import {
  BookOpenIcon,
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

export type NavigationItem = {
  title: string
  description: string
  href: string
  icon: LucideIcon
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
      },
      {
        title: "Модерация",
        description: "Новые объявления, ожидающие проверки",
        href: "/admin/moderation",
        icon: ShieldCheckIcon,
      },
      {
        title: "Жалобы",
        description: "Жалобы пользователей на объявления и других пользователей",
        href: "/admin/complaints",
        icon: FlagIcon,
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
      },
      {
        title: "Фоновые задачи",
        description: "Запуск задач планировщика",
        href: "/admin/jobs",
        icon: TimerResetIcon,
      },
    ],
  },
]

export function isActive(pathname: string | null, href: string) {
  if (!pathname) return false
  return href === "/admin" ? pathname === href : pathname.startsWith(href)
}
