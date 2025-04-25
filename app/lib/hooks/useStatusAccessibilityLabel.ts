import getRoomAccessibilityLabel, { IGetAccessibilityRoomLabel } from '../helpers/getRoomAccessibilityLabel';
import { useAppSelector } from './useAppSelector';

interface IUseStatusAccessibiltyLabel extends IGetAccessibilityRoomLabel {
	roomUserId?: string | null;
	title?: string;
	subtitle?: string;
	parentTitle?: string;
	isGroupChat?: boolean;
	prid?: string;
	tmid?: string;
}

const useStatusAccessibilityLabel = ({
	roomUserId,
	isGroupChat,
	status,
	teamMain,
	type,
	prid,
	tmid,
	title,
	subtitle,
	parentTitle
}: IUseStatusAccessibiltyLabel) => {
	const statusState = useAppSelector(state => {
		if (state.settings.Presence_broadcast_disabled) {
			return 'disabled';
		}
		if (state.meteor.connected && roomUserId && state.activeUsers[roomUserId]) {
			return state.activeUsers[roomUserId].status;
		}
		if (!state.meteor.connected) {
			return 'offline';
		}
		return 'loading';
	});
	const iconOrStatusLabel = getRoomAccessibilityLabel({
		isGroupChat,
		status: status ?? statusState,
		teamMain,
		type: prid ? 'discussion' : type,
		userId: roomUserId
	});
	if (tmid) {
		return `${iconOrStatusLabel} ${title} ${parentTitle ?? ''}.`;
	}
	return `${iconOrStatusLabel} ${title} ${subtitle ?? ''}.`;
};

export default useStatusAccessibilityLabel;
