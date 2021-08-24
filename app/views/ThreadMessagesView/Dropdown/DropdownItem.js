import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet } from 'react-native';

import { themes } from '../../../constants/colors';
import { withTheme } from '../../../theme';
import Touch from '../../../utils/touch';
import { CustomIcon } from '../../../lib/Icons';
import sharedStyles from '../../Styles';

const styles = StyleSheet.create({
	container: {
		paddingVertical: 8,
		minHeight: 40,
		paddingHorizontal: 16,
		flexDirection: 'row',
		alignItems: 'center'
	},
	text: {
		flex: 1,
		fontSize: 16,
		...sharedStyles.textRegular
	}
});

const DropdownItem = React.memo(({
	theme, onPress, iconName, text
}) => (
	<Touch theme={theme} onPress={onPress} style={{ backgroundColor: themes[theme].backgroundColor }}>
		<View style={styles.container}>
			<Text style={[styles.text, { color: themes[theme].auxiliaryText }]}>{text}</Text>
			{iconName ? <CustomIcon name={iconName} size={22} color={themes[theme].auxiliaryText} /> : null}
		</View>
	</Touch>
));

DropdownItem.propTypes = {
	text: PropTypes.string,
	iconName: PropTypes.string,
	theme: PropTypes.string,
	onPress: PropTypes.func
};

export default withTheme(DropdownItem);
