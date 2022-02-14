import Model from '@nozbe/watermelondb/Model';

export interface IPermission {
	_id: string;
	roles: string[];
	_updatedAt: Date | string;
}

export type TPermissionModel = IPermission & Model;
