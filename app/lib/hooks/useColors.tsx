import { useTheme } from '@app/theme';
import { colors as themeColors } from '@app/constants/colors';

export type TColors = typeof themeColors;
export const auxColors: TColors = themeColors;

export const useColors = () => {
	const { theme } = useTheme();
	const auxTheme = theme as keyof TColors;
	const colors = auxColors[auxTheme];
	return { colors };
};
