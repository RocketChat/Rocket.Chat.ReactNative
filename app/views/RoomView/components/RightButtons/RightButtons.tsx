import { type ReactElement } from 'react';

import { HeaderActions } from '~/lib/methods/helpers/navigation/headerActions';
import { type RoomStore } from '~/views/RoomView/definitions';
import { RoomHeaderActions } from '~/views/RoomView/components/RoomViewHeader/RoomHeaderActions';

interface IRightButtonsProps {
	rid?: string;
	tmid?: string;
	roomStore: RoomStore;
}

const RightButtons = ({ rid, tmid, roomStore }: IRightButtonsProps): ReactElement => (
	<RoomHeaderActions rid={rid} tmid={tmid} roomStore={roomStore} ActionsRenderer={HeaderActions} />
);

export default RightButtons;
