import { BaseButton } from './Buttons';
import { useEditCancel } from '../../../views/RoomView/stores/ComposerStore';
import { useMessageAction } from '../../message/stores/MessageActionStore';
import { Gap } from './Gap';

export const CancelEdit = () => {
	'use memo';

	const editCancel = useEditCancel();
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
