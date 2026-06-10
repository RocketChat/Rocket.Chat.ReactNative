import dayjs from '../../dayjs';
import I18n from '../../../i18n';

export const formatStatusExpiry = (statusExpiresAt: string): string | undefined => {
	const expiresAt = dayjs(statusExpiresAt);
	if (!expiresAt.isValid() || !expiresAt.isAfter(dayjs())) {
		return undefined;
	}

	const now = dayjs();

	if (expiresAt.isSame(now, 'day')) {
		return `${I18n.t('Until')} ${expiresAt.format('h:mm A')}`;
	}

	return `${I18n.t('Until')} ${expiresAt.format('MMM D')}, ${expiresAt.format('h:mm A')}`;
};
