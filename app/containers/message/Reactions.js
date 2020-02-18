import React from 'react';
import { View, Text } from 'react-native';
import Touchable from 'react-native-platform-touchable';
import PropTypes from 'prop-types';

import { CustomIcon } from '../../lib/Icons';
import styles from './styles';
import Emoji from './Emoji';
import { BUTTON_HIT_SLOP } from './utils';
import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';

const AddReaction = React.memo(({ reactionInit, theme }) => (
	<Touchable
		onPress={reactionInit}
		key='message-add-reaction'
		testID='message-add-reaction'
		style={[styles.reactionButton, { backgroundColor: themes[theme].backgroundColor }]}
		background={Touchable.Ripple(themes[theme].bannerBackground)}
		hitSlop={BUTTON_HIT_SLOP}
	>
		<View style={[styles.reactionContainer, { borderColor: themes[theme].borderColor }]}>
			<CustomIcon name='add-reaction' size={21} color={themes[theme].tintColor} />
		</View>
	</Touchable>
));

const Reaction = React.memo(({
	reaction, user, onReactionLongPress, onReactionPress, baseUrl, getCustomEmoji, theme
}) => {
	const reacted = reaction.usernames.findIndex(item => item === user.username) !== -1;
	return (
		<Touchable
			onPress={() => onReactionPress(reaction.emoji)}
			onLongPress={onReactionLongPress}
			key={reaction.emoji}
			testID={`message-reaction-${ reaction.emoji }`}
			style={[styles.reactionButton, { backgroundColor: reacted ? themes[theme].bannerBackground : themes[theme].backgroundColor }]}
			background={Touchable.Ripple(themes[theme].bannerBackground)}
			hitSlop={BUTTON_HIT_SLOP}
		>
			<View style={[styles.reactionContainer, { borderColor: reacted ? themes[theme].tintColor : themes[theme].borderColor }]}>
				<Emoji
					content={reaction.emoji}
					standardEmojiStyle={styles.reactionEmoji}
					customEmojiStyle={styles.reactionCustomEmoji}
					baseUrl={baseUrl}
					getCustomEmoji={getCustomEmoji}
				/>
				<Text style={[styles.reactionCount, { color: themes[theme].tintColor }]}>{ reaction.usernames.length }</Text>
			</View>
		</Touchable>
	);
});

const Reactions = React.memo(({
	reactions, user, baseUrl, onReactionPress, reactionInit, onReactionLongPress, getCustomEmoji, theme
}) => {
	if (!Array.isArray(reactions) || reactions.length === 0) {
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
					getCustomEmoji={getCustomEmoji}
					theme={theme}
				/>
			))}
			<AddReaction reactionInit={reactionInit} theme={theme} />
		</View>
	);
});

Reaction.propTypes = {
	reaction: PropTypes.object,
	user: PropTypes.object,
	baseUrl: PropTypes.string,
	onReactionPress: PropTypes.func,
	onReactionLongPress: PropTypes.func,
	getCustomEmoji: PropTypes.func,
	theme: PropTypes.string
};
Reaction.displayName = 'MessageReaction';

Reactions.propTypes = {
	reactions: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
	user: PropTypes.object,
	baseUrl: PropTypes.string,
	onReactionPress: PropTypes.func,
	reactionInit: PropTypes.func,
	onReactionLongPress: PropTypes.func,
	getCustomEmoji: PropTypes.func,
	theme: PropTypes.string
};
Reactions.displayName = 'MessageReactions';

AddReaction.propTypes = {
	reactionInit: PropTypes.func,
	theme: PropTypes.string
};
AddReaction.displayName = 'MessageAddReaction';

export default withTheme(Reactions);
