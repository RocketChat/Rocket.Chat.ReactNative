import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { withTheme } from '../../theme';

const styles = StyleSheet.create({
	container: {
		marginVertical: 16
	}
});

const ListSection = ({ children, title }) => (
	<View style={styles.container}>
		{title ? <Text>{title}</Text> : null}
		{children}
	</View>
);

ListSection.propTypes = {
	children: PropTypes.element.isRequired,
	title: PropTypes.string
};

export default withTheme(ListSection);
