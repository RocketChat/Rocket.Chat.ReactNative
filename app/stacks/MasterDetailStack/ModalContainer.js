import React from 'react';
import { TouchableWithoutFeedback, View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import sharedStyles from '../../views/Styles';
import { themes } from '../../constants/colors';

const styles = StyleSheet.create({
	root: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center'
	},
	backdrop: {
		...StyleSheet.absoluteFill
	}
});

export const ModalContainer = ({ navigation, children, theme }) => (
	<View style={[styles.root, { backgroundColor: `${ themes[theme].backdropColor }70` }]}>
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
	children: PropTypes.element,
	theme: PropTypes.string
};
