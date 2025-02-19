import React from 'react';
import { Text, View } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import { useTheme } from '../../../../theme';
import Avatar from '../../../../containers/Avatar';
import { themes } from '../../../../lib/constants';
import { MarkdownPreview } from '../../../../containers/markdown';
import { formatDateThreads, makeThreadName } from '../../../../lib/methods/helpers/room';
import ThreadDetails from '../../../../containers/ThreadDetails';
import { TThreadModel } from '../../../../definitions';
import styles from './styles';

export interface IItem {
	item: TThreadModel;
	useRealName: boolean;
	user: { id: string };
	badgeColor?: string;
	onPress: (item: TThreadModel) => void;
	toggleFollowThread: (isFollowing: boolean, id: string) => void;
}

const Item = ({ item, useRealName, user, badgeColor, onPress, toggleFollowThread }: IItem): React.ReactElement => {
	const { theme } = useTheme();
	const username = (useRealName && item?.u?.name) || item?.u?.username;
	let time;
	if (item?.ts) {
		time = formatDateThreads(item.ts);
	}

	return (
		<Touchable
			onPress={() => onPress(item)}
			testID={`thread-messages-view-${item.msg}`}
			style={{ backgroundColor: themes[theme].surfaceRoom }}>
			<View style={styles.container}>
				<Avatar style={styles.avatar} text={item?.u?.username} size={36} borderRadius={4} />
				<View style={styles.contentContainer}>
					<View style={styles.titleContainer}>
						<Text style={[styles.title, { color: themes[theme].fontTitlesLabels }]} numberOfLines={1}>
							{username}
						</Text>
						<Text style={[styles.time, { color: themes[theme].fontSecondaryInfo }]}>{time}</Text>
					</View>
					<View style={styles.messageContainer}>
						<MarkdownPreview msg={makeThreadName(item)} numberOfLines={2} style={[styles.markdown]} />
						{badgeColor ? <View style={[styles.badge, { backgroundColor: badgeColor }]} /> : null}
					</View>
					<ThreadDetails item={item} user={user} toggleFollowThread={toggleFollowThread} style={styles.threadDetails} />
				</View>
			</View>
		</Touchable>
	);
};

export default Item;
