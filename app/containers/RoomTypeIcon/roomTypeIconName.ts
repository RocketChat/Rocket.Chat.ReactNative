import { OmnichannelSourceType, type IOmnichannelSource, type ISubscription } from '~/definitions';
import { type TIconsName } from '../CustomIcon';

const omnichannelSourceIcons: Record<string, TIconsName> = {
	widget: 'livechat-monochromatic',
	email: 'mail',
	sms: 'sms',
	app: 'omnichannel',
	api: 'omnichannel',
	other: 'omnichannel'
};

export const getOmnichannelIconName = (sourceType?: IOmnichannelSource): TIconsName =>
	omnichannelSourceIcons[sourceType?.type || 'other'] ?? 'omnichannel';

export const getOmnichannelSidebarIconUri = (server: string, sourceType?: IOmnichannelSource) =>
	sourceType?.type === OmnichannelSourceType.APP && sourceType.id && sourceType.sidebarIcon
		? `${server}/api/apps/public/${sourceType.id}/get-sidebar-icon?icon=${sourceType.sidebarIcon}`
		: undefined;

interface IRoomTypeIconName {
	type?: string;
	teamMain?: boolean;
	isDiscussion?: boolean;
	isGroupChat?: boolean;
	abacAttributes?: ISubscription['abacAttributes'];
}

export const getRoomTypeIconName = ({
	type,
	teamMain,
	isDiscussion,
	isGroupChat,
	abacAttributes
}: IRoomTypeIconName): TIconsName => {
	if (abacAttributes?.length) {
		return teamMain ? 'team-shield' : 'hash-shield';
	}
	if (teamMain) {
		return type === 'p' ? 'teams-private' : 'teams';
	}
	if (isDiscussion) {
		return 'discussions';
	}
	if (type === 'c') {
		return 'channel-public';
	}
	if (type === 'd' && isGroupChat) {
		return 'message';
	}
	return 'channel-private';
};
