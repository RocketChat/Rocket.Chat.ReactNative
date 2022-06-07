import React from 'react';
import { Text } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';

import styles from './styles';
import { themes } from '../../lib/constants';
import { LISTENER } from '../Toast';
import EventEmitter from '../../lib/methods/helpers/events';
import I18n from '../../i18n';
import openLink from '../../lib/methods/helpers/openLink';
import { TOnLinkPress } from './interfaces';
import { TSupportedThemes } from '../../theme';

interface ILink {
	children: React.ReactElement | null;
	link: string;
	theme: TSupportedThemes;
	onLinkPress?: TOnLinkPress;
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
