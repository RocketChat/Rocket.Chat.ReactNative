import { type IPermission } from '~/definitions/IPermission';

type PermissionsUpdateProps = { permissions: { _id: string; roles: string[] }[] };

export type PermissionsEndpoints = {
	'permissions.listAll': {
		GET: (params: { updatedSince?: string }) => {
			update: IPermission[];
			remove: IPermission[];
		};
	};
	'permissions.update': {
		POST: (params: PermissionsUpdateProps) => {
			permissions: IPermission[];
		};
	};
};
