export const STATUSES = ['offline', 'online', 'away', 'busy', 'disabled', 'loading'] as const;

export type TUserStatus = (typeof STATUSES)[number];
