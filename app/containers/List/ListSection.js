import React from 'react';
import { View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { withTheme } from '../../theme';
import { Header } from '.';

const styles = StyleSheet.create({
	container: {
		marginVertical: 16
	}
});

const ListSection = ({ children, title, translateTitle }) => (
	<View style={styles.container}>
		{title ? <Header {...{ title, translateTitle }} /> : null}
		{children}
	</View>
);

ListSection.propTypes = {
	children: PropTypes.element.isRequired,
	title: PropTypes.string,
	translateTitle: PropTypes.bool
};

export default withTheme(ListSection);
