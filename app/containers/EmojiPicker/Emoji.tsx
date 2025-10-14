import React from 'react';

import Emoji from '../../components/Emoji/Emoji';
import { IEmojiProps } from './interfaces';
import styles from './styles';

export const EmojiPickerEmoji = ({ emoji }: IEmojiProps): React.ReactElement => (
	<Emoji emoji={emoji} style={typeof emoji === 'string' ? styles.categoryEmoji : styles.customCategoryEmoji} />
);

export { Emoji };
