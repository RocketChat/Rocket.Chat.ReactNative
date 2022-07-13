import React from 'react';
import { KaTeX as KaTeXProps } from '@rocket.chat/message-parser';
// eslint-disable-next-line import/no-unresolved
import MathView, { MathText } from 'react-native-math-view';

interface IKaTeXProps {
	value: KaTeXProps['value'];
}

export const KaTeX = ({ value }: IKaTeXProps): React.ReactElement | null => <MathView math={value} />;

export const InlineKaTeX = ({ value }: IKaTeXProps): React.ReactElement | null => (
	<MathText value={`$${value}$$`} direction='ltr' />
);
