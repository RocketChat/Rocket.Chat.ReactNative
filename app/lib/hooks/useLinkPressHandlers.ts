import Clipboard from '@react-native-clipboard/clipboard';

import I18n from '~/i18n';
import { LISTENER } from '~/containers/Toast';
import EventEmitter from '~/lib/methods/helpers/events';
import openLink from '~/lib/methods/helpers/openLink';
import { useTheme } from '~/theme';

export const useLinkPressHandlers = (url: string) => {
	const { theme } = useTheme();

	const onPress = () => openLink(url, theme);

	const onLongPress = () => {
		Clipboard.setString(url);
		EventEmitter.emit(LISTENER, { message: I18n.t('Copied_to_clipboard') });
	};

	return { onPress, onLongPress };
};
