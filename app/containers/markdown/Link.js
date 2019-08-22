import React from 'react';
import PropTypes from 'prop-types';
import { Text } from 'react-native';

import styles from './styles';
import openLink from '../../utils/openLink';

const Link = React.memo(({
	link
}) => {
	const handlePress = () => {
		if (!link) {
			return;
		}
		openLink(link);
	};

	return (
		<Text
			onPress={handlePress}
			style={styles.link}
		>
			{link}
		</Text>
	);
});

Link.propTypes = {
	link: PropTypes.string
};

export default Link;
