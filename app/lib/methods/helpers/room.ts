import dayjs from '../../dayjs';
import { themes } from '../../constants/colors';
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

export const formatDateAccessibility = (date: string | Date): string =>
	dayjs(date).calendar(null, {
		lastDay: `[${I18n.t('Last_updated')}] [${I18n.t('Yesterday')}]`,
		sameDay: `[${I18n.t('Last_updated_at')}] LT`,
		lastWeek: `[${I18n.t('Last_updated_on')}] dddd`,
		sameElse: `[${I18n.t('Last_updated_on')}] MMMM, Do YYYY`
	});

export const formatDate = (date: string | Date): string =>
	dayjs(date).calendar(null, {
		lastDay: `[${I18n.t('Yesterday')}]`,
		sameDay: 'LT',
		lastWeek: 'dddd',
		sameElse: 'L'
	});

export const formatDateThreads = (date: string | Date): string =>
	dayjs(date).calendar(null, {
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

export const isTeamRoom = ({ teamId, joined }: { teamId?: string; joined?: boolean }): boolean => (!!teamId && joined) ?? false;
