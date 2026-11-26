import { type TUserStatus } from '~/definitions/TUserStatus';
import { hasIcon, type TIconsName } from '~/containers/CustomIcon';

export const getStatusIconName = (status: TUserStatus): TIconsName => {
	const name = `status-${status}`;
	return hasIcon(name) ? (name as TIconsName) : 'status-offline';
};
