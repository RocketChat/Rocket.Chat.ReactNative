import React from 'react';
import { Text } from 'react-native';

import useShortnameToUnicode from '../../lib/hooks/useShortnameToUnicode';
import styles from './styles';
import CustomEmoji from './CustomEmoji';
import { IEmojiProps } from './interfaces';

const Emoji = ({ emoji }: IEmojiProps): React.ReactElement => {
	const { formatShortnameToUnicode } = useShortnameToUnicode(true);
	const unicodeEmoji = formatShortnameToUnicode(`:${emoji}:`);

	if (typeof emoji === 'string') {
		return <Text style={styles.emoji}>{unicodeEmoji}</Text>;
	}
	return <CustomEmoji style={styles.customEmoji} emoji={emoji} />;
};

export default Emoji;
