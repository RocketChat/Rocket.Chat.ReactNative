import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

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
	const { colors } = useTheme();

	return (
		<>
			<View style={[style, styles.blurView, { backgroundColor: colors.overlayColor }]} />
			<View style={[style, styles.blurIndicator]}>
				{loading ? <RCActivityIndicator size={54} /> : <CustomIcon color={colors.buttonText} name={iconName} size={54} />}
			</View>
		</>
	);
};

export default BlurComponent;
