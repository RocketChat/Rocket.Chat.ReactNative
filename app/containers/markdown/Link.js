import React from 'react';
import PropTypes from 'prop-types';
import { Text } from 'react-native';

import styles from './styles';
import openLink from '../../utils/openLink';

const Link = React.memo(({
	children, link
}) => {
	const handlePress = () => {
		if (!link) {
			return;
		}
		openLink(link);
	};

	const childLength = React.Children.toArray(children).filter(o => o).length;

	// if you have a [](https://rocket.chat) render https://rocket.chat
	return (
		<Text
			onPress={handlePress}
			style={styles.link}
		>
			{ childLength !== 0 ? children : link }
		</Text>
	);
});

Link.propTypes = {
	children: PropTypes.node,
	link: PropTypes.string
};

export default Link;
