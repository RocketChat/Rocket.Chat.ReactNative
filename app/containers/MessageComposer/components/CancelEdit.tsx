import React from 'react';

import { BaseButton } from './Buttons';
import { useRoomContext } from '../../../views/RoomView/context';
import { Gap } from './Gap';

export const CancelEdit = () => {
	const { action, editCancel } = useRoomContext();

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
