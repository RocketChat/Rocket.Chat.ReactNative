import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import Touch from '../../../utils/touch';
import { CustomIcon } from '../../../lib/Icons';
import I18n from '../../../i18n';
import styles from '../styles';
import { themes } from '../../../constants/colors';
import { withTheme } from '../../../theme';


const Sort = React.memo(({
	searching, sortBy, toggleSort, theme
}) => {
	if (searching > 0) {
		return null;
	}
	return (
		<Touch
			onPress={toggleSort}
			theme={theme}
			style={{ backgroundColor: themes[theme].headerSecondaryBackground }}
		>
			<View
				style={[
					styles.dropdownContainerHeader,
					{ borderBottomWidth: StyleSheet.hairlineWidth, borderColor: themes[theme].separatorColor }
				]}
			>
				<Text style={[styles.sortToggleText, { color: themes[theme].auxiliaryText }]}>{I18n.t('Sorting_by', { key: I18n.t(sortBy === 'alphabetical' ? 'name' : 'activity') })}</Text>
				<CustomIcon style={[styles.sortIcon, { color: themes[theme].auxiliaryText }]} size={22} name='sort1' />
			</View>
		</Touch>
	);
});

Sort.propTypes = {
	searching: PropTypes.bool,
	sortBy: PropTypes.string,
	theme: PropTypes.string,
	toggleSort: PropTypes.func
};

export default withTheme(Sort);
