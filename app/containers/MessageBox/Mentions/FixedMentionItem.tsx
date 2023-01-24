import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

import styles from '../styles';
import I18n from '../../../i18n';
import { themes } from '../../../lib/constants';
import { useTheme } from '../../../theme';

interface IMessageBoxFixedMentionItem {
	item: {
		username: string;
	};
	onPress: Function;
}

const FixedMentionItem = ({ item, onPress }: IMessageBoxFixedMentionItem) => {
	const { theme } = useTheme();
	return (
		<TouchableOpacity
			style={[
				styles.mentionItem,
				{
					backgroundColor: themes[theme].auxiliaryBackground,
					borderTopColor: themes[theme].separatorColor
				}
			]}
			onPress={() => onPress(item)}
		>
			<Text style={[styles.fixedMentionAvatar, { color: themes[theme].titleText }]}>{item.username}</Text>
			<Text style={[styles.mentionText, { color: themes[theme].titleText }]}>
				{item.username === 'here' ? I18n.t('Notify_active_in_this_room') : I18n.t('Notify_all_in_this_room')}
			</Text>
		</TouchableOpacity>
	);
};

export default FixedMentionItem;
