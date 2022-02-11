import Model from '@nozbe/watermelondb/Model';

export interface IPermission {
	id: string;
	// TODO: waiting for rest api defs
	_id?: string;
	roles: string[];
	_updatedAt: Date;
}

export type TPermissionModel = IPermission & Model;
