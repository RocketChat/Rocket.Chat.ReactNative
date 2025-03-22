import { IRole } from '../../IRole';
import { RocketChatRecordDeleted } from '../../IRocketChatRecord';
import { IUser } from '../../IUser';

type RoleCreateProps = Pick<IRole, 'name'> & Partial<Pick<IRole, 'description' | 'scope' | 'mandatory2fa'>>;

type RoleUpdateProps = { roleId: IRole['_id']; name: IRole['name'] } & Partial<RoleCreateProps>;

type RoleDeleteProps = { roleId: IRole['_id'] };

type RoleAddUserToRoleProps = {
	username: string;
	roleName: string;
	roomId?: string;
};

type RoleRemoveUserFromRoleProps = {
	username: string;
	roleName: string;
	roomId?: string;
	scope?: string;
};

type RoleSyncProps = {
	updatedSince?: string;
};

export type RolesEndpoints = {
	'roles.list': {
		GET: () => {
			roles: IRole[];
		};
	};
	'roles.sync': {
		GET: (params: RoleSyncProps) => {
			roles: {
				update: IRole[];
				remove: RocketChatRecordDeleted<IRole>[];
			};
		};
	};
	'roles.create': {
		POST: (params: RoleCreateProps) => {
			role: IRole;
		};
	};

	'roles.addUserToRole': {
		POST: (params: RoleAddUserToRoleProps) => {
			role: IRole;
		};
	};

	'roles.getUsersInRole': {
		GET: (params: { roomId: string; role: string; offset: number; count: number }) => {
			users: IUser[];
			total: number;
		};
	};

	'roles.update': {
		POST: (role: RoleUpdateProps) => {
			role: IRole;
		};
	};

	'roles.delete': {
		POST: (prop: RoleDeleteProps) => void;
	};

	'roles.removeUserFromRole': {
		POST: (props: RoleRemoveUserFromRoleProps) => {
			role: IRole;
		};
	};
};
