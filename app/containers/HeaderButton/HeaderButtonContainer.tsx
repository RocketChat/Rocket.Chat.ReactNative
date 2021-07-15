import React from 'react';
import { View, StyleSheet } from 'react-native';

interface IHeaderButtonContainer {
	children: JSX.Element;
	left?: boolean;
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center'
	},
	left: {
		marginLeft: 5
	},
	right: {
		marginRight: 5
	}
});

const Container = ({ children, left }: IHeaderButtonContainer) => (
	<View style={[styles.container, left ? styles.left : styles.right]}>
		{children}
	</View>
);

Container.displayName = 'HeaderButton.Container';

export default Container;
