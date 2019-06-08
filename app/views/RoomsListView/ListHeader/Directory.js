import React from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';

import { CustomIcon } from '../../../lib/Icons';
import I18n from '../../../i18n';
import Touch from '../../../utils/touch';
import styles from '../styles';
import DisclosureIndicator from '../../../containers/DisclosureIndicator';


const Directory = React.memo(({ goDirectory }) => (
	<Touch
		key='rooms-list-view-sort'
		onPress={goDirectory}
		style={styles.dropdownContainerHeader}
	>
		<View style={styles.sortItemContainer}>
			<CustomIcon style={styles.directoryIcon} size={22} name='discover' />
			<Text style={styles.directoryText}>{I18n.t('Directory')}</Text>
			<DisclosureIndicator />
		</View>
	</Touch>
));

Directory.propTypes = {
	goDirectory: PropTypes.func
};

export default Directory;
