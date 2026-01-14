import type { RolesEndpoints as RestTypingsRolesEndpoints } from '@rocket.chat/rest-typings';

import { type IRole as ILocalIRole } from '../../IRole';
import { type IRoleUser as ILocalIRoleUser } from '../../IUser';

type RemoveV1Prefix<T> = T extends `/v1/${infer Rest}` ? Rest : T;

type AdaptRolesEndpoints<T> = {
	[K in keyof T as RemoveV1Prefix<K & string>]: T[K];
};

type RoleCreateProps = Pick<ILocalIRole, 'name'> & Partial<Pick<ILocalIRole, 'description' | 'scope' | 'mandatory2fa'>>;

type RoleUpdateProps = { roleId: ILocalIRole['_id']; name: ILocalIRole['name'] } & Partial<RoleCreateProps>;

export type RolesEndpoints = AdaptRolesEndpoints<RestTypingsRolesEndpoints> & {
	'roles.create': {
		POST: (params: RoleCreateProps) => {
			role: ILocalIRole;
		};
	};
	'roles.update': {
		POST: (role: RoleUpdateProps) => {
			role: ILocalIRole;
		};
	};
	'roles.getUsersInPublicRoles': {
		GET: () => {
			users: ILocalIRoleUser[];
			success: boolean;
		};
	};
};
