import React from 'react';
import { View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import KeyCommands from '../commands';

const styles = StyleSheet.create({
	container: {
		width: '100%',
		height: '100%',
		backgroundColor: '#00000030',
		position: 'absolute',
		justifyContent: 'center',
		alignItems: 'center'
	},
	modal: {
		width: '70%',
		height: '70%',
		overflow: 'hidden',
		borderRadius: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.8,
		shadowRadius: 2,
		elevation: 1
	}
});

const Modal = ({ children }) => (
	<KeyCommands style={styles.container}>
		<View style={styles.modal}>
			{children}
		</View>
	</KeyCommands>
);

Modal.propTypes = {
	children: PropTypes.node
};

export default Modal;
