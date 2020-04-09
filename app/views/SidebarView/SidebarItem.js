import React from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';

import styles from './styles';
import Touch from '../../utils/touch';
import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';

const Item = React.memo(({
	left, right, text, onPress, testID, current, theme
}) => (
	<Touch
		key={testID}
		testID={testID}
		onPress={onPress}
		theme={theme}
		style={[styles.item, current && { backgroundColor: themes[theme].borderColor }]}
	>
		<View style={styles.itemHorizontal}>
			{left}
		</View>
		<View style={styles.itemCenter}>
			<Text style={[styles.itemText, { color: themes[theme].titleText }]}>
				{text}
			</Text>
		</View>
		<View style={styles.itemHorizontal}>
			{right}
		</View>
	</Touch>
));

Item.propTypes = {
	left: PropTypes.element,
	right: PropTypes.element,
	text: PropTypes.string,
	current: PropTypes.bool,
	onPress: PropTypes.func,
	testID: PropTypes.string,
	theme: PropTypes.string
};

export default withTheme(Item);
