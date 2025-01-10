import React, { useContext } from 'react';
import { Text } from 'react-native';
import { Link as LinkProps } from '@rocket.chat/message-parser';
import Clipboard from '@react-native-clipboard/clipboard';

import { Bold, Italic, Strike } from './index';
import I18n from '../../../../i18n';
import { LISTENER } from '../../../Toast';
import { useTheme } from '../../../../theme';
import openLink from '../../../../lib/methods/helpers/openLink';
import EventEmitter from '../../../../lib/methods/helpers/events';
import { themes } from '../../../../lib/constants';
import MarkdownContext from '../../contexts/MarkdownContext';
import styles from '../../styles';

interface ILinkProps {
	value: LinkProps['value'];
}

const Link = ({ value }: ILinkProps) => {
	const { theme } = useTheme();
	const { onLinkPress } = useContext(MarkdownContext);
	const { src, label } = value;
	const handlePress = () => {
		if (!src.value) {
			return;
		}
		if (onLinkPress) {
			return onLinkPress(src.value);
		}
		openLink(src.value, theme);
	};

	const onLongPress = () => {
		Clipboard.setString(src.value);
		EventEmitter.emit(LISTENER, { message: I18n.t('Copied_to_clipboard') });
	};

	return (
		<Text onPress={handlePress} onLongPress={onLongPress} style={[styles.link, { color: themes[theme].fontInfo }]}>
			{(block => {
				const blockArray = Array.isArray(block) ? block : [block];
				return blockArray.map(blockInArray => {
					switch (blockInArray.type) {
						case 'PLAIN_TEXT':
							return blockInArray.value;
						case 'STRIKE':
							return <Strike value={blockInArray.value} />;
						case 'ITALIC':
							return <Italic value={blockInArray.value} />;
						case 'BOLD':
							return <Bold value={blockInArray.value} />;
						default:
							return null;
					}
				});
			})(label)}
		</Text>
	);
};

export default Link;
