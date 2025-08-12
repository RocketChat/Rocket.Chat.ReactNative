import i18n from '../../i18n';
import { TUserStatus } from '../../definitions';

export interface IGetAccessibilityRoomLabel {
	userId?: string | null;
	type?: string;
	isGroupChat?: boolean;
	teamMain?: boolean;
	status?: TUserStatus;
}

const getRoomAccessibilityLabel = ({ type, userId, isGroupChat, status, teamMain }: IGetAccessibilityRoomLabel) => {
	if (type === 'd' && !isGroupChat && userId && status) {
		const statusCamelCase = `${status[0].toUpperCase()}${status.slice(1)}`;
		return i18n.t(statusCamelCase);
	}

	if (type === 'l') {
		return i18n.t('Omnichannel');
	}

	if (teamMain) {
		if (type === 'p') {
			return i18n.t('Private_team');
		}
		return i18n.t('Team');
	}

	if (type === 'discussion') {
		return i18n.t('Discussion');
	}

	if (type === 'c') {
		return i18n.t('Public_channel');
	}

	if (type === 'd' && isGroupChat) {
		return i18n.t('Message');
	}

	return i18n.t('Private_channel');
};

export default getRoomAccessibilityLabel;
