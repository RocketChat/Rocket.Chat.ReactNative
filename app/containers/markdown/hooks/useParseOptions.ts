import { useMemo } from 'react';
import type { Options } from '@rocket.chat/message-parser';

import { useSetting } from '~/lib/hooks/useSetting';

export const useParseOptions = (): Options => {
	const katexEnabled = useSetting('Katex_Enabled') === true;
	const dollarSyntax = useSetting('Katex_Dollar_Syntax') === true;
	const parenthesisSyntax = useSetting('Katex_Parenthesis_Syntax') === true;

	return useMemo(
		(): Options => (katexEnabled ? { katex: { dollarSyntax, parenthesisSyntax } } : {}),
		[katexEnabled, dollarSyntax, parenthesisSyntax]
	);
};
