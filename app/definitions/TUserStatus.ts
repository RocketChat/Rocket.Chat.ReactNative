export const STATUSES = ['offline', 'online', 'away', 'busy'] as const;

export type TUserStatus = typeof STATUSES[number];
