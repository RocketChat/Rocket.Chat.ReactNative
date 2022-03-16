export enum UserStatus {
	ONLINE = 'online',
	AWAY = 'away',
	OFFLINE = 'offline',
	BUSY = 'busy'
}

export const STATUSES: TUserStatus[] = ['offline', 'online', 'away', 'busy'];

export type TUserStatus = 'online' | 'away' | 'busy' | 'offline';
