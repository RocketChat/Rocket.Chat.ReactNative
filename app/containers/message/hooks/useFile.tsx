import { useState } from 'react';

import { type IAttachment } from '../../../definitions';

export const useFile = (file: IAttachment) => {
	const [overrides, setOverrides] = useState<Partial<IAttachment> | null>(null);

	const mergeFile = (f: Partial<IAttachment>) => {
		setOverrides(prev => ({ ...prev, ...f }));
	};

	return [overrides ? { ...file, ...overrides } : file, mergeFile] as const;
};
