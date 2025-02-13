import React from 'react';
import { StyleProp, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';

import { isAndroid, isTablet } from '../../lib/methods/helpers';

interface IHeaderButtonContainer {
	children?: React.ReactElement | (React.ReactElement | null)[] | null;
	left?: boolean;
	onLayout?: ViewProps['onLayout'];
	style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center'
	},
	left: {
		marginLeft: isTablet ? 5 : -5,
		marginRight: isAndroid ? 25 : 0
	},
	right: {
		marginRight: isTablet ? 5 : -5
	}
});

const Container = ({ children, left = false, onLayout, style = {} }: IHeaderButtonContainer): React.ReactElement => (
	<View style={[styles.container, left ? styles.left : styles.right, style]} onLayout={onLayout || undefined}>
		{children}
	</View>
);

Container.displayName = 'HeaderButton.Container';

export default Container;
