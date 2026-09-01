import { useMemo, type ReactNode } from 'react';
import { Alert, Text } from 'react-native';
import { type Link as LinkProps } from '@rocket.chat/message-parser';
import Clipboard from '@react-native-clipboard/clipboard';

import I18n from '../../../../i18n';
import { LISTENER } from '../../../Toast';
import { useTheme } from '../../../../theme';
import openLink from '../../../../lib/methods/helpers/openLink';
import EventEmitter from '../../../../lib/methods/helpers/events';
import MarkdownContext, { useMarkdownContext } from '../../contexts/MarkdownContext';
import styles from '../../styles';

interface ILinkProps {
	value: LinkProps['value'];
	children: ReactNode;
}

const Link = ({ value, children }: ILinkProps) => {
	const { theme, colors } = useTheme();
	const { onLinkPress, textStyle } = useMarkdownContext();
	const linkStyle = useMemo(() => ({ color: colors.fontInfo }), [colors.fontInfo]);
	const context = useMarkdownContext(linkStyle);
	const { src } = value;
	const handlePress = () => {
		if (!src.value) {
			return;
		}
		if (process.env.RUNNING_E2E_TESTS === 'true') {
			Alert.alert('Link Pressed', src.value);
			return;
		}
		if (onLinkPress) {
			return onLinkPress(src.value);
		}
		openLink(src.value, theme);
	};

	const onLongPress = () => {
		if (!src.value) {
			return;
		}
		if (process.env.RUNNING_E2E_TESTS === 'true') {
			Alert.alert('Link Long Pressed', src.value);
			return;
		}
		Clipboard.setString(src.value);
		EventEmitter.emit(LISTENER, { message: I18n.t('Copied_to_clipboard') });
	};

	return (
		<Text style={[styles.link, ...(textStyle ? [textStyle] : []), linkStyle]} onPress={handlePress} onLongPress={onLongPress}>
			<MarkdownContext.Provider value={context}>{children}</MarkdownContext.Provider>
		</Text>
	);
};

export default Link;
