import type { ReactNode } from 'react';

export interface ILockScreenHostProps {
	visible: boolean;
	requestId: number;
	onShown: () => void;
	onHidden: () => void;
	children: ReactNode;
}
