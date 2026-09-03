import { BaseButton } from './Buttons';
import { useEditCancel } from '../../../views/RoomView/stores/ComposerStore';
import { useMessageActionKind } from '../../message/stores/MessageActionStore';
import { Gap } from './Gap';

export const CancelEdit = () => {
	const editCancel = useEditCancel();
	const actionKind = useMessageActionKind();

	if (actionKind !== 'edit') {
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
