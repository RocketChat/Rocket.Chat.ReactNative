import dayjs from '../../dayjs';
import I18n from '../../../i18n';

export const formatStatusExpiry = (statusExpiresAt: string | undefined): string | undefined => {
	if (!statusExpiresAt) {
		return undefined;
	}

	const now = dayjs();
	const expiresAt = dayjs(statusExpiresAt);
	if (!expiresAt.isValid() || !expiresAt.isAfter(now)) {
		return undefined;
	}

	if (expiresAt.isSame(now, 'day')) {
		return I18n.t('Until', { time: expiresAt.format('h:mm A') });
	}

	return I18n.t('Until', { time: expiresAt.format('MMM D, h:mm A') });
};
