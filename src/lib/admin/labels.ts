import type {
  AdminJob,
  AuditAction,
  CaseStatus,
  ComplaintResolution,
  ComplaintStatus,
  ComplaintTargetType,
  HelpApplicationStatus,
  NeedStatus,
} from "@/lib/api/admin-types"
import type { RoleCode, UserStatus } from "@/lib/api/types"

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  PENDING_VERIFICATION: "Ожидает подтверждения",
  ACTIVE: "Активен",
  SUSPENDED: "Приостановлен",
  BLOCKED: "Заблокирован",
  DELETED: "Удалён",
}

export const ROLE_LABELS: Record<RoleCode, string> = {
  USER: "Пользователь",
  MODERATOR: "Модератор",
  ADMIN: "Администратор",
}

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  PENDING_REVIEW: "На рассмотрении",
  OPEN: "Открыто",
  REJECTED: "Отклонено",
  CLOSED: "Закрыто",
}

export const ANIMAL_SEX_LABELS: Record<string, string> = {
  MALE: "Мальчик",
  FEMALE: "Девочка",
  UNKNOWN: "Не известен",
}

export const NEED_PRIORITY_LABELS: Record<string, string> = {
  LOW: "Низкий",
  MEDIUM: "Средний",
  HIGH: "Высокий",
}

export const ANIMAL_TYPE_LABELS: Record<string, string> = {
  CAT: "Кошка",
  DOG: "Собака",
}

export const HELP_APPLICATION_STATUS_LABELS: Record<HelpApplicationStatus, string> = {
  PENDING: "На рассмотрении",
  ACCEPTED: "Принят",
  CANCELLED: "Отменён",
}

export const NEED_STATUS_LABELS: Record<NeedStatus, string> = {
  OPEN: "Открыта",
  ASSIGNED: "Назначена",
  CLOSED: "Закрыта",
}

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  USER_REGISTERED: "Регистрация",
  USER_LOGIN: "Вход",
  USER_PASSWORD_CHANGED: "Смена пароля",
  USER_OTP_CONFIRMED: "Подтверждение кода",
  USER_PASSWORD_RESET: "Сброс пароля",
  USER_EMAIL_CHANGED: "Смена email",
  USER_PROFILE_UPDATED: "Изменение профиля",
  USER_DELETED: "Удаление аккаунта",
  USER_MFA_SETUP_STARTED: "Начало настройки MFA",
  USER_MFA_LOGIN: "Вход с MFA",
  USER_ROLE_GRANTED: "Выдача роли",
  USER_ROLE_REVOKED: "Снятие роли",
  USER_BLOCKED: "Блокировка",
  USER_UNBLOCKED: "Разблокировка",
  CASE_CREATED: "Создание объявления",
  CASE_CLOSED: "Закрытие объявления",
  CASE_APPROVED: "Одобрение объявления",
  CASE_REJECTED: "Отклонение объявления",
  CASE_CLOSED_BY_MODERATOR: "Закрытие объявления модератором",
  CASE_DELETED: "Удаление объявления",
  HELP_APPLICATION_CREATED: "Отклик",
  CONVERSATION_REQUESTED: "Запрос чата",
  CONVERSATION_ACCEPTED: "Чат принят",
  CONVERSATION_DECLINED: "Чат отклонён",
  CONVERSATION_CLOSED: "Чат закрыт",
  CONVERSATION_REOPENED: "Чат открыт заново",
  COMPLAINT_TAKEN: "Жалоба взята в работу",
  COMPLAINT_REJECTED: "Жалоба отклонена",
  COMPLAINT_WARNING_SENT: "Предупреждение по жалобе",
  COMPLAINT_CASE_CLOSED: "Объявление закрыто по жалобе",
  COMPLAINT_TARGET_CLOSED: "Закрытие объекта по жалобе",
  COMPLAINT_TARGET_VIEWED: "Просмотр объекта жалобы",
  USER_LOCALE_UPDATED: "Смена языка",
  USER_NOTIFICATION_PREFERENCE_UPDATE: "Изменение настроек уведомлений",
  USER_UPLOAD_AVATAR: "Загрузка аватара",
  USER_DELETE_AVATAR: "Удаление аватара",
  USER_EMAIL_CHANGED_REQUEST: "Запрос смены email",
  USER_LOGOUT: "Выход из аккаунта",
  USER_FORGOT_PASSWORD: "Запрос восстановления пароля",
}

export const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, string> = {
  NEW: "Новая",
  IN_PROGRESS: "В работе",
  REJECTED: "Отклонена",
  RESOLVED: "Рассмотрена",
}

export const COMPLAINT_TARGET_LABELS: Record<ComplaintTargetType, string> = {
  CASE: "Объявление",
  USER: "Пользователь",
  CONVERSATION: "Чат",
}

export const COMPLAINT_RESOLUTION_LABELS: Record<ComplaintResolution, string> = {
  WARNING_SENT: "Отправлено предупреждение",
  CASE_CLOSED: "Объявление закрыто",
  CASE_DELETED: "Объявление удалено",
  CHAT_CLOSED: "Чат закрыт",
}

export const ADMIN_JOB_INFO: Record<AdminJob, { title: string; description: string }> = {
  NOTIFICATION_CLEANUP: {
    title: "Очистка уведомлений",
    description: "Удаляет обработанные доставки и уведомления во входящих старше срока хранения.",
  },
  AUDIT_PARTITIONS: {
    title: "Партиции журнала аудита",
    description: "Создаёт недостающие партиции журнала аудита на 3 месяца вперёд.",
  },
  NOTIFICATION_TEMPLATES_REFRESH: {
    title: "Перезагрузка шаблонов уведомлений",
    description: "Заново загружает шаблоны уведомлений и сбрасывает кэш их отрисовки.",
  },
  COMPLAINT_SNAPSHOT_CLEANUP: {
    title: "Очистить снимки переписки",
    description:
      "Удаляет снимки переписки рассмотренных жалоб на чат старше 3 дней. По расписанию запускается раз в час.",
  },
}
