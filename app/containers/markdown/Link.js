import React from 'react';
import PropTypes from 'prop-types';
import { Text, Clipboard } from 'react-native';

import styles from './styles';
import { themes } from '../../constants/colors';
import openLink from '../../utils/openLink';
import { LISTENER } from '../Toast';
import EventEmitter from '../../utils/events';
import I18n from '../../i18n';

const Link = React.memo(({
	children, link, theme
}) => {
	const handlePress = () => {
		if (!link) {
			return;
		}
		openLink(link, theme);
	};

	const childLength = React.Children.toArray(children).filter(o => o).length;
	const onLongPress = () => {
		Clipboard.setString(link);
		EventEmitter.emit(LISTENER, { message: I18n.t('Copied_to_clipboard') });
	};

	// if you have a [](https://rocket.chat) render https://rocket.chat
	return (
		<Text
			onPress={handlePress}
			onLongPress={onLongPress}
			style={{ ...styles.link, color: themes[theme].actionTintColor }}
		>
			{ childLength !== 0 ? children : link }
		</Text>
	);
});

Link.propTypes = {
	children: PropTypes.node,
	link: PropTypes.string,
	theme: PropTypes.string
};

export default Link;
