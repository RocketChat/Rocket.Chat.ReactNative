import Model from '@nozbe/watermelondb/Model';

export interface IPermission {
	id: string;
	roles: string[];
	_updatedAt: Date;
}

export type TPermissionModel = IPermission & Model;
