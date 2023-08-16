import React from 'react';
import { KaTeX as KaTeXProps } from '@rocket.chat/message-parser';
// eslint-disable-next-line import/no-unresolved
import MathView, { MathText } from 'react-native-math-view';
import Katex from 'react-native-katex';

import { useTheme } from '../../../theme';
import { DEFAULT_MESSAGE_HEIGHT } from '../../message/utils';

interface IKaTeXProps {
	value: KaTeXProps['value'];
}

export const KaTeX = ({ value }: IKaTeXProps): React.ReactElement | null => {
	const { colors } = useTheme();
	return (
		<MathView
			math={value}
			style={{ color: colors.bodyText }}
			renderError={() => <Katex expression={value} style={{ flex: 1, height: DEFAULT_MESSAGE_HEIGHT }} />}
		/>
	);
};

export const InlineKaTeX = ({ value }: IKaTeXProps): React.ReactElement | null => {
	const { colors } = useTheme();
	return <MathText color value={`$$${value}$$`} direction='ltr' style={{ color: colors.bodyText }} />;
};
