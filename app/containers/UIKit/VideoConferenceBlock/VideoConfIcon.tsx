import React from 'react';
import { View } from 'react-native';

import { useTheme } from '../../../theme';
import { CustomIcon, TIconsName } from '../../CustomIcon';
import useStyle from './styles';

type VideoConfMessageIconProps = {
	variant: 'ended' | 'incoming' | 'outgoing';
};

export const VideoConfIcon = ({ variant }: VideoConfMessageIconProps): React.ReactElement => {
	const { colors } = useTheme();
	const style = useStyle();

	const iconStyle: { [key: string]: { icon: TIconsName; color: string; backgroundColor: string } } = {
		ended: {
			icon: 'phone-end',
			color: colors.conferenceCallEndedPhoneIcon,
			backgroundColor: colors.conferenceCallEndedPhoneBackground
		},
		incoming: {
			icon: 'phone-in',
			color: colors.conferenceCallIncomingPhoneIcon,
			backgroundColor: colors.conferenceCallIncomingPhoneBackground
		},
		outgoing: {
			icon: 'phone',
			color: colors.conferenceCallOngoingPhoneIcon,
			backgroundColor: colors.conferenceCallOngoingPhoneBackground
		}
	};

	return (
		<View
			style={{
				...style.iconContainer,
				backgroundColor: iconStyle[variant].backgroundColor
			}}
		>
			<CustomIcon name={iconStyle[variant].icon} size={variant === 'incoming' ? 16 : 24} color={iconStyle[variant].color} />
		</View>
	);
};
