import React from 'react';
import { Text } from 'react-native';

import { IEmoji } from '../../../definitions/IEmoji';
import shortnameToUnicode from '../../../lib/methods/helpers/shortnameToUnicode';
import CustomEmoji from '../../EmojiPicker/CustomEmoji';
import styles from '../styles';

interface IMessageBoxMentionEmoji {
	item: IEmoji;
}

const MentionEmoji = ({ item }: IMessageBoxMentionEmoji) => {
	if (typeof item === 'string') {
		return <Text style={styles.mentionItemEmoji}>{shortnameToUnicode(`:${item}:`)}</Text>;
	}
	return <CustomEmoji style={styles.mentionItemCustomEmoji} emoji={item} />;
};

export default MentionEmoji;
