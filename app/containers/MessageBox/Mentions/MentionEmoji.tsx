import React, { useContext } from 'react';
import { Text } from 'react-native';

import { IEmoji } from '../../../definitions/IEmoji';
import shortnameToUnicode from '../../../utils/shortnameToUnicode';
import CustomEmoji from '../../EmojiPicker/CustomEmoji';
import MessageboxContext from '../Context';
import styles from '../styles';

interface IMessageBoxMentionEmoji {
	item: IEmoji;
}

const MentionEmoji = ({ item }: IMessageBoxMentionEmoji) => {
	const context = useContext(MessageboxContext);
	const { baseUrl } = context;

	if (item.name) {
		return <CustomEmoji style={styles.mentionItemCustomEmoji} emoji={item} baseUrl={baseUrl} />;
	}
	return <Text style={styles.mentionItemEmoji}>{shortnameToUnicode(`:${item}:`)}</Text>;
};

export default MentionEmoji;
