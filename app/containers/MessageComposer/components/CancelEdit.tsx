import { BaseButton } from './Buttons';
import { useRoomContext } from '../../../views/RoomView/context';
import { useMessageAction } from '../../message/stores/MessageActionStore';
import { Gap } from './Gap';

export const CancelEdit = () => {
	const { editCancel } = useRoomContext();
	const action = useMessageAction();

	if (action?.kind !== 'edit') {
		return null;
	}
	return (
		<>
			<BaseButton
				onPress={() => editCancel?.()}
				testID='message-composer-cancel-edit'
				accessibilityLabel='Cancel_editing'
				icon='close'
			/>
			<Gap />
		</>
	);
};
