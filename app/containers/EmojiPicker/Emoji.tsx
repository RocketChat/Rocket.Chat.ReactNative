import { Text } from 'react-native';
import { type ReactElement } from 'react';

import useShortnameToUnicode from '../../lib/hooks/useShortnameToUnicode';
import styles from './styles';
import CustomEmoji from './CustomEmoji';
import { type IEmojiProps } from './interfaces';

export const Emoji = ({ emoji }: IEmojiProps): ReactElement => {
	const { formatShortnameToUnicode } = useShortnameToUnicode(true);
	const unicodeEmoji = formatShortnameToUnicode(`:${emoji}:`);

	if (typeof emoji === 'string') {
		return <Text style={styles.categoryEmoji}>{unicodeEmoji}</Text>;
	}
	return <CustomEmoji style={styles.customCategoryEmoji} emoji={emoji} />;
};
