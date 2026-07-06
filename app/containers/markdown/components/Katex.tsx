import { type KaTeX as KaTeXProps } from '@rocket.chat/message-parser';
import { type ReactElement } from 'react';

import { Code } from './code';
import InlineCode from './InlineCode';

interface IKaTeXProps {
	value: KaTeXProps['value'];
}

export const KaTeX = ({ value }: IKaTeXProps): ReactElement => (
	<Code value={[{ type: 'CODE_LINE', value: { type: 'PLAIN_TEXT', value: `$$${value}$$` } }]} />
);

export const InlineKaTeX = ({ value }: IKaTeXProps): ReactElement => (
	<InlineCode value={{ type: 'PLAIN_TEXT', value: `$${value}$` }} />
);
