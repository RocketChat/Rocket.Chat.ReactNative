// @ts-nocheck
import { memo } from 'react';

import { useTheme } from '~/theme';
import { CustomIcon } from '../CustomIcon';
import { type IStatusComponentProps } from './definition';
import { getStatusIconName } from './getStatusIconName';
import { useUserStatusColor } from '~/lib/hooks/useUserStatusColor';

const Status = memo(({ style, status = 'offline', size = 32, ...props }: IStatusComponentProps) => {
	const { colors } = useTheme();
	const userStatusColor = useUserStatusColor(status);

	return (
		<CustomIcon
			{...props}
			style={style}
			size={size}
			name={getStatusIconName(status)}
			color={userStatusColor ?? colors.userPresenceOffline}
		/>
	);
});

export default Status;
