import { IRocketChatRecord } from './IRocketChatRecord';
import { IUser } from './IUser';
import { IServerRoom } from './IRoom';

export enum TEAM_TYPE {
	PUBLIC = 0,
	PRIVATE = 1
}

export type SortType = -1 | 1;

export interface ITeam extends IRocketChatRecord {
	name: string;
	type: TEAM_TYPE;
	roomId: string;
	createdBy: Pick<IUser, '_id' | 'username'>;
	createdAt: Date;
}

export interface ITeamMember extends IRocketChatRecord {
	teamId: string;
	userId: string;
	roles?: Array<string>;
	createdBy: Pick<IUser, '_id' | 'username'>;
	createdAt: Date;
}
export interface IPaginationOptions {
	offset: number;
	count: number;
}
export interface IRecordsWithTotal<T> {
	records: Array<T>;
	total: number;
}

export interface ITeamStatData {
	teamId: string;
	mainRoom: string;
	totalRooms: number;
	totalMessages: number;
	totalPublicRooms: number;
	totalPrivateRooms: number;
	totalDefaultRooms: number;
	totalMembers: number;
}
export interface ITeamStats {
	totalTeams: number;
	teamStats: Array<ITeamStatData>;
}

export interface IServerTeamUpdateRoom
	extends Omit<
		IServerRoom,
		'topic' | 'joinCodeRequired' | 'description' | 'jitsiTimeout' | 'usersCount' | 'e2eKeyId' | 'avatarETag'
	> {
	teamId: string;
	teamDefault: boolean;
}
