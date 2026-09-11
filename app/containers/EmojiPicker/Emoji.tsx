import { type ReactElement } from 'react';
import { Text } from 'react-native';

import useShortnameToUnicode from '../../lib/hooks/useShortnameToUnicode';
import { useCustomEmoji } from '../../lib/hooks/useCustomEmoji';
import styles from './styles';
import CustomEmoji from './CustomEmoji';
import { type IEmojiProps } from './interfaces';

export const Emoji = ({ emoji }: IEmojiProps): ReactElement => {
	const { formatShortnameToUnicode } = useShortnameToUnicode(true);
	const getCustomEmoji = useCustomEmoji();
	const customEmoji = typeof emoji === 'string' ? getCustomEmoji(emoji) : emoji;

	if (customEmoji) {
		return <CustomEmoji style={styles.customCategoryEmoji} emoji={customEmoji} />;
	}
	return <Text style={styles.categoryEmoji}>{formatShortnameToUnicode(`:${emoji}:`)}</Text>;
};
