import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { withTheme } from '../../theme';
import scrollPersistTaps from '../../utils/scrollPersistTaps';

const styles = StyleSheet.create({
	container: {
		paddingVertical: 16
	}
});

const List = ({ children, ...props }) => (
	<ScrollView
		contentContainerStyle={styles.container}
		{...scrollPersistTaps}
		{...props}
	>
		{children}
	</ScrollView>
);

List.propTypes = {
	children: PropTypes.element.isRequired
};

export default withTheme(List);
