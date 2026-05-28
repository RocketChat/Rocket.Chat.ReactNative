import React from 'react';

import styles from './styles';
import { type IEmoji } from '../../definitions/IEmoji';
import { Emoji } from './Emoji';
import Touch from '../Touch';

export const PressableEmoji = ({ emoji, onPress }: { emoji: IEmoji; onPress: (emoji: IEmoji) => void }): React.ReactElement => {
	const accessibilityLabel = typeof emoji === 'string' ? emoji : emoji.name;
	return (
		<Touch
			accessible
			accessibilityLabel={accessibilityLabel}
			key={typeof emoji === 'string' ? emoji : emoji.name}
			onPress={() => onPress(emoji)}
			style={styles.emojiButton}
			testID={`emoji-${typeof emoji === 'string' ? emoji : emoji.name}`}>
			<Emoji emoji={emoji} />
		</Touch>
	);
};
