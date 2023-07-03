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
	iconName
}: {
	loading: boolean;
	style: StyleProp<ViewStyle>;
	iconName: TIconsName;
}) => {
	const { theme, colors } = useTheme();
	return (
		<>
			<BlurView
				style={[style, styles.blurView]}
				blurType={theme === 'light' ? 'light' : 'dark'}
				blurAmount={10}
				reducedTransparencyFallbackColor='white'
			/>
			<View style={[style, styles.blurIndicator]}>
				{loading ? <RCActivityIndicator /> : <CustomIcon color={colors.buttonText} name={iconName} size={54} />}
			</View>
		</>
	);
};

export default BlurComponent;
