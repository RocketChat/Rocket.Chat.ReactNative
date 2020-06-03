import React from 'react';
import { TouchableWithoutFeedback, View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import sharedStyles from '../../views/Styles';

const styles = StyleSheet.create({
	root: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#00000070'
	},
	backdrop: {
		...StyleSheet.absoluteFill
	}
});

export const ModalContainer = ({ navigation, children }) => (
	<View style={styles.root}>
		<TouchableWithoutFeedback onPress={() => navigation.pop()}>
			<View style={styles.backdrop} />
		</TouchableWithoutFeedback>
		<View style={sharedStyles.modalFormSheet}>
			{children}
		</View>
	</View>
);

ModalContainer.propTypes = {
	navigation: PropTypes.object,
	children: PropTypes.element
};
