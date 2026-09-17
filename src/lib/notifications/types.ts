export type NotificationLevel = "yellow" | "red";

export interface NotificationPayload {
  title: string;
  body: string;
  level: NotificationLevel;
  meta?: Record<string, unknown>;
}
