import React from 'react';
import { Text } from 'react-native';

import useShortnameToUnicode from 'lib/hooks/useShortnameToUnicode';
import styles from './styles';
import CustomEmoji from './CustomEmoji';
import { IEmojiProps } from './interfaces';

export const Emoji = ({ emoji }: IEmojiProps): React.ReactElement => {
	const shortnameToUnicode = useShortnameToUnicode(`:${emoji}:`, true);
	if (typeof emoji === 'string') {
		return <Text style={styles.categoryEmoji}>{shortnameToUnicode}</Text>;
	}
	return <CustomEmoji style={styles.customCategoryEmoji} emoji={emoji} />;
};
