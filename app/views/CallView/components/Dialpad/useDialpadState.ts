import { useDialpadValue } from '../../../../lib/services/voip/useCallStore';
import { useTheme } from '../../../../theme';

export interface IDialpadState {
	colors: ReturnType<typeof useTheme>['colors'];
	dialpadValue: string;
}

export const useDialpadState = (): IDialpadState => {
	const { colors } = useTheme();
	const dialpadValue = useDialpadValue();
	return { colors, dialpadValue };
};
