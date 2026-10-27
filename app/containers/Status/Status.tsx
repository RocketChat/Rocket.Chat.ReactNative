// @ts-nocheck
import { memo } from 'react';
import { type StyleProp, type TextStyle, useWindowDimensions } from 'react-native';

import { useTheme } from '~/theme';
import { CustomIcon } from '../CustomIcon';
import { type IStatusComponentProps } from './definition';
import { getStatusIconName } from './getStatusIconName';
import { useUserStatusColor } from '~/lib/hooks/useUserStatusColor';
import { useIsNativeList } from '~/containers/List/native/context';

const Status = memo(({ style, status = 'offline', size = 32, ...props }: IStatusComponentProps) => {
	const { colors } = useTheme();
	const userStatusColor = useUserStatusColor(status);
	const isNativeList = useIsNativeList();

	const { fontScale } = useWindowDimensions();

	const calculatedStyle: StyleProp<TextStyle> = [
		{
			width: size * fontScale,
			height: size * fontScale,
			textAlignVertical: 'center',
			textAlign: 'center'
		},
		style
	];

	return (
		<CustomIcon
			{...props}
			style={isNativeList ? style : calculatedStyle}
			size={size}
			name={getStatusIconName(status)}
			color={userStatusColor ?? colors.userPresenceOffline}
		/>
	);
});

export default Status;
