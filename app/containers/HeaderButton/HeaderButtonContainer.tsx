import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

import { isAndroid, isTablet } from '../../lib/methods/helpers';

interface IHeaderButtonContainer {
	children?: React.ReactElement | (React.ReactElement | null)[] | null;
	left?: boolean;
	onLayout?: ViewProps['onLayout'];
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

const Container = ({ children, left = false, onLayout }: IHeaderButtonContainer): React.ReactElement => (
	<View style={[styles.container, left ? styles.left : styles.right]} onLayout={onLayout || undefined}>
		{children}
	</View>
);

Container.displayName = 'HeaderButton.Container';

export default Container;
