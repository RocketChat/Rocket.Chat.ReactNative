import React from 'react';

import { CustomIcon } from '../../lib/Icons';
import { STATUS_COLORS } from '../../constants/colors';

interface IStatus {
	status: string;
	size: number;
	style: any;
}

const Status = React.memo(({ style, status = 'offline', size = 32, ...props }: IStatus) => {
	const name = `status-${status}`;
	const isNameValid = CustomIcon.hasIcon(name);
	const iconName = isNameValid ? name : 'status-offline';
	const calculatedStyle = [
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
