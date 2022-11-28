import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Touchable from 'react-native-platform-touchable';
import { connect } from 'react-redux';
import { Notifier } from 'react-native-notifier';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Avatar from '../Avatar';
import { CustomIcon } from '../CustomIcon';
import sharedStyles from '../../views/Styles';
import { themes } from '../../lib/constants';
import { useTheme } from '../../theme';
import { ROW_HEIGHT } from '../RoomItem';
import { goRoom } from '../../lib/methods/helpers/goRoom';
import { useOrientation } from '../../dimensions';
import { IApplicationState, ISubscription, SubscriptionType } from '../../definitions';

export interface INotifierComponent {
	notification: {
		text: string;
		payload: {
			sender: { username: string };
			type: SubscriptionType;
		} & Pick<ISubscription, '_id' | 'name' | 'rid' | 'prid'>;
		title: string;
		avatar: string;
	};
	isMasterDetail: boolean;
}

const AVATAR_SIZE = 48;
const BUTTON_HIT_SLOP = { top: 12, right: 12, bottom: 12, left: 12 };

const styles = StyleSheet.create({
	container: {
		height: ROW_HEIGHT,
		paddingHorizontal: 14,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginHorizontal: 10,
		borderWidth: StyleSheet.hairlineWidth,
		borderRadius: 4
	},
	content: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center'
	},
	inner: {
		flex: 1
	},
	avatar: {
		marginRight: 10
	},
	roomName: {
		fontSize: 17,
		lineHeight: 20,
		...sharedStyles.textMedium
	},
	message: {
		fontSize: 14,
		lineHeight: 17,
		...sharedStyles.textRegular
	},
	close: {
		marginLeft: 10
	},
	small: {
		width: '50%',
		alignSelf: 'center'
	}
});

const hideNotification = () => Notifier.hideNotification();

const NotifierComponent = React.memo(({ notification, isMasterDetail }: INotifierComponent) => {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const { isLandscape } = useOrientation();

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

		goRoom({ item, isMasterDetail, jumpToMessageId: _id, popToRoot: true });
		hideNotification();
	};

	return (
		<View
			style={[
				styles.container,
				(isMasterDetail || isLandscape) && styles.small,
				{
					backgroundColor: themes[theme].focusedBackground,
					borderColor: themes[theme].separatorColor,
					marginTop: insets.top
				}
			]}
		>
			<Touchable
				style={styles.content}
				onPress={onPress}
				hitSlop={BUTTON_HIT_SLOP}
				background={Touchable.SelectableBackgroundBorderless()}
				testID={`in-app-notification-${text}`}
			>
				<>
					<Avatar text={avatar} size={AVATAR_SIZE} type={type} rid={rid} style={styles.avatar} />
					<View style={styles.inner}>
						<Text style={[styles.roomName, { color: themes[theme].titleText }]} numberOfLines={1}>
							{title}
						</Text>
						<Text style={[styles.message, { color: themes[theme].titleText }]} numberOfLines={1}>
							{text}
						</Text>
					</View>
				</>
			</Touchable>
			<Touchable onPress={hideNotification} hitSlop={BUTTON_HIT_SLOP} background={Touchable.SelectableBackgroundBorderless()}>
				<CustomIcon name='close' size={20} color={themes[theme].titleText} style={styles.close} />
			</Touchable>
		</View>
	);
});

const mapStateToProps = (state: IApplicationState) => ({
	isMasterDetail: state.app.isMasterDetail
});

export default connect(mapStateToProps)(NotifierComponent);
