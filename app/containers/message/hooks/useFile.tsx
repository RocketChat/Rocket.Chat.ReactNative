import { useState } from 'react';

import { type IAttachment } from '../../../definitions';

/**
 * Keeps local overrides for an attachment — currently the local uri a download resolved to —
 * merged on top of the `file` prop.
 *
 * Overrides are applied unconditionally rather than only for non-persisted messages. Waiting on the
 * database round trip is not reliable: `persistMessage` silently no-ops whenever it can't find a
 * row for the message id, which happens for forwarded messages and for the Files/Mentions/Starred/
 * Pinned lists, whose attachments are built from REST payloads that carry no message id. Those
 * attachments were left pointing at the remote url even after the file was cached on disk, so
 * opening them streamed instead of playing the local file.
 */
export const useFile = (file: IAttachment) => {
	'use memo';

	const [overrides, setOverrides] = useState<Partial<IAttachment> | null>(null);

	const mergeFile = (f: Partial<IAttachment>) => {
		setOverrides(prev => ({ ...prev, ...f }));
	};

	return [overrides ? { ...file, ...overrides } : file, mergeFile] as const;
};
