import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import { useTheme } from '../../theme';
import Avatar from '../../containers/Avatar';
import sharedStyles from '../Styles';
import { themes } from '../../constants/colors';
import Markdown from '../../containers/markdown';
import { formatDateThreads, makeThreadName } from '../../utils/room';
import DiscussionDetails from './DiscussionDetails';

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
		justifyContent: 'space-between'
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
	discussionDetails: {
		marginTop: 8
	},
	messageContainer: {
		flexDirection: 'row'
	},
	markdown: {
		flex: 1
	}
});

interface IItem {
	item: {
		id: string;
		u: {
			username: string;
		};
		dcount: string | number;
		replies?: any;
		msg: string;
		ts: string;
	};
	baseUrl: string;
	user: {
		id: string;
		token: string;
	};
	onPress: {
		(...args: any[]): void;
		stop(): void;
	};
}

const Item = ({ item, baseUrl, user, onPress }: IItem): JSX.Element => {
	const { theme } = useTheme();
	const username = item?.u?.username;
	const date = formatDateThreads(item.ts);

	return (
		<Touchable
			onPress={() => onPress(item)}
			testID={`discussions-view-${item.msg}`}
			style={{ backgroundColor: themes[theme!].backgroundColor }}>
			<View style={styles.container}>
				<Avatar style={styles.avatar} text={item?.u?.username} size={36} borderRadius={4} theme={theme} />
				<View style={styles.contentContainer}>
					<View style={styles.titleContainer}>
						<Text style={[styles.title, { color: themes[theme!].titleText }]} numberOfLines={1}>
							{username}
						</Text>
						<Text style={[styles.time, { color: themes[theme!].auxiliaryText }]}>{date}</Text>
					</View>
					<View style={styles.messageContainer}>
						{/* @ts-ignore */}
						<Markdown
							msg={makeThreadName(item)}
							baseUrl={baseUrl}
							username={username}
							theme={theme!}
							numberOfLines={2}
							style={[styles.markdown]}
							preview
						/>
					</View>
					<DiscussionDetails item={item} user={user} time={date} style={styles.discussionDetails} />
				</View>
			</View>
		</Touchable>
	);
};

export default Item;
