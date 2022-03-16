import Model from '@nozbe/watermelondb/Model';

export interface IRole {
	id: string;
	description?: string;
	mandatory2fa?: boolean;
	name: string;
	protected: boolean;
	// scope?: string;
	scope: 'Users' | 'Subscriptions';
	_id: string;
}

export type TRoleModel = IRole & Model;

// For rest/v1/ 'groups.roles' and 'channels.roles'
export interface IGetRoomRoles {
	_id: string;
	rid: string;
	u: {
		_id: string;
		username: string;
	};
	roles: string[];
}
