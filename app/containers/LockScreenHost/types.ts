import type { ReactNode } from 'react';

export interface ILockScreenHostProps {
	visible: boolean;
	onShown: () => void;
	onHidden: () => void;
	children: ReactNode;
}
