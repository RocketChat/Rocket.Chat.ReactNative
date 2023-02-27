export const STATUSES = ['offline', 'online', 'away', 'busy', 'disabled'] as const;

export type TUserStatus = typeof STATUSES[number];
