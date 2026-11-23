import { useMemo } from 'react';
import type { Options } from '@rocket.chat/message-parser';

import { useSetting } from '~/lib/hooks/useSetting';

const toDomainList = (setting: unknown): string[] =>
	typeof setting === 'string'
		? setting
				.split(',')
				.map(domain => domain.trim())
				.filter(Boolean)
		: [];

export const useParseOptions = (): Options => {
	const katexEnabled = useSetting('Katex_Enabled') === true;
	const dollarSyntax = useSetting('Katex_Dollar_Syntax') === true;
	const parenthesisSyntax = useSetting('Katex_Parenthesis_Syntax') === true;
	const customDomainsSetting = useSetting('Message_CustomDomain_AutoLink');

	return useMemo(
		(): Options => ({
			emoticons: true,
			customDomains: toDomainList(customDomainsSetting),
			...(katexEnabled && { katex: { dollarSyntax, parenthesisSyntax } })
		}),
		[katexEnabled, dollarSyntax, parenthesisSyntax, customDomainsSetting]
	);
};
