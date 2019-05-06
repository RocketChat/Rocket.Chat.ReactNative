import React from 'react';
import { View, Text } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import { CustomIcon } from '../../lib/Icons';
import styles from './styles';
import Emoji from './Emoji';
import { BUTTON_HIT_SLOP } from './utils';

const Reaction = React.memo(({
	reaction, user, onReactionLongPress, onReactionPress, customEmojis, baseUrl
}) => {
	const reacted = reaction.usernames.findIndex(item => item.value === user.username) !== -1;
	return (
		<Touchable
			onPress={() => onReactionPress(reaction.emoji)}
			onLongPress={onReactionLongPress}
			key={reaction.emoji}
			testID={`message-reaction-${ reaction.emoji }`}
			style={[styles.reactionButton, reacted && styles.reactionButtonReacted]}
			background={Touchable.Ripple('#fff')}
			hitSlop={BUTTON_HIT_SLOP}
		>
			<View style={[styles.reactionContainer, reacted && styles.reactedContainer]}>
				<Emoji
					content={reaction.emoji}
					customEmojis={customEmojis}
					standardEmojiStyle={styles.reactionEmoji}
					customEmojiStyle={styles.reactionCustomEmoji}
					baseUrl={baseUrl}
				/>
				<Text style={styles.reactionCount}>{ reaction.usernames.length }</Text>
			</View>
		</Touchable>
	);
});

const Reactions = React.memo((props) => {
	if (props.reactions.length === 0) {
		return null;
	}
	return (
		<View style={styles.reactionsContainer}>
			{props.reactions.map(reaction => <Reaction key={reaction.emoji} reaction={reaction} {...props} />)}
			<Touchable
				onPress={props.toggleReactionPicker}
				key='message-add-reaction'
				testID='message-add-reaction'
				style={styles.reactionButton}
				background={Touchable.Ripple('#fff')}
				hitSlop={BUTTON_HIT_SLOP}
			>
				<View style={styles.reactionContainer}>
					<CustomIcon name='add-reaction' size={21} style={styles.addReaction} />
				</View>
			</Touchable>
		</View>
	);
})

export default Reactions;
