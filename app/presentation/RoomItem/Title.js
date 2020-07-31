import React from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';

import styles from './styles';
import { themes } from '../../constants/colors';

const Title = React.memo(({
	name, theme, hideUnreadStatus, alert
}) => (
	<Text
		style={[
			styles.title,
			alert && !hideUnreadStatus && styles.alert,
			{ color: themes[theme].titleText }
		]}
		ellipsizeMode='tail'
		numberOfLines={1}
	>
		{name}
	</Text>
));

Title.propTypes = {
	name: PropTypes.string,
	theme: PropTypes.string,
	hideUnreadStatus: PropTypes.bool,
	alert: PropTypes.bool
};

export default Title;
