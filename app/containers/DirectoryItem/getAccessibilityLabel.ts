import { type IDirectoryItem } from './index';

export const getAccessibilityLabel = ({
	title,
	rightLabel,
	disabledReason
}: Pick<IDirectoryItem, 'title' | 'rightLabel' | 'disabledReason'>) => {
	const label = `${title || ''} ${rightLabel || ''}`;
	return disabledReason ? `${label} ${disabledReason}` : label;
};
