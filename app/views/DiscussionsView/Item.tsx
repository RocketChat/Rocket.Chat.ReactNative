import { type ReactElement } from 'react';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import dayjs from '../../lib/dayjs';
import Avatar from '../../containers/Avatar';
import sharedStyles from '../Styles';
import { MarkdownPreview } from '../../containers/markdown';
import { formatDateThreads, makeThreadName } from '../../lib/methods/helpers/room';
import DiscussionDetails from './DiscussionDetails';
import { type IMessageFromServer } from '../../definitions';
import Touch from '../../containers/Touch';

const styles = StyleSheet.create(theme => ({
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
		...sharedStyles.textMedium,
		color: theme.colors.fontTitlesLabels
	},
	time: {
		fontSize: 14,
		marginLeft: 4,
		...sharedStyles.textRegular,
		color: theme.colors.fontSecondaryInfo
	},
	avatar: {
		marginRight: 8
	},
	messageContainer: {
		flexDirection: 'row'
	},
	markdown: {
		flex: 1
	},
	touchable: {
		backgroundColor: theme.colors.surfaceRoom
	}
}));

export interface IItem {
	item: IMessageFromServer;
	onPress: Function;
}

const Item = ({ item, onPress }: IItem): ReactElement => {
	const username = item?.u?.username;
	let messageTime = '';
	let messageDate = '';

	if (item?.ts) {
		messageTime = dayjs(item.ts).format('LT');
		messageDate = formatDateThreads(item.ts);
	}

	return (
		<Touch onPress={() => onPress(item)} testID={`discussions-view-${item.msg}`} style={styles.touchable}>
			<View style={styles.container}>
				<Avatar style={styles.avatar} text={item?.u?.username} size={36} borderRadius={4} />
				<View style={styles.contentContainer}>
					<View style={styles.titleContainer}>
						<Text style={styles.title} numberOfLines={1}>
							{username}
						</Text>
						{messageTime ? <Text style={styles.time}>{messageTime}</Text> : null}
					</View>
					<View style={styles.messageContainer}>
						{username ? <MarkdownPreview msg={makeThreadName(item)} numberOfLines={2} style={styles.markdown} /> : null}
					</View>
					{messageDate ? <DiscussionDetails item={item} date={messageDate} /> : null}
				</View>
			</View>
		</Touch>
	);
};

export default Item;
