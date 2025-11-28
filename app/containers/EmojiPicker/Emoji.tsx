import React from 'react';

import styles from './styles';
import { type IEmojiProps } from './interfaces';
import SharedEmoji from '../Emoji/Emoji';

export const Emoji = ({ emoji }: IEmojiProps): React.ReactElement => {
	if (typeof emoji === 'string') {
		return <SharedEmoji literal={`:${emoji}:`} style={styles.categoryEmoji} />;
	}
	return <SharedEmoji customEmoji={emoji} style={styles.customCategoryEmoji} />;
};
