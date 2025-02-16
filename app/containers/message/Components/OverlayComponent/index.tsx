import React from 'react';
import { type StyleProp, View, type ViewStyle } from 'react-native';

import styles from '../../styles';
import { useTheme } from '../../../../theme';
import RCActivityIndicator from '../../../ActivityIndicator';
import { CustomIcon, type TIconsName } from '../../../CustomIcon';

const OverlayComponent = ({
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
			<View style={[style, styles.blurView, { backgroundColor: colors.surfaceNeutral }]} />
			<View style={[style, styles.blurIndicator]}>
				{loading ? <RCActivityIndicator size={54} /> : <CustomIcon name={iconName} size={54} />}
			</View>
		</>
	);
};

export default OverlayComponent;
