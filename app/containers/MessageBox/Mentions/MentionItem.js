import React, { useContext } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import PropTypes from 'prop-types';

import styles from '../styles';
import Avatar from '../../Avatar';
import MessageboxContext from '../Context';
import FixedMentionItem from './FixedMentionItem';
import MentionEmoji from './MentionEmoji';
import {
	MENTIONS_TRACKING_TYPE_EMOJIS,
	MENTIONS_TRACKING_TYPE_COMMANDS
} from '../constants';

const MentionItem = ({
	item, trackingType
}) => {
	const context = useContext(MessageboxContext);
	const { baseUrl, user, onPressMention } = context;

	const defineTestID = (type) => {
		switch (type) {
			case MENTIONS_TRACKING_TYPE_EMOJIS:
				return `mention-item-${ item.name || item }`;
			case MENTIONS_TRACKING_TYPE_COMMANDS:
				return `mention-item-${ item.command || item }`;
			default:
				return `mention-item-${ item.username || item.name || item }`;
		}
	};

	const testID = defineTestID(trackingType);

	if (item.username === 'all' || item.username === 'here') {
		return <FixedMentionItem item={item} onPress={onPressMention} />;
	}

	let content = (
		<>
			<Avatar
				style={styles.avatar}
				text={item.username || item.name}
				size={30}
				type={item.t}
				baseUrl={baseUrl}
				userId={user.id}
				token={user.token}
			/>
			<Text style={styles.mentionText}>{ item.username || item.name || item }</Text>
		</>
	);

	if (trackingType === MENTIONS_TRACKING_TYPE_EMOJIS) {
		content = (
			<>
				<MentionEmoji item={item} />
				<Text style={styles.mentionText}>:{ item.name || item }:</Text>
			</>
		);
	}

	if (trackingType === MENTIONS_TRACKING_TYPE_COMMANDS) {
		content = (
			<>
				<Text style={styles.slash}>/</Text>
				<Text>{ item.command}</Text>
			</>
		);
	}

	return (
		<TouchableOpacity
			style={styles.mentionItem}
			onPress={() => onPressMention(item)}
			testID={testID}
		>
			{content}
		</TouchableOpacity>
	);
};

MentionItem.propTypes = {
	item: PropTypes.object,
	trackingType: PropTypes.string
};

export default MentionItem;
