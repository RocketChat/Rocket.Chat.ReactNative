import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { BlurView } from '@react-native-community/blur';

import styles from '../../styles';
import { useTheme } from '../../../../theme';
import RCActivityIndicator from '../../../ActivityIndicator';
import { CustomIcon, TIconsName } from '../../../CustomIcon';

const BlurComponent = ({
	loading = false,
	style = {},
	iconName,
	blurAmount = 2
}: {
	loading: boolean;
	style: StyleProp<ViewStyle>;
	iconName: TIconsName;
	blurAmount?: number;
}) => {
	const { colors } = useTheme();
	// const { theme, colors } = useTheme();

	return (
		<>
			<BlurView
				style={[style, styles.blurView]}
				blurType={'dark'}
				// blurType={theme === 'light' ? 'light' : 'dark'}
				blurAmount={blurAmount}
			/>
			<View style={[style, styles.blurIndicator]}>
				{loading ? <RCActivityIndicator size={54} /> : <CustomIcon color={colors.buttonText} name={iconName} size={54} />}
			</View>
		</>
	);
};

export default BlurComponent;
