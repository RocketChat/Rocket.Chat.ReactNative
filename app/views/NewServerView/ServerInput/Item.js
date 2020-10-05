import React from 'react';
import {
	View, StyleSheet, Text
} from 'react-native';
import PropTypes from 'prop-types';
import { BorderlessButton } from 'react-native-gesture-handler';

import { themes } from '../../../constants/colors';
import { CustomIcon } from '../../../lib/Icons';
import sharedStyles from '../../Styles';
import Touch from '../../../utils/touch';

const styles = StyleSheet.create({
	container: {
		height: 56,
		paddingHorizontal: 15,
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center'
	},
	content: {
		flex: 1,
		flexDirection: 'column'
	},
	server: {
		...sharedStyles.textMedium,
		fontSize: 16
	}
});

const Item = ({
	item, theme, onPress, onDelete
}) => (
	<Touch style={styles.container} onPress={() => onPress(item.url)} theme={theme} testID={`server-history-${ item.url }`}>
		<View style={styles.content}>
			<Text style={[styles.server, { color: themes[theme].bodyText }]}>{item.url}</Text>
			<Text style={[styles.username, { color: themes[theme].auxiliaryText }]}>{item.username}</Text>
		</View>
		<BorderlessButton onPress={() => onDelete(item)} testID={`server-history-delete-${ item.url }`}>
			<CustomIcon name='delete' size={24} color={themes[theme].auxiliaryText} />
		</BorderlessButton>
	</Touch>
);

Item.propTypes = {
	item: PropTypes.object,
	theme: PropTypes.string,
	onPress: PropTypes.func,
	onDelete: PropTypes.func
};

export default Item;
