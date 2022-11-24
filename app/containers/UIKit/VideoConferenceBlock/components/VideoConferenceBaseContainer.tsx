import React from 'react';
import { View, Text } from 'react-native';

import i18n from '../../../../i18n';
import { useTheme } from '../../../../theme';
import { CustomIcon, TIconsName } from '../../../CustomIcon';
import useStyle from './styles';

type VideoConfMessageIconProps = {
	variant: 'ended' | 'incoming' | 'outgoing';
	children: React.ReactElement | React.ReactElement[];
};

export const VideoConferenceBaseContainer = ({ variant, children }: VideoConfMessageIconProps): React.ReactElement => {
	const { colors } = useTheme();
	const style = useStyle();

	const iconStyle: { [key: string]: { icon: TIconsName; color: string; backgroundColor: string; label: string } } = {
		ended: {
			icon: 'phone-end',
			color: colors.conferenceCallEndedPhoneIcon,
			backgroundColor: colors.conferenceCallEndedPhoneBackground,
			label: i18n.t('Call_ended')
		},
		incoming: {
			icon: 'phone-in',
			color: colors.conferenceCallIncomingPhoneIcon,
			backgroundColor: colors.conferenceCallIncomingPhoneBackground,
			label: i18n.t('Calling')
		},
		outgoing: {
			icon: 'phone',
			color: colors.conferenceCallOngoingPhoneIcon,
			backgroundColor: colors.conferenceCallOngoingPhoneBackground,
			label: i18n.t('Call_ongoing')
		}
	};

	return (
		<View style={style.container}>
			<View style={style.callInfoContainer}>
				<View
					style={{
						...style.iconContainer,
						backgroundColor: iconStyle[variant].backgroundColor
					}}
				>
					<CustomIcon name={iconStyle[variant].icon} size={variant === 'incoming' ? 16 : 24} color={iconStyle[variant].color} />
				</View>
				<Text style={style.infoContainerText}>{iconStyle[variant].label}</Text>
			</View>
			<View style={style.callToActionContainer}>{children}</View>
		</View>
	);
};
