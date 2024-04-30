import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Touchable from 'react-native-platform-touchable';
import moment from 'moment';

import { useTheme } from '../../theme';
import Avatar from '../../containers/Avatar';
import sharedStyles from '../Styles';
import { MarkdownPreview } from '../../containers/markdown';
import { formatDateThreads, makeThreadName } from '../../lib/methods/helpers/room';
import DiscussionDetails from './DiscussionDetails';
import { IMessageFromServer } from '../../definitions';

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
	messageContainer: {
		flexDirection: 'row'
	},
	markdown: {
		flex: 1
	}
});

export interface IItem {
	item: IMessageFromServer;
	onPress: Function;
}

const Item = ({ item, onPress }: IItem): React.ReactElement => {
	const { colors } = useTheme();
	const username = item?.u?.username;
	let messageTime = '';
	let messageDate = '';

	if (item?.ts) {
		messageTime = moment(item.ts).format('LT');
		messageDate = formatDateThreads(item.ts);
	}

	return (
		<Touchable
			onPress={() => onPress(item)}
			testID={`discussions-view-${item.msg}`}
			style={{ backgroundColor: colors.surfaceRoom }}
		>
			<View style={styles.container}>
				<Avatar style={styles.avatar} text={item?.u?.username} size={36} borderRadius={4} />
				<View style={styles.contentContainer}>
					<View style={styles.titleContainer}>
						<Text style={[styles.title, { color: colors.fontTitlesLabels }]} numberOfLines={1}>
							{username}
						</Text>
						{messageTime ? <Text style={[styles.time, { color: colors.fontSecondaryInfo }]}>{messageTime}</Text> : null}
					</View>
					<View style={styles.messageContainer}>
						{username ? <MarkdownPreview msg={makeThreadName(item)} numberOfLines={2} style={[styles.markdown]} /> : null}
					</View>
					{messageDate ? <DiscussionDetails item={item} date={messageDate} /> : null}
				</View>
			</View>
		</Touchable>
	);
};

export default Item;
