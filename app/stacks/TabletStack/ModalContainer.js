import React from 'react';
import { TouchableWithoutFeedback, View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

const styles = StyleSheet.create({
	root: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#00000030',
	},
	backdrop: {
		...StyleSheet.absoluteFill
	},
	modal: {
		width: 600,
		height: 480,
		alignSelf: 'center',
		overflow: 'hidden',
		borderRadius: 10
	}
});

export const ModalContainer = ({ navigation, children }) => (
	<View style={styles.root}>
		<TouchableWithoutFeedback onPress={() => navigation.pop()}>
			<View style={styles.backdrop} />
		</TouchableWithoutFeedback>
		<View style={styles.modal}>
			{children}
		</View>
	</View>
);

ModalContainer.propTypes = {
	navigation: PropTypes.object,
	children: PropTypes.element
};
