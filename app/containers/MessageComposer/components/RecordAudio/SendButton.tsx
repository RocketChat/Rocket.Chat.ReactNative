import { View } from 'react-native';
import React, { ReactElement } from 'react';
import { BorderlessButton } from 'react-native-gesture-handler';

import { useTheme } from '../../../../theme';
import { useMessageComposerApi } from '../../context';
import { CustomIcon } from '../../../CustomIcon';
import { hitSlop } from '../Buttons';

export const SendButton = (): ReactElement => {
	const { colors } = useTheme();
	const { setRecordingAudio } = useMessageComposerApi();
	return (
		<BorderlessButton
			style={{
				alignItems: 'center',
				justifyContent: 'center',
				width: 32,
				height: 32,
				borderRadius: 16,
				backgroundColor: colors.buttonBackgroundPrimaryDefault
			}}
			onPress={() => setRecordingAudio(false)}
			testID={'tbd'}
			hitSlop={hitSlop}
		>
			<View accessible accessibilityLabel={'tbd'} accessibilityRole='button'>
				<CustomIcon name={'arrow-right'} size={24} color={colors.fontWhite} />
			</View>
		</BorderlessButton>
	);
};
