import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import PropTypes from 'prop-types';

import styles from '../styles';
import I18n from '../../../i18n';

const FixedMentionItem = ({ item, onPress }) => (
	<TouchableOpacity
		style={styles.mentionItem}
		onPress={() => onPress(item)}
	>
		<Text style={styles.fixedMentionAvatar}>{item.username}</Text>
		<Text style={styles.mentionText}>{item.username === 'here' ? I18n.t('Notify_active_in_this_room') : I18n.t('Notify_all_in_this_room')}</Text>
	</TouchableOpacity>
);

FixedMentionItem.propTypes = {
	item: PropTypes.object,
	onPress: PropTypes.func
};

export default FixedMentionItem;
