import { type KaTeX as KaTeXProps } from '@rocket.chat/message-parser';
import { useState, type ReactElement } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Katex from 'react-native-katex';
import { type WebViewMessageEvent } from 'react-native-webview';

import InlineCode from './InlineCode';
import { isAndroid } from '../../../lib/methods/helpers/deviceInfo';
import { useTheme } from '../../../theme';

interface IKaTeXProps {
	value: KaTeXProps['value'];
}

const INITIAL_HEIGHT = 20;

const injectedJavaScript = `window.ReactNativeWebView.postMessage(String(document.body.scrollHeight)); true;`;

// Center horizontally and reset margins, but omit the fork default's height:100%:
// with a full-height body scrollHeight reflects the container, breaking the height handshake.
const inlineStyle = (color: string) => `
body { color: ${color}; margin: 0; display: flex; justify-content: center; }
.katex { margin: 0; }
`;

export const KaTeX = ({ value }: IKaTeXProps): ReactElement => {
	const { colors } = useTheme();
	const [height, setHeight] = useState(INITIAL_HEIGHT);

	const onMessage = (event: WebViewMessageEvent) => {
		const newHeight = Number(event.nativeEvent.data);
		if (!Number.isNaN(newHeight) && newHeight > 0) {
			setHeight(newHeight);
		}
	};

	const androidCrashWorkaround: StyleProp<ViewStyle> = isAndroid ? { opacity: 0.99, overflow: 'hidden' } : {};

	return (
		<Katex
			expression={value}
			displayMode
			throwOnError={false}
			inlineStyle={inlineStyle(colors.fontDefault)}
			injectedJavaScript={injectedJavaScript}
			onMessage={onMessage}
			style={[{ flex: 1, height, backgroundColor: 'transparent' }, androidCrashWorkaround]}
		/>
	);
};

export const InlineKaTeX = ({ value }: IKaTeXProps): ReactElement => (
	<InlineCode value={{ type: 'PLAIN_TEXT', value: `$${value}$` }} />
);
