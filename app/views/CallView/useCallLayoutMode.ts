import { useResponsiveLayout } from '../../lib/hooks/useResponsiveLayout/useResponsiveLayout';
import { MIN_WIDTH_MASTER_DETAIL_LAYOUT } from '../../lib/constants/tablet';
import { type LayoutMode } from './types';

export const useCallLayoutMode = (): { layoutMode: LayoutMode } => {
	const { width } = useResponsiveLayout();
	return { layoutMode: width >= MIN_WIDTH_MASTER_DETAIL_LAYOUT ? 'wide' : 'narrow' };
};
