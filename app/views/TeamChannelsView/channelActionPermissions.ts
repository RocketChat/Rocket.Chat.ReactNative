import { type TSubscriptionModel } from '../../definitions';
import { hasPermission } from '../../lib/methods/helpers';
import { type IItem } from './useTeamChannels';

interface IChannelActionPerms {
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
	perms: IChannelActionPerms
): Promise<IChannelActionPermissions> => {
	const [editResult, removeResult, deleteResult] = await Promise.all([
		hasPermission([perms.edit], team.rid),
		hasPermission([perms.remove], team.rid),
		hasPermission([item.t === 'c' ? perms.deleteC : perms.deleteP], item._id)
	]);

	return {
		canAutoJoin: editResult[0],
		canRemove: removeResult[0],
		canDelete: deleteResult[0]
	};
};
