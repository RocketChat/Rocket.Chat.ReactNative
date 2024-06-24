import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

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
		marginLeft: 0
	},
	right: {
		marginRight: 0
	}
});

const Container = ({ children, left = false, onLayout }: IHeaderButtonContainer): React.ReactElement => (
	<View style={[styles.container, left ? styles.left : styles.right]} onLayout={onLayout || undefined}>
		{children}
	</View>
);

Container.displayName = 'HeaderButton.Container';

export default Container;
