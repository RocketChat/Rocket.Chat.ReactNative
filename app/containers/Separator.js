import React from 'react';
import { View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import { themes } from '../constants/colors';

const styles = StyleSheet.create({
	separator: {
		height: StyleSheet.hairlineWidth
	}
});


const Separator = React.memo(({ style, theme }) => (
	<View
		style={[
			styles.separator,
			style,
			{ backgroundColor: themes[theme].separatorColor }
		]}
	/>
));

Separator.propTypes = {
	style: PropTypes.object,
	theme: PropTypes.string
};

export default Separator;
