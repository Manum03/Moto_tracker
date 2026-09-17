import { NotificationPayload } from "./types";

export interface NotificationProvider {
  send(payload: NotificationPayload): Promise<void>;
}
