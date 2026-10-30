import { useTheme } from '~/theme';
import { SECONDARY_LABEL } from '../constants';

export const useSecondaryLabelColor = () => {
	const { theme } = useTheme();
	return theme === 'light' ? SECONDARY_LABEL.light : SECONDARY_LABEL.dark;
};
