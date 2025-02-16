import React from 'react';
import type { StyleProp, TextStyle } from 'react-native';

import { useTheme } from '../../theme';
import { CustomIcon, IconSet, type TIconsName } from '../CustomIcon';
import type { IStatusComponentProps } from './definition';
import { useUserStatusColor } from '../../lib/hooks/useUserStatusColor';

const Status = React.memo(({ style, status = 'offline', size = 32, ...props }: IStatusComponentProps) => {
	const { colors } = useTheme();
	const userStatusColor = useUserStatusColor(status);

	const name: TIconsName = `status-${status}`;
	const isNameValid = name in IconSet;
	const iconName = isNameValid ? name : 'status-offline';
	const calculatedStyle: StyleProp<TextStyle> = [
		{
			width: size,
			height: size,
			textAlignVertical: 'center'
		},
		style
	];

	return (
		<CustomIcon
			{...props}
			style={calculatedStyle}
			size={size}
			name={iconName}
			color={userStatusColor ?? colors.userPresenceOffline}
		/>
	);
});

export default Status;
