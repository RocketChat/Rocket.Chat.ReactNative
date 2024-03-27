import { capitalize } from 'lodash';

import { useTheme } from '../../theme';
import type { TColors } from '../../theme';
import type { TUserStatus } from '../../definitions';

export const useUserStatusColor = (status: TUserStatus): keyof TColors => {
	const { colors } = useTheme();
	const key = `userPresence${capitalize(status)}` as keyof TColors;
	return colors[key] as keyof TColors;
};
