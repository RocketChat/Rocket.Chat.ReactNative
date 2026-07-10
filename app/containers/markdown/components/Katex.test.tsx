import { type Root } from '@rocket.chat/message-parser';
import { act, render } from '@testing-library/react-native';
import { type StyleProp, StyleSheet, type ViewStyle } from 'react-native';
import { type WebViewMessageEvent } from 'react-native-webview';

import Markdown from '..';

interface IKatexMockProps {
	expression: string;
	onMessage: (event: WebViewMessageEvent) => void;
	style: StyleProp<ViewStyle>;
}

jest.mock('react-native-katex', () => {
	const { View } = require('react-native');
	return {
		__esModule: true,
		default: ({ expression, onMessage, style }: IKatexMockProps) => (
			<View testID='katex-webview' onMessage={onMessage} style={style}>
				{expression}
			</View>
		)
	};
});

const blockMd: Root = [{ type: 'KATEX', value: 'x^2' }];
const inlineMd: Root = [{ type: 'PARAGRAPH', value: [{ type: 'INLINE_KATEX', value: 'x^2' }] }];

describe('KaTeX rendering', () => {
	it('routes a KATEX block node to the Katex WebView, not the $$...$$ code fallback', () => {
		const { getByTestId, queryByText } = render(<Markdown msg='$$x^2$$' md={blockMd} />);

		expect(getByTestId('katex-webview')).toBeTruthy();
		expect(queryByText('$$x^2$$')).toBeNull();
	});

	it('keeps inline katex as raw source', () => {
		const { getByText, queryByTestId } = render(<Markdown msg='$x^2$' md={inlineMd} />);

		expect(getByText('$x^2$')).toBeTruthy();
		expect(queryByTestId('katex-webview')).toBeNull();
	});

	it('resizes to the height posted by the WebView', () => {
		const { getByTestId } = render(<Markdown msg='$$x^2$$' md={blockMd} />);
		const webView = getByTestId('katex-webview');

		act(() => webView.props.onMessage({ nativeEvent: { data: '120' } }));

		expect(StyleSheet.flatten(getByTestId('katex-webview').props.style).height).toBe(120);
	});
});
