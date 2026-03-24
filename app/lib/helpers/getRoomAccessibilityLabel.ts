import I18n from '../../i18n';
import { type TUserStatus } from '../../definitions';

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
		return I18n.t(statusCamelCase);
	}

	if (type === 'l') {
		return I18n.t('Omnichannel');
	}

	if (teamMain) {
		if (type === 'p') {
			return I18n.t('Private_team');
		}
		return I18n.t('Team');
	}

	if (type === 'discussion') {
		return I18n.t('Discussion');
	}

	if (type === 'c') {
		return I18n.t('Public_channel');
	}

	if (type === 'd' && isGroupChat) {
		return I18n.t('Message');
	}

	return I18n.t('Private_channel');
};

export default getRoomAccessibilityLabel;
