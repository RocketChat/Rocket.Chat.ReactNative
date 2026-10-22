import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CustomIcon, type TIconsName } from '~/containers/CustomIcon';
import Touch from '~/containers/Touch';
import i18n from '~/i18n';
import { useSubscription } from '~/lib/hooks/useSubscription';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';
import { PexipCallTimer } from './PexipCallTimer';
import { SPLIT_BAR_HEIGHT } from './usePexipSplitLayout';

const BarButton = ({
	icon,
	label,
	testID,
	onPress
}: {
	icon: TIconsName;
	label: string;
	testID: string;
	onPress: () => void;
}) => {
	const { colors } = useTheme();
	return (
		<Touch
			onPress={onPress}
			style={[styles.button, { backgroundColor: colors.buttonBackgroundSecondaryDefault }]}
			accessibilityLabel={label}
			testID={testID}>
			<CustomIcon name={icon} size={20} color={colors.fontDefault} />
		</Touch>
	);
};

export const PexipCallTopBar = ({
	rid,
	startedAt,
	isSplit,
	onLeave,
	onExpand,
	onOpenChat
}: {
	rid?: string;
	startedAt: number;
	isSplit: boolean;
	onLeave: () => void;
	onExpand: () => void;
	onOpenChat: () => void;
}) => {
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();
	const room = useSubscription(rid);
	const roomName = rid && room?.rid === rid ? room.fname || room.name : undefined;

	return (
		<View
			style={[
				styles.topBar,
				isSplit ? { height: SPLIT_BAR_HEIGHT } : { paddingTop: insets.top, height: SPLIT_BAR_HEIGHT + insets.top }
			]}>
			<Touch
				onPress={onLeave}
				style={[styles.button, { backgroundColor: colors.buttonBackgroundDangerDefault }]}
				accessibilityLabel={i18n.t('End')}
				testID='pexip-call-leave'>
				<CustomIcon name='phone-off' size={20} color={colors.fontWhite} />
			</Touch>
			<PexipCallTimer startedAt={startedAt} style={[styles.timer, { color: colors.fontWhite }]} />
			<View style={styles.divider} />
			<Text style={[styles.title, { color: colors.fontWhite }]} numberOfLines={1}>
				{roomName || i18n.t('Video_call')}
			</Text>
			{isSplit ? (
				<BarButton icon='arrow-expand' label={i18n.t('Expand')} testID='pexip-call-expand-full' onPress={onExpand} />
			) : null}
			{!isSplit && rid ? <BarButton icon='message' label={i18n.t('Chat')} testID='pexip-call-chat' onPress={onOpenChat} /> : null}
		</View>
	);
};

const styles = StyleSheet.create({
	topBar: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 12,
		gap: 8
	},
	timer: {
		...sharedStyles.textBold,
		fontSize: 16
	},
	divider: {
		backgroundColor: '#6C727A',
		width: StyleSheet.hairlineWidth,
		height: 20
	},
	title: {
		...sharedStyles.textRegular,
		fontSize: 16,
		flex: 1
	},
	button: {
		width: 36,
		height: 36,
		borderRadius: 4,
		alignItems: 'center',
		justifyContent: 'center'
	}
});
