import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import PropTypes from 'prop-types';

import styles from '../styles';
import I18n from '../../../i18n';
import { themes } from '../../../constants/colors';

const FixedMentionItem = ({ item, onPress, theme }) => (
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

FixedMentionItem.propTypes = {
	item: PropTypes.object,
	onPress: PropTypes.func,
	theme: PropTypes.string
};

export default FixedMentionItem;
