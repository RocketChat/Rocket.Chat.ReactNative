import React from 'react';
import { StyleProp, TextStyle } from 'react-native';

import { CustomIcon } from '../../lib/Icons';
import { STATUS_COLORS } from '../../constants/colors';

interface IStatus {
	status: string;
	size: number;
	style?: StyleProp<TextStyle>;
	testID?: string;
}

const Status = React.memo(({ style, status = 'offline', size = 32, ...props }: IStatus) => {
	const name = `status-${status}`;
	const isNameValid = CustomIcon.hasIcon(name);
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
			style={calculatedStyle}
			size={size}
			name={iconName}
			color={STATUS_COLORS[status] ?? STATUS_COLORS.offline}
			{...props}
		/>
	);
});

export default Status;
