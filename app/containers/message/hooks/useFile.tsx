import { useState } from 'react';

import { type IAttachment } from '../../../definitions';

// Merges local overrides (the downloaded uri) over the `file` prop, unconditionally: persistMessage no-ops without a message row.
export const useFile = (file: IAttachment) => {
	'use memo';

	const [overrides, setOverrides] = useState<Partial<IAttachment> | null>(null);

	const mergeFile = (f: Partial<IAttachment>) => {
		setOverrides(prev => ({ ...prev, ...f }));
	};

	return [overrides ? { ...file, ...overrides } : file, mergeFile] as const;
};
