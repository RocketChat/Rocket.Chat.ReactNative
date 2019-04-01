import React from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';
import { RectButton } from 'react-native-gesture-handler';

import styles from './styles';
import { COLOR_TEXT } from '../../constants/colors';

const Item = React.memo(({
	left, text, onPress, testID, current
}) => (
	<RectButton
		key={testID}
		testID={testID}
		onPress={onPress}
		underlayColor={COLOR_TEXT}
		activeOpacity={0.1}
		style={[styles.item, current && styles.itemCurrent]}
	>
		<View style={styles.itemLeft}>
			{left}
		</View>
		<View style={styles.itemCenter}>
			<Text style={styles.itemText}>
				{text}
			</Text>
		</View>
	</RectButton>
));

Item.propTypes = {
	left: PropTypes.element,
	text: PropTypes.string,
	current: PropTypes.bool,
	onPress: PropTypes.func,
	testID: PropTypes.string
};

export default Item;
