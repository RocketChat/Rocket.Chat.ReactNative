import { type ReactElement } from 'react';

import I18n from '../../../../i18n';
import { useRoomStore } from '../../stores/RoomStoreContext';
import { FooterAction } from './FooterAction';

export const OnHold = (): ReactElement => {
	const resumeRoom = useRoomStore(s => s.resumeRoom);

	return (
		<FooterAction
			testID='room-view-chat-on-hold'
			title={I18n.t('Chat_is_on_hold')}
			buttonTestID='room-view-chat-on-hold-button'
			buttonLabel={I18n.t('Resume')}
			onPress={resumeRoom}
		/>
	);
};
