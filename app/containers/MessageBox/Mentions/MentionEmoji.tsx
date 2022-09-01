import React, { useContext } from 'react';
import { Text } from 'react-native';

import { IEmoji } from '../../../definitions/IEmoji';
import shortnameToUnicode from '../../../lib/methods/helpers/shortnameToUnicode';
import CustomEmoji from '../../EmojiPicker/CustomEmoji';
import MessageboxContext from '../Context';
import styles from '../styles';

interface IMessageBoxMentionEmoji {
	item: IEmoji;
}

const MentionEmoji = ({ item }: IMessageBoxMentionEmoji) => {
	const context = useContext(MessageboxContext);
	const { baseUrl } = context;

	if (typeof item === 'string') {
		return <Text style={styles.mentionItemEmoji}>{shortnameToUnicode(`:${item}:`)}</Text>;
	}
	return <CustomEmoji style={styles.mentionItemCustomEmoji} emoji={item} baseUrl={baseUrl} />;
};

export default MentionEmoji;
