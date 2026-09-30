import { useTheme } from '~/theme';

export const useListBackgroundColor = (_backgroundColor: string) => {
	const { colors } = useTheme();
	return colors.surfaceHover;
};
