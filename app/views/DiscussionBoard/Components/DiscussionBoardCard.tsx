import React from 'react';
import { Text, View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

import { themes } from '../../../lib/constants';
import { useTheme } from '../../../theme';
import { DiscussionBoardCardProps } from '../DiscussionHomeView/interaces';
import { getIcon } from '../helpers';
import IconOrAvatar from '../../../containers/RoomItem/IconOrAvatar';
import { IApplicationState } from '../../../definitions';
import { getUidDirectMessage } from '../../../lib/methods/helpers';
import { useAppSelector } from '../../../lib/hooks';

const hitSlop = { top: 10, right: 10, bottom: 10, left: 10 };
const cardColors = ['magenta', 'mossGreen', 'dreamBlue', 'creamsicleYellow', 'pink', 'superGray', 'forestGreen'];

const DiscussionBoardCard = React.memo(({ item, onPress }: DiscussionBoardCardProps) => {
	const { title, description, saved = false, icon, color, onSaveClick, avatar, f, usersCount } = item;
	// const [savedDiscussion, setSavedDiscussion] = React.useState(saved);
	const {
		// sortBy, showUnread, showFavorites, groupByType,
		displayMode,
		showAvatar
	} = useSelector((state: IApplicationState) => state.sortPreferences);
	const StoreLastMessage = useSelector((state: IApplicationState) => state.settings.Store_Last_Message);

	const id = getUidDirectMessage(item);
	const userStatus = useAppSelector(state => state.activeUsers[id || '']?.status);
	const status = item.t === 'l' ? item.visitor?.status || item.v?.status : userStatus;
	const randomColor = cardColors[Math.floor(Math.random() * cardColors.length)];

	const { colors } = useTheme();
	const theme = 'light';

	return (
		<TouchableOpacity style={styles.mainContainer} onPress={() => onPress && onPress()}>
			<View style={{ ...styles.iconContainer, backgroundColor: themes[theme][randomColor] }}>
				<IconOrAvatar
					displayMode={displayMode}
					avatar={avatar}
					type={item.t}
					rid={item.rid}
					showAvatar={showAvatar}
					prid={item.prid}
					status={status}
					isGroupChat={item.isGrouChat}
					teamMain={item.teamMain}
					showLastMessage={StoreLastMessage}
					displayMode={displayMode}
					sourceType={item.source}
					iconSize={80}
					containerStyles={{ backgroundColor: themes[theme][randomColor] }}
					borderRadius={10}
				/>
			</View>
			<View style={styles.textContainer}>
				<Text style={styles.title}>{title}</Text>
				{description ? (
					<Text style={styles.description}>{`${description?.slice(0, 100)}${description?.length > 100 ? '...' : ''}`}</Text>
				) : (
					<></>
				)}
				<View style={styles.boardMembersContainer}>
					<Image source={getIcon('boardUsers')} style={styles.usersIcon} />
					<Text style={{ color: colors.boardMembersText }}>{usersCount} members</Text>
				</View>
			</View>
			{/* 
			Starring a chat room is not supported yet.
			<TouchableOpacity
				style={styles.savedContainer}
				onPress={() => {
					// setSavedDiscussion(!savedDiscussion);
					onSaveClick && onSaveClick();
				}}
				hitSlop={hitSlop}
			>
				<Image source={f ? getIcon('solidStar') : getIcon('outlineStar')} style={styles.saveIcon} />
			</TouchableOpacity> */}
		</TouchableOpacity>
	);
});

export default DiscussionBoardCard;

const styles = StyleSheet.create({
	mainContainer: {
		width: '100%',
		flexDirection: 'row'
	},
	iconContainer: {
		borderRadius: 10,
		height: 80,
		width: 80,
		justifyContent: 'center',
		alignItems: 'center'
	},
	icon: {
		width: 38,
		height: 38
	},
	textContainer: {
		flex: 1,
		paddingTop: 6,
		marginLeft: 12,
		marginRight: 15
	},
	title: {
		fontFamily: 'Inter',
		fontWeight: '500',
		fontSize: 16,
		lineHeight: 19
	},
	description: {
		fontFamily: 'Inter',
		fontWeight: '400',
		fontSize: 12,
		lineHeight: 15,
		marginTop: 4
	},
	savedContainer: {
		width: 42,
		height: 42,
		marginTop: 10,
		justifyContent: 'center',
		alignItems: 'center'
	},
	saveIcon: {
		width: 42,
		height: 42
	},
	boardMembersContainer: {
		flexDirection: 'row',
		marginTop: 4
	},
	usersIcon: {
		width: 20,
		height: 15,
		marginRight: 8
	}
});
