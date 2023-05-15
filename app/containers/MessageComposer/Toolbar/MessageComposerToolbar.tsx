import React, { memo } from 'react';
import { View } from 'react-native';

import { BaseButton } from './BaseButton';
import { MicOrSendButton } from './MicOrSendButton';

export const MessageComposerToolbar = memo(() => (
	<View
		style={{
			flex: 1,
			flexDirection: 'row',
			gap: 12,
			paddingHorizontal: 16,
			paddingVertical: 12
		}}
	>
		<BaseButton onPress={() => alert('tbd')} testID='messagebox-cancel-editing' accessibilityLabel='TBD' icon='add' />
		<BaseButton onPress={() => alert('tbd')} testID='messagebox-cancel-editing' accessibilityLabel='TBD' icon='emoji' />
		<BaseButton onPress={() => alert('tbd')} testID='messagebox-cancel-editing' accessibilityLabel='TBD' icon='add' />
		<BaseButton onPress={() => alert('tbd')} testID='messagebox-cancel-editing' accessibilityLabel='TBD' icon='add' />
		<View style={{ flex: 1 }} />
		<MicOrSendButton />
	</View>
));
