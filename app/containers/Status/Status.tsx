import React from 'react';
import { StyleProp, TextStyle } from 'react-native';

import { CustomIcon, IconSet, TIconsName } from '../CustomIcon';
import { STATUS_COLORS } from '../../lib/constants';
import { IStatus } from './definition';

const Status = React.memo(({ style, status = 'offline', size = 32, ...props }: Omit<IStatus, 'id'>) => {
	const name: TIconsName = `status-${status}`;
	const isNameValid = IconSet.hasIcon(name);
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
