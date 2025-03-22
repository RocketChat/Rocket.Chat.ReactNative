import { KaTeX as KaTeXProps } from '@rocket.chat/message-parser';
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Katex from 'react-native-katex';
// eslint-disable-next-line import/no-unresolved
import MathView, { MathText } from 'react-native-math-view';

import { isAndroid } from '../../../lib/methods/helpers';
import { useTheme } from '../../../theme';
import { DEFAULT_MESSAGE_HEIGHT } from '../../message/utils';

interface IKaTeXProps {
	value: KaTeXProps['value'];
}

export const KaTeX = ({ value }: IKaTeXProps): React.ReactElement | null => {
	const { colors } = useTheme();
	const fixAndroidWebviewCrashStyle: StyleProp<ViewStyle> = isAndroid ? { opacity: 0.99, overflow: 'hidden' } : {};
	return (
		<MathView
			math={value}
			style={{ color: colors.fontDefault }}
			renderError={() => (
				<Katex expression={value} style={[{ flex: 1, height: DEFAULT_MESSAGE_HEIGHT }, fixAndroidWebviewCrashStyle]} />
			)}
		/>
	);
};

export const InlineKaTeX = ({ value }: IKaTeXProps): React.ReactElement | null => {
	const { colors } = useTheme();
	return <MathText color value={`$$${value}$$`} direction='ltr' style={{ color: colors.fontDefault }} />;
};
