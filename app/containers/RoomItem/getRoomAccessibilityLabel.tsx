import { TUserStatus } from '../../definitions';

interface IGetAccessibilityRoomLabel {
	userId?: string;
	type?: string;
	isGroupChat?: boolean;
	teamMain?: boolean;
	status?: TUserStatus;
}

const getRoomAccessibilityLabel = ({ type, userId, isGroupChat, status, teamMain }: IGetAccessibilityRoomLabel) => {
	if (type === 'd' && !isGroupChat && userId) return status;

	if (type === 'l') return 'Omnichannel';

	if (teamMain) return `teams${type === 'p' ? '-private' : ''}`;

	if (type === 'discussion') return 'Discussion';

	if (type === 'c') return 'channel-public';

	if (type === 'd' && isGroupChat) return 'discussion';

	return 'channel-private';
};

export default getRoomAccessibilityLabel;
