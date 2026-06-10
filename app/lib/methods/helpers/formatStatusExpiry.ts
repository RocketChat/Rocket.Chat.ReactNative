import dayjs from '../../dayjs';
import I18n from '../../../i18n';

export const formatStatusExpiry = (statusExpiresAt: string): string | undefined => {
	const now = dayjs();
	const expiresAt = dayjs(statusExpiresAt);
	if (!expiresAt.isValid() || !expiresAt.isAfter(now)) {
		return undefined;
	}

	if (expiresAt.isSame(now, 'day')) {
		return `${I18n.t('Until')} ${expiresAt.format('h:mm A')}`;
	}

	return `${I18n.t('Until')} ${expiresAt.format('MMM D, h:mm A')}`;
};
