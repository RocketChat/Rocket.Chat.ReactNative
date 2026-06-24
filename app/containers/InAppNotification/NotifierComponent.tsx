import { memo } from 'react';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import Avatar from '../Avatar';
import { CustomIcon } from '../CustomIcon';
import sharedStyles from '../../views/Styles';
import { goRoom } from '../../lib/methods/helpers/goRoom';
import { type ISubscription, type SubscriptionType } from '../../definitions';
import { hideNotification } from '../../lib/methods/helpers/notifications';
import { useResponsiveLayout } from '../../lib/hooks/useResponsiveLayout/useResponsiveLayout';
import { withMasterDetail } from '../../lib/hooks/useMasterDetail';
import Touch from '../Touch';

export interface INotifierComponent {
	notification: {
		text: string;
		payload: {
			sender: { username: string };
			type: SubscriptionType;
			message?: { message?: string; msg?: string; t?: string };
		} & Pick<ISubscription, '_id' | 'name' | 'rid' | 'prid'>;
		title: string;
		avatar: string;
	};
	isMasterDetail: boolean;
}

const AVATAR_SIZE = 48;
const BUTTON_HIT_SLOP = { top: 12, right: 12, bottom: 12, left: 12 };

const styles = StyleSheet.create((theme, rt) => ({
	container: {
		paddingHorizontal: 14,
		paddingRight: 30,
		flexDirection: 'row',
		alignItems: 'center',
		marginHorizontal: 10,
		borderWidth: StyleSheet.hairlineWidth,
		borderRadius: 4,
		backgroundColor: theme.colors.surfaceLight,
		borderColor: theme.colors.strokeLight,
		marginTop: rt.insets.top
	},
	content: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	inner: {
		flex: 1,
		marginRight: 10
	},
	avatar: {
		marginRight: 10
	},
	roomName: {
		fontSize: 17,
		lineHeight: 20,
		...sharedStyles.textMedium,
		color: theme.colors.fontTitlesLabels
	},
	message: {
		fontSize: 14,
		lineHeight: 17,
		...sharedStyles.textRegular,
		color: theme.colors.fontTitlesLabels
	},
	small: {
		width: '50%',
		alignSelf: 'center'
	}
}));

const NotifierComponent = memo(({ notification, isMasterDetail }: INotifierComponent) => {
	const { rowHeight } = useResponsiveLayout();
	const { text, payload } = notification;
	const { type, rid } = payload;
	const name = type === 'd' ? payload.sender.username : payload.name;
	// if sub is not on local database, title and avatar will be null, so we use payload from notification
	const { title = name, avatar = name } = notification;

	const onPress = () => {
		const { prid, _id } = payload;
		if (!rid) {
			return;
		}
		const item = {
			rid,
			name: title,
			t: type,
			prid
		};

		goRoom({ item, isMasterDetail, jumpToMessageId: _id });
		hideNotification();
	};

	return (
		<View
			testID={`in-app-notification-${text}`}
			style={[styles.container, isMasterDetail && styles.small, { height: rowHeight }]}>
			<Touch
				style={styles.content}
				rectButtonStyle={styles.content}
				onPress={onPress}
				hitSlop={BUTTON_HIT_SLOP}
				testID={`in-app-notification-${text}`}>
				<Avatar text={avatar} size={AVATAR_SIZE} type={type} rid={rid} style={styles.avatar} />
				<View style={styles.inner}>
					<Text style={styles.roomName} numberOfLines={1}>
						{title}
					</Text>
					<Text style={styles.message} numberOfLines={1}>
						{text}
					</Text>
				</View>
			</Touch>
			<Touch onPress={hideNotification} hitSlop={BUTTON_HIT_SLOP}>
				<CustomIcon name='close' size={20} />
			</Touch>
		</View>
	);
});

export default withMasterDetail(NotifierComponent);
