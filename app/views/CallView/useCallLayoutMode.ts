import { useResponsiveLayout } from '../../lib/hooks/useResponsiveLayout/useResponsiveLayout';
import { MIN_WIDTH_MASTER_DETAIL_LAYOUT } from '../../lib/constants/tablet';
import { type LayoutMode } from './types';

interface IUseCallLayoutModeResult {
	layoutMode: LayoutMode;
}

export const useCallLayoutMode = (): IUseCallLayoutModeResult => {
	const { width } = useResponsiveLayout();
	return { layoutMode: width >= MIN_WIDTH_MASTER_DETAIL_LAYOUT ? 'wide' : 'narrow' };
};
