import React from 'react';
import { View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';

const styles = StyleSheet.create({
	separator: {
		height: StyleSheet.hairlineWidth
	}
});


const ListSeparator = React.memo(({ style, theme }) => (
	<View
		style={[
			styles.separator,
			style,
			{ backgroundColor: themes[theme].separatorColor }
		]}
	/>
));

ListSeparator.propTypes = {
	style: PropTypes.object,
	theme: PropTypes.string
};

ListSeparator.displayName = 'List.Separator';

export default withTheme(ListSeparator);
