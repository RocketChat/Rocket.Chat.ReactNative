import React from 'react';
import { Text } from 'react-native';

import shortnameToUnicode from '../../lib/methods/helpers/shortnameToUnicode';
import styles from './styles';
import CustomEmoji from './CustomEmoji';
import { IEmoji } from '../../definitions/IEmoji';

interface IEmojiProps {
	emoji: IEmoji;
}

export const Emoji = ({ emoji }: IEmojiProps): React.ReactElement => {
	if (typeof emoji === 'string') {
		return <Text style={styles.categoryEmoji}>{shortnameToUnicode(`:${emoji}:`)}</Text>;
	}
	return <CustomEmoji style={styles.customCategoryEmoji} emoji={emoji} />;
};
