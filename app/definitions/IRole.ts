import Model from '@nozbe/watermelondb/Model';

export interface IRole {
	id: string;
	description?: string;
}

export type TRoleModel = IRole & Model;
