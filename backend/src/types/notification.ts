export const NOTIFICATION_KINDS = ["reply", "follow_up", "conversion"] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];
