import React, { useContext } from 'react';
import { Text, TouchableOpacity } from 'react-native';

import { themes } from '../../../lib/constants';
import { IEmoji } from '../../../definitions/IEmoji';
import { useTheme } from '../../../theme';
import Avatar from '../../Avatar';
import { MENTIONS_TRACKING_TYPE_CANNED, MENTIONS_TRACKING_TYPE_COMMANDS, MENTIONS_TRACKING_TYPE_EMOJIS } from '../constants';
import MessageboxContext from '../Context';
import styles from '../styles';
import FixedMentionItem from './FixedMentionItem';
import MentionEmoji from './MentionEmoji';

interface IMessageBoxMentionItem {
	item: {
		name: string;
		command: string;
		username: string;
		t: string;
		id: string;
		shortcut: string;
		text: string;
	} & IEmoji;
	trackingType: string;
}

const MentionItemContent = React.memo(({ trackingType, item }: IMessageBoxMentionItem) => {
	const { theme } = useTheme();
	switch (trackingType) {
		case MENTIONS_TRACKING_TYPE_EMOJIS:
			return (
				<>
					<MentionEmoji item={item} />
					<Text style={[styles.mentionText, { color: themes[theme].titleText }]}>:{item.name || item}:</Text>
				</>
			);
		case MENTIONS_TRACKING_TYPE_COMMANDS:
			return (
				<>
					<Text style={[styles.slash, { backgroundColor: themes[theme].borderColor, color: themes[theme].tintColor }]}>/</Text>
					<Text style={[styles.mentionText, { color: themes[theme].titleText }]}>{item.id}</Text>
				</>
			);
		case MENTIONS_TRACKING_TYPE_CANNED:
			return (
				<>
					<Text style={[styles.cannedItem, { color: themes[theme].titleText }]}>!{item.shortcut}</Text>
					<Text numberOfLines={1} style={[styles.cannedMentionText, { color: themes[theme].auxiliaryTintColor }]}>
						{item.text}
					</Text>
				</>
			);

		default:
			return (
				<>
					<Avatar style={styles.avatar} text={item.username || item.name} size={30} type={item.t} />
					<Text style={[styles.mentionText, { color: themes[theme].titleText }]}>{item.username || item.name || item}</Text>
				</>
			);
	}
});

const MentionItem = ({ item, trackingType }: IMessageBoxMentionItem) => {
	const context = useContext(MessageboxContext);
	const { theme } = useTheme();
	const { onPressMention } = context;

	const defineTestID = (type: string) => {
		switch (type) {
			case MENTIONS_TRACKING_TYPE_EMOJIS:
				return `mention-item-${item.name || item}`;
			case MENTIONS_TRACKING_TYPE_COMMANDS:
				return `mention-item-${item.command || item}`;
			case MENTIONS_TRACKING_TYPE_CANNED:
				return `mention-item-${item.shortcut || item}`;
			default:
				return `mention-item-${item.username || item.name || item}`;
		}
	};

	const testID = defineTestID(trackingType);

	if (item.username === 'all' || item.username === 'here') {
		return <FixedMentionItem item={item} onPress={onPressMention} />;
	}

	return (
		<TouchableOpacity
			style={[
				styles.mentionItem,
				{
					backgroundColor: themes[theme].auxiliaryBackground,
					borderTopColor: themes[theme].separatorColor
				}
			]}
			onPress={() => onPressMention(item)}
			testID={testID}
		>
			<MentionItemContent item={item} trackingType={trackingType} />
		</TouchableOpacity>
	);
};

export default MentionItem;
