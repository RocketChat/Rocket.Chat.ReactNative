import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import PropTypes from 'prop-types';
import Touchable from 'react-native-platform-touchable';
import { connect } from 'react-redux';
import { Notifier } from 'react-native-notifier';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Avatar from '../Avatar';
import { CustomIcon } from '../../lib/Icons';
import sharedStyles from '../../views/Styles';
import { themes } from '../../constants/colors';
import { useTheme } from '../../theme';
import { ROW_HEIGHT } from '../../presentation/RoomItem';
import { goRoom } from '../../utils/goRoom';
import Navigation from '../../lib/Navigation';
import { useOrientation } from '../../dimensions';

const AVATAR_SIZE = 48;
const BUTTON_HIT_SLOP = {
	top: 12, right: 12, bottom: 12, left: 12
};

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

const NotifierComponent = React.memo(({ notification, isMasterDetail }) => {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const { isLandscape } = useOrientation();

	const { text, payload } = notification;
	const { type, rid } = payload;
	const name = type === 'd' ? payload.sender.username : payload.name;
	// if sub is not on local database, title and avatar will be null, so we use payload from notification
	const { title = name, avatar = name } = notification;

	const onPress = () => {
		const { prid } = payload;
		if (!rid) {
			return;
		}
		const item = {
			rid, name: title, t: type, prid
		};

		if (isMasterDetail) {
			Navigation.navigate('DrawerNavigator');
		} else {
			Navigation.navigate('RoomsListView');
		}
		goRoom({ item, isMasterDetail });
		hideNotification();
	};

	return (
		<View style={[
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
			>
				<>
					<Avatar text={avatar} size={AVATAR_SIZE} type={type} rid={rid} style={styles.avatar} />
					<View style={styles.inner}>
						<Text style={[styles.roomName, { color: themes[theme].titleText }]} numberOfLines={1}>{title}</Text>
						<Text style={[styles.message, { color: themes[theme].titleText }]} numberOfLines={1}>{text}</Text>
					</View>
				</>
			</Touchable>
			<Touchable
				onPress={hideNotification}
				hitSlop={BUTTON_HIT_SLOP}
				background={Touchable.SelectableBackgroundBorderless()}
			>
				<CustomIcon name='close' style={[styles.close, { color: themes[theme].titleText }]} size={20} />
			</Touchable>
		</View>
	);
});

NotifierComponent.propTypes = {
	notification: PropTypes.object,
	isMasterDetail: PropTypes.bool
};

const mapStateToProps = state => ({
	isMasterDetail: state.app.isMasterDetail
});

export default connect(mapStateToProps)(NotifierComponent);
