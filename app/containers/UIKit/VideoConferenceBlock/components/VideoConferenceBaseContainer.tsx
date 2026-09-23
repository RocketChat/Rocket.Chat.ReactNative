import { type ReactElement } from 'react';
import { View, Text } from 'react-native';

import i18n from '~/i18n';
import { useTheme } from '~/theme';
import { CustomIcon, type TIconsName } from '~/containers/CustomIcon';
import Touch from '~/containers/Touch';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import getRoomInfo from '~/lib/methods/getRoomInfo';
import { goRoom, type TGoRoomItem } from '~/lib/methods/helpers/goRoom';
import useStyle from './styles';

type VideoConfMessageIconProps = {
	variant: 'ended' | 'incoming' | 'outgoing' | 'issue';
	children: ReactElement | ReactElement[];
	discussionRid?: string;
};

export const VideoConferenceBaseContainer = ({ variant, children, discussionRid }: VideoConfMessageIconProps): ReactElement => {
	const { colors } = useTheme();
	const style = useStyle();
	const isMasterDetail = useMasterDetail();

	const openDiscussion = async () => {
		if (!discussionRid) return;
		const discussion = await getRoomInfo(discussionRid);
		if (discussion) {
			goRoom({ item: discussion as TGoRoomItem, isMasterDetail });
		}
	};

	const iconStyle: { [key: string]: { icon: TIconsName; color: string; backgroundColor: string; label: string } } = {
		ended: {
			icon: 'phone-off',
			color: colors.fontSecondaryInfo,
			backgroundColor: colors.surfaceNeutral,
			label: i18n.t('Call_ended')
		},
		incoming: {
			icon: 'phone-in',
			color: colors.fontInfo,
			backgroundColor: colors.buttonBackgroundPrimaryDisabled,
			label: i18n.t('Calling')
		},
		outgoing: {
			icon: 'phone',
			color: colors.buttonBackgroundSuccessDefault,
			backgroundColor: colors.buttonBackgroundSuccessDisabled,
			label: i18n.t('Call_ongoing')
		},
		issue: {
			icon: 'phone-issue',
			color: colors.statusFontWarning,
			backgroundColor: colors.statusBackgroundWarning,
			label: i18n.t('Call_issue')
		}
	};

	return (
		<View style={style.container}>
			<View style={style.headerRow}>
				<View style={style.callInfoContainer}>
					<View
						style={{
							...style.iconContainer,
							backgroundColor: iconStyle[variant].backgroundColor
						}}>
						<CustomIcon name={iconStyle[variant].icon} size={24} color={iconStyle[variant].color} />
					</View>
					<Text style={style.infoContainerText}>{iconStyle[variant].label}</Text>
				</View>
				{discussionRid ? (
					<View style={style.actionsContainer}>
						<Touch
							style={style.actionButton}
							onPress={openDiscussion}
							accessibilityLabel={i18n.t('Join_discussion')}
							accessibilityRole='button'
							testID='video-conf-join-discussion'>
							<CustomIcon name='discussions' size={20} color={colors.fontDefault} />
						</Touch>
					</View>
				) : null}
			</View>
			<View style={style.callToActionContainer}>{children}</View>
		</View>
	);
};
