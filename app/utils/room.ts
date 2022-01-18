import moment from 'moment';

import { themes } from '../constants/colors';
import I18n from '../i18n';
import { IAttachment } from '../definitions/IAttachment';
import { ISubscription, SubscriptionType } from '../definitions/ISubscription';

export const isBlocked = (room: ISubscription): boolean => {
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

export const formatDate = (date: Date): string =>
	moment(date).calendar(null, {
		lastDay: `[${I18n.t('Yesterday')}]`,
		sameDay: 'LT',
		lastWeek: 'dddd',
		sameElse: 'L'
	});

export const formatDateThreads = (date: Date): string =>
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
	theme: string;
}): string | undefined => {
	if (subscription?.tunreadUser?.includes(messageId)) {
		return themes[theme].mentionMeColor;
	}
	if (subscription?.tunreadGroup?.includes(messageId)) {
		return themes[theme].mentionGroupColor;
	}
	if (subscription?.tunread?.includes(messageId)) {
		return themes[theme].tunreadColor;
	}
};

export const makeThreadName = (messageRecord: { id?: string; msg?: string; attachments?: IAttachment[] }): string | undefined =>
	messageRecord.msg || messageRecord?.attachments?.[0]?.title;

export const isTeamRoom = ({ teamId, joined }: { teamId: string; joined: boolean }): boolean => !!teamId && joined;
