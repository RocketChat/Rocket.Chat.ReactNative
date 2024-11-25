import moment from 'moment';

import { themes } from '../../constants';
import I18n from '../../../i18n';
import { IAttachment, SubscriptionType, TSubscriptionModel } from '../../../definitions';
import { TSupportedThemes } from '../../../theme';

export const isBlocked = (room: TSubscriptionModel): boolean => {
	if (room) {
		const { t, blocked, blocker } = room;
		if (t === SubscriptionType.DIRECT && (blocked || blocker)) {
			return true;
		}
	}
	return false;
};

export const capitalize = (s: string): string => {
	if (typeof s !== 'string') {
		return '';
	}
	return s.charAt(0).toUpperCase() + s.slice(1);
};

export const formatDate = (date: string | Date): string =>
	moment(date).calendar(null, {
		lastDay: `[${I18n.t('Yesterday')}]`,
		sameDay: 'LT',
		lastWeek: 'dddd',
		sameElse: 'L'
	});

export const formatDateThreads = (date: string | Date): string =>
	moment(date).calendar(null, {
		sameDay: 'LT',
		lastDay: `[${I18n.t('Yesterday')}] LT`,
		lastWeek: 'dddd LT',
		sameElse: 'LL'
	});

export const getBadgeColor = ({
	subscription,
	messageId,
	theme
}: {
	// TODO: Refactor when migrate model folder
	subscription: any;
	messageId: string;
	theme: TSupportedThemes;
}): string | undefined => {
	if (subscription?.tunreadUser?.includes(messageId)) {
		return themes[theme].badgeBackgroundLevel4;
	}
	if (subscription?.tunreadGroup?.includes(messageId)) {
		return themes[theme].badgeBackgroundLevel3;
	}
	if (subscription?.tunread?.includes(messageId)) {
		return themes[theme].fontInfo;
	}
};

export const makeThreadName = (messageRecord: { id?: string; msg?: string; attachments?: IAttachment[] }): string | undefined =>
	messageRecord.msg || messageRecord?.attachments?.[0]?.title;

export const isDirectRoom = ({ t }: { t?: TSubscriptionModel['t'] }) => t === SubscriptionType.DIRECT;

export const isMultipleDirectRoom = ({ t, uids }: { t?: TSubscriptionModel['t']; uids?: TSubscriptionModel['uids'] }) =>
	isDirectRoom({ t }) && (uids?.length ?? 0) > 2;

export const isPublicRoom = ({ t }: { t?: TSubscriptionModel['t'] }) => t === SubscriptionType.CHANNEL;

export const isPrivateRoom = ({ t }: { t?: TSubscriptionModel['t'] }) => t === SubscriptionType.GROUP;

export const isTeamRoom = ({ teamId, joined }: { teamId?: string; joined?: boolean }): boolean => (!!teamId && joined) ?? false;

export const isPublicTeamRoom = ({
	teamId,
	joined,
	t
}: {
	teamId?: string;
	joined?: boolean;
	t?: TSubscriptionModel['t'];
}): boolean => isTeamRoom({ teamId, joined }) && isPublicRoom({ t });

export const isPrivateTeamRoom = ({
	teamId,
	joined,
	t
}: {
	teamId?: string;
	joined?: boolean;
	t?: TSubscriptionModel['t'];
}): boolean => isTeamRoom({ teamId, joined }) && isPrivateRoom({ t });

export const isDiscussion = ({ prid }: { prid?: TSubscriptionModel['prid'] }) => !!prid;

export const isPublicDiscussion = ({ prid, t }: { prid?: TSubscriptionModel['prid']; t?: TSubscriptionModel['t'] }) =>
	isDiscussion({ prid }) && isPublicRoom({ t });

export const isPrivateDiscussion = ({ prid, t }: { prid?: TSubscriptionModel['prid']; t?: TSubscriptionModel['t'] }) =>
	isDiscussion({ prid }) && isPrivateRoom({ t });

export const isOmnichannelRoom = ({ t }: { t?: TSubscriptionModel['t'] }) => t === SubscriptionType.OMNICHANNEL;
