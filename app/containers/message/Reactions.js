import React from 'react';
import { View, Text } from 'react-native';
import Touchable from 'react-native-platform-touchable';
import PropTypes from 'prop-types';

import { CustomIcon } from '../../lib/Icons';
import styles from './styles';
import Emoji from './Emoji';
import { BUTTON_HIT_SLOP } from './utils';

const AddReaction = React.memo(({ toggleReactionPicker }) => (
	<Touchable
		onPress={toggleReactionPicker}
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
));

const Reaction = React.memo(({
	reaction, user, onReactionLongPress, onReactionPress, baseUrl
}) => {
	const reacted = reaction.usernames.findIndex(item => item === user.username) !== -1;
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
					standardEmojiStyle={styles.reactionEmoji}
					customEmojiStyle={styles.reactionCustomEmoji}
					baseUrl={baseUrl}
				/>
				<Text style={styles.reactionCount}>{ reaction.usernames.length }</Text>
			</View>
		</Touchable>
	);
}, () => true);

const Reactions = React.memo(({
	reactions, user, baseUrl, onReactionPress, toggleReactionPicker, onReactionLongPress
}) => {
	if (!reactions || reactions.length === 0) {
		return null;
	}
	return (
		<View style={styles.reactionsContainer}>
			{reactions.map(reaction => (
				<Reaction
					key={reaction.emoji}
					reaction={reaction}
					user={user}
					baseUrl={baseUrl}
					onReactionLongPress={onReactionLongPress}
					onReactionPress={onReactionPress}
				/>
			))}
			<AddReaction toggleReactionPicker={toggleReactionPicker} />
		</View>
	);
});
// FIXME: can't compare because it's a Realm object (it may be fixed by JSON.parse(JSON.stringify(reactions)))

Reaction.propTypes = {
	reaction: PropTypes.object,
	user: PropTypes.object,
	baseUrl: PropTypes.string,
	onReactionPress: PropTypes.func,
	onReactionLongPress: PropTypes.func
};
Reaction.displayName = 'MessageReaction';

Reactions.propTypes = {
	reactions: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
	user: PropTypes.object,
	baseUrl: PropTypes.string,
	onReactionPress: PropTypes.func,
	toggleReactionPicker: PropTypes.func,
	onReactionLongPress: PropTypes.func
};
Reactions.displayName = 'MessageReactions';

AddReaction.propTypes = {
	toggleReactionPicker: PropTypes.func
};
AddReaction.displayName = 'MessageAddReaction';

export default Reactions;
