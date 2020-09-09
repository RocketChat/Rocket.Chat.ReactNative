import React from 'react';
import {
	View, StyleSheet, TouchableOpacity, Text
} from 'react-native';
import PropTypes from 'prop-types';

import { themes } from '../../../constants/colors';
import { CustomIcon } from '../../../lib/Icons';
import sharedStyles from '../../Styles';

const styles = StyleSheet.create({
	item: {
		padding: 15,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	itemText: {
		...sharedStyles.textRegular,
		fontSize: 16
	}
});

const Item = ({
	item, onPress, theme, deleteServerLink
}) => (
	<View style={styles.item}>
		<TouchableOpacity onPress={() => onPress(item.link)}>
			<Text style={[styles.itemText, { color: themes[theme].titleText }]}>{item.link}</Text>
		</TouchableOpacity>
		<TouchableOpacity onPress={() => deleteServerLink(item)}>
			<CustomIcon name='close' size={16} color={themes[theme].auxiliaryText} />
		</TouchableOpacity>
	</View>
);

Item.propTypes = {
	item: PropTypes.object,
	theme: PropTypes.string,
	onPress: PropTypes.func,
	deleteServerLink: PropTypes.func
};

export default Item;
