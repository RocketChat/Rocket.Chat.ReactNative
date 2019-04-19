import React from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';

import { CustomIcon } from '../../../lib/Icons';
import I18n from '../../../i18n';
import Touch from '../../../utils/touch';
import styles from '../styles';


const Sort = React.memo(({ searchLength, sortBy, toggleSort }) => {
	if (searchLength > 0) {
		return null;
	}
	return (
		<Touch
			key='rooms-list-view-sort'
			onPress={toggleSort}
			style={styles.dropdownContainerHeader}
		>
			<View style={styles.sortItemContainer}>
				<Text style={styles.sortToggleText}>{I18n.t('Sorting_by', { key: I18n.t(sortBy === 'alphabetical' ? 'name' : 'activity') })}</Text>
				<CustomIcon style={styles.sortIcon} size={22} name='sort1' />
			</View>
		</Touch>
	);
});

Sort.propTypes = {
	searchLength: PropTypes.number,
	sortBy: PropTypes.string,
	toggleSort: PropTypes.func
};

export default Sort;
