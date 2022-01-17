import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import { withTheme } from '../../theme';
import Avatar from '../../containers/Avatar';
import sharedStyles from '../Styles';
import { themes } from '../../constants/colors';
import Markdown from '../../containers/markdown';
import { formatDateThreads, makeThreadName } from '../../utils/room';
import ThreadDetails from '../../containers/ThreadDetails';
import { TThreadModel } from '../../definitions/IThread';

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		padding: 16
	},
	contentContainer: {
		flexDirection: 'column',
		flex: 1
	},
	titleContainer: {
		flexDirection: 'row',
		marginBottom: 2,
		alignItems: 'center'
	},
	title: {
		flexShrink: 1,
		fontSize: 18,
		...sharedStyles.textMedium
	},
	time: {
		fontSize: 14,
		marginLeft: 4,
		...sharedStyles.textRegular
	},
	avatar: {
		marginRight: 8
	},
	threadDetails: {
		marginTop: 8
	},
	badge: {
		width: 8,
		height: 8,
		borderRadius: 4,
		marginHorizontal: 8,
		alignSelf: 'center'
	},
	messageContainer: {
		flexDirection: 'row'
	},
	markdown: {
		flex: 1
	}
});

interface IItem {
	item: TThreadModel;
	baseUrl: string;
	theme?: string;
	useRealName: boolean;
	user: any;
	badgeColor?: string;
	onPress: (item: TThreadModel) => void;
	toggleFollowThread: (isFollowing: boolean, id: string) => void;
}

const Item = ({ item, baseUrl, theme, useRealName, user, badgeColor, onPress, toggleFollowThread }: IItem) => {
	const username = (useRealName && item?.u?.name) || item?.u?.username;
	let time;
	if (item?.ts) {
		time = formatDateThreads(item.ts);
	}

	return (
		<Touchable
			onPress={() => onPress(item)}
			testID={`thread-messages-view-${item.msg}`}
			style={{ backgroundColor: themes[theme!].backgroundColor }}>
			<View style={styles.container}>
				<Avatar style={styles.avatar} text={item?.u?.username} size={36} borderRadius={4} theme={theme} />
				<View style={styles.contentContainer}>
					<View style={styles.titleContainer}>
						<Text style={[styles.title, { color: themes[theme!].titleText }]} numberOfLines={1}>
							{username}
						</Text>
						<Text style={[styles.time, { color: themes[theme!].auxiliaryText }]}>{time}</Text>
					</View>
					<View style={styles.messageContainer}>
						<Markdown
							// @ts-ignore
							msg={makeThreadName(item)}
							baseUrl={baseUrl}
							username={username!}
							theme={theme!}
							numberOfLines={2}
							style={[styles.markdown]}
							preview
						/>
						{badgeColor ? <View style={[styles.badge, { backgroundColor: badgeColor }]} /> : null}
					</View>
					<ThreadDetails item={item} user={user} toggleFollowThread={toggleFollowThread} style={styles.threadDetails} />
				</View>
			</View>
		</Touchable>
	);
};

export default withTheme(Item);
