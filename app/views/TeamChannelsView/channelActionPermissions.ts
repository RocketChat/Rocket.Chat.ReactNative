import { type TSubscriptionModel } from '~/definitions';
import { hasPermission } from '~/lib/methods/helpers';
import { type IItem } from './hooks/useTeamChannels';

interface IChannelActionRoles {
	edit: string[];
	remove: string[];
	deleteC: string[];
	deleteP: string[];
}

interface IChannelActionPermissions {
	canAutoJoin: boolean;
	canRemove: boolean;
	canDelete: boolean;
}

export const getChannelActionPermissions = async (
	item: IItem,
	team: TSubscriptionModel,
	roles: IChannelActionRoles
): Promise<IChannelActionPermissions> => {
	const [[canAutoJoin], [canRemove], [canDelete]] = await Promise.all([
		hasPermission([roles.edit], team.rid),
		hasPermission([roles.remove], team.rid),
		hasPermission([item.t === 'c' ? roles.deleteC : roles.deleteP], item._id)
	]);

	return { canAutoJoin, canRemove, canDelete };
};
