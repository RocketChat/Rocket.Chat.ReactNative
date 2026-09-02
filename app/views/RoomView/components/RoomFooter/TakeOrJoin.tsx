import I18n from '../../../../i18n';
import { type ITakeOrJoinProps } from '../../definitions';
import { useRoomStore, useRoomWithUpdate } from '../../../../lib/store/RoomStoreContext';
import { FooterAction } from './FooterAction';

export const TakeOrJoin = ({ joinCodeRef }: ITakeOrJoinProps) => {
	const room = useRoomWithUpdate();
	const joinRoom = useRoomStore(s => s.joinRoom);

	// The join-code modal lives on this screen, so the trigger is handed to joinRoom per call.
	const onPressJoin = () => joinRoom(() => joinCodeRef.current?.show());

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
