import { View, Text } from 'react-native';
import React, { ReactElement } from 'react';

import { useTheme } from '../../../../theme';
import { BaseButton } from '../Buttons';
import { CustomIcon } from '../../../CustomIcon';
import sharedStyles from '../../../../views/Styles';
import { SendButton } from './SendButton';

export const RecordAudio = (): ReactElement => {
	const { colors } = useTheme();
	return (
		<View
			style={{
				borderTopWidth: 1,
				paddingHorizontal: 16,
				backgroundColor: colors.surfaceLight,
				borderTopColor: colors.strokeLight
			}}
		>
			<View style={{ flexDirection: 'row', paddingVertical: 24, justifyContent: 'center', alignItems: 'center' }}>
				<CustomIcon name='microphone' size={24} color={colors.fontDanger} />
				<Text style={{ marginLeft: 12, fontSize: 16, ...sharedStyles.textRegular, color: colors.fontDefault }}>00:01</Text>
			</View>
			<View style={{ flexDirection: 'row' }}>
				<BaseButton onPress={() => alert('tbd')} testID='message-composer-delete-audio' accessibilityLabel='tbd' icon='delete' />
				<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
					<Text style={{ fontSize: 14, ...sharedStyles.textRegular, color: colors.fontSecondaryInfo }}>
						Recording audio message
					</Text>
				</View>
				<SendButton />
			</View>
		</View>
	);
};
