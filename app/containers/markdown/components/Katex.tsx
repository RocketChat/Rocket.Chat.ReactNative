import { type KaTeX as KaTeXProps } from '@rocket.chat/message-parser';
import type { StyleProp, ViewStyle } from 'react-native';
import Katex from 'react-native-katex';
// eslint-disable-next-line import/no-unresolved
import MathView, { MathText } from 'react-native-math-view';
import type { ReactElement } from 'react';

import { isAndroid } from '../../../lib/methods/helpers/deviceInfo';
import { useTheme } from '../../../theme';
import { DEFAULT_MESSAGE_HEIGHT } from '../../message/utils';

interface IKaTeXProps {
	value: KaTeXProps['value'];
}

const BLOCK_ENV_PATTERN = /\\begin\s*\{\s*(array|matrix|pmatrix|bmatrix|Bmatrix|vmatrix|Vmatrix)\s*\}/;

export const KaTeX = ({ value }: IKaTeXProps): ReactElement | null => {
	const { colors } = useTheme();
	const fixAndroidWebviewCrashStyle: StyleProp<ViewStyle> = isAndroid ? { opacity: 0.99, overflow: 'hidden' } : {};
	// KaTeX array does not render correctly in MathView (shows gray box).
	// MathView does not throw, so renderError is never triggered.
	if (BLOCK_ENV_PATTERN.test(value)) {
		return (
			<Katex
				expression={value}
				displayMode={true}
				style={[{ flex: 1, height: DEFAULT_MESSAGE_HEIGHT }, fixAndroidWebviewCrashStyle]}
			/>
		);
	}

	return (
		<MathView
			math={value}
			config={{ inline: false }}
			style={{ color: colors.fontDefault }}
			renderError={() => (
				<Katex
					expression={value}
					displayMode={true}
					style={[{ flex: 1, height: DEFAULT_MESSAGE_HEIGHT }, fixAndroidWebviewCrashStyle]}
				/>
			)}
		/>
	);
};

export const InlineKaTeX = ({ value }: IKaTeXProps): ReactElement | null => {
	const { colors } = useTheme();
	return <MathText color value={`$$${value}$$`} direction='ltr' style={{ color: colors.fontDefault }} />;
};
