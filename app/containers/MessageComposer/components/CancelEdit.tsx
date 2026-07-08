import { BaseButton } from './Buttons';
import { useRoomContext } from '../../../views/RoomView/context';
import { useMessageAction } from '../../../views/RoomView/MessageActionStore';
import { Gap } from './Gap';

export const CancelEdit = () => {
	'use memo';

	const { editCancel } = useRoomContext();
	const action = useMessageAction();

	if (action !== 'edit') {
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
