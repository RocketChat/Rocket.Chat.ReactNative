import React from 'react';

import { BaseButton } from './Buttons';
import { useRoomContext } from '../../../views/RoomView/context';
import { Gap } from './Gap';

export const CancelEdit = () => {
	const { editing, editCancel } = useRoomContext();

	if (!editing) {
		return null;
	}
	return (
		<>
			<BaseButton
				onPress={() => editCancel()}
				testID='message-composer-cancel-edit'
				accessibilityLabel='Cancel_editing'
				icon='close'
			/>
			<Gap />
		</>
	);
};
