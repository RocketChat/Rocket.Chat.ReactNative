import { type ReactElement } from 'react';

import I18n from '../../../../i18n';
import { type ITakeOrJoinProps } from '../../definitions';
import { useRoomStore, useRoomWithUpdate } from '../../stores/RoomStoreContext';
import { FooterAction } from './FooterAction';

export const TakeOrJoin = ({ joinCodeRef }: ITakeOrJoinProps): ReactElement => {
	const room = useRoomWithUpdate();
	const joinRoom = useRoomStore(s => s.joinRoom);

	const onPressJoin = (): Promise<void> => joinRoom(() => joinCodeRef.current?.show());

	return (
		<FooterAction
			testID='room-view-join'
			title={I18n.t('You_are_in_preview_mode')}
			buttonTestID='room-view-join-button'
			buttonLabel={I18n.t(room.t === 'l' ? 'Take_it' : 'Join')}
			onPress={onPressJoin}
		/>
	);
};
