import type {
  AdminJob,
  AuditAction,
  CaseStatus,
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
  CASE_CREATED: "Создание объявления",
  CASE_CLOSED: "Закрытие объявления",
  CASE_APPROVED: "Одобрение объявления",
  CASE_REJECTED: "Отклонение объявления",
  HELP_APPLICATION_CREATED: "Отклик",
  CONVERSATION_REQUESTED: "Запрос чата",
  CONVERSATION_ACCEPTED: "Чат принят",
  CONVERSATION_DECLINED: "Чат отклонён",
  CONVERSATION_CLOSED: "Чат закрыт",
  CONVERSATION_REOPENED: "Чат открыт заново",
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
}
