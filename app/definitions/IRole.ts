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
