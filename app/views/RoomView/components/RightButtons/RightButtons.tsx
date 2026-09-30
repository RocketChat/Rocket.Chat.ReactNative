import { type ReactElement } from 'react';

import { HeaderActions } from '~/lib/methods/helpers/navigation/headerActions';
import { type RoomStore } from '~/views/RoomView/definitions';
import { useRoomHeaderActions } from '~/views/RoomView/hooks/useRoomHeaderActions';

interface IRightButtonsProps {
	rid?: string;
	tmid?: string;
	roomStore: RoomStore;
}

const RightButtons = ({ rid, tmid, roomStore }: IRightButtonsProps): ReactElement | null => {
	const actions = useRoomHeaderActions(rid, tmid, roomStore);
	return <HeaderActions actions={actions} />;
};

export default RightButtons;
