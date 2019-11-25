import React from 'react';
import PropTypes from 'prop-types';
import { Text } from 'react-native';

import styles from './styles';
import { themes } from '../../constants/colors';
import openLink from '../../utils/openLink';

const Link = React.memo(({
	children, link, preview, theme
}) => {
	const handlePress = () => {
		if (!link) {
			return;
		}
		openLink(link, theme);
	};

	const childLength = React.Children.toArray(children).filter(o => o).length;

	// if you have a [](https://rocket.chat) render https://rocket.chat
	return (
		<Text
			onPress={preview ? undefined : handlePress}
			style={
				!preview
					? { ...styles.link, color: themes[theme].actionTintColor }
					: { color: themes[theme].titleText }
			}
		>
			{ childLength !== 0 ? children : link }
		</Text>
	);
});

Link.propTypes = {
	children: PropTypes.node,
	link: PropTypes.string,
	theme: PropTypes.string,
	preview: PropTypes.bool
};

export default Link;
