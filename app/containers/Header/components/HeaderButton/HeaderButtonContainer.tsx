import React from 'react';
import { Platform, type StyleProp, StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';

import { isAndroid, isIOS, isTablet } from '../../../../lib/methods/helpers/deviceInfo';

interface IHeaderButtonContainer {
	children?: React.ReactElement | (React.ReactElement | null)[] | null;
	left?: boolean;
	onLayout?: ViewProps['onLayout'];
	style?: StyleProp<ViewStyle>;
}

const getMargin = () => {
	if (isTablet) {
		return 5;
	}
	if (isIOS && Number(Platform.Version) >= 26) {
		return 0;
	}
	return -5;
};

const margin = getMargin();

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center'
	},
	left: {
		marginLeft: margin,
		marginRight: isAndroid ? 5 : 0
	},
	right: {
		marginRight: margin
	}
});

const Container = ({ children, left = false, onLayout, style = {} }: IHeaderButtonContainer): React.ReactElement => (
	<View style={[styles.container, left ? styles.left : styles.right, style]} onLayout={onLayout || undefined}>
		{children}
	</View>
);

Container.displayName = 'HeaderButton.Container';

export default Container;
