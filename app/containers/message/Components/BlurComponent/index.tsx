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
	showOverlay = false
}: {
	loading: boolean;
	style: StyleProp<ViewStyle>;
	iconName: TIconsName;
	showOverlay?: boolean;
}) => {
	const { colors } = useTheme();

	return (
		<>
			{!showOverlay ? (
				<BlurView style={[style, styles.blurView]} blurType={'dark'} blurAmount={2} />
			) : (
				<View style={[style, styles.blurView, { backgroundColor: colors.overlayColor }]} />
			)}
			<View style={[style, styles.blurIndicator]}>
				{loading ? <RCActivityIndicator size={54} /> : <CustomIcon color={colors.buttonText} name={iconName} size={54} />}
			</View>
		</>
	);
};

export default BlurComponent;
