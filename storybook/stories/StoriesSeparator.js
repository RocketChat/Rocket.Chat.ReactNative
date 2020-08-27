import React from 'react';
import { Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import { themes } from '../../app/constants/colors';

const styles = StyleSheet.create({
	separator: {
		marginVertical: 30,
		marginLeft: 10,
		fontSize: 20,
		fontWeight: '300'
	}
});

const Separator = ({ title, style, theme }) => (
	<Text
		style={[
			styles.separator,
			{
				color: themes[theme].titleText
			},
			style
		]}
	>
		{title}
	</Text>
);

Separator.propTypes = {
	title: PropTypes.string.isRequired,
	theme: PropTypes.string,
	style: PropTypes.object
};

export default Separator;
