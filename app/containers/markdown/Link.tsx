import React from 'react';
import { Clipboard, Text } from 'react-native';

import styles from './styles';
import { themes } from '../../constants/colors';
import { LISTENER } from '../Toast';
import EventEmitter from '../../utils/events';
import I18n from '../../i18n';
import openLink from '../../utils/openLink';

interface ILink {
	children: JSX.Element;
	link: string;
	theme: string;
	onLinkPress: Function;
}

const Link = React.memo(({ children, link, theme, onLinkPress }: ILink) => {
	const handlePress = () => {
		if (!link) {
			return;
		}
		if (onLinkPress) {
			return onLinkPress(link);
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
		<Text onPress={handlePress} onLongPress={onLongPress} style={{ ...styles.link, color: themes[theme].actionTintColor }}>
			{childLength !== 0 ? children : link}
		</Text>
	);
});

export default Link;
