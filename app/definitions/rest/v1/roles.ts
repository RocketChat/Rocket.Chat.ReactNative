import type { RolesEndpoints as RestTypingsRolesEndpoints } from '@rocket.chat/rest-typings';

import type { AdaptEndpoints } from '../adaptEndpoints';
import { type IRole as ILocalIRole } from '../../IRole';
import { type IRoleUser as ILocalIRoleUser } from '../../IUser';

type RoleCreateProps = Pick<ILocalIRole, 'name'> & Partial<Pick<ILocalIRole, 'description' | 'scope' | 'mandatory2fa'>>;

type RoleUpdateProps = { roleId: ILocalIRole['_id']; name: ILocalIRole['name'] } & Partial<RoleCreateProps>;

export type RolesEndpoints = AdaptEndpoints<RestTypingsRolesEndpoints> & {
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
