import React from 'react';
import { StyleSheet, View } from 'react-native';

interface IHeaderButtonContainer {
	children?: React.ReactElement | (React.ReactElement | null)[] | null;
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

const Container = ({ children, left = false }: IHeaderButtonContainer): React.ReactElement => (
	<View style={[styles.container, left ? styles.left : styles.right]}>{children}</View>
);

Container.displayName = 'HeaderButton.Container';

export default Container;
