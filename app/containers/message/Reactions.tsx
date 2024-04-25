import React, { useContext } from 'react';
import { Text, View } from 'react-native';

import Touchable from './Touchable';
import { CustomIcon } from '../CustomIcon';
import styles from './styles';
import Emoji from './Emoji';
import { BUTTON_HIT_SLOP } from './utils';
import { themes } from '../../lib/constants';
import { TSupportedThemes, useTheme } from '../../theme';
import MessageContext from './Context';
import { TGetCustomEmoji } from '../../definitions/IEmoji';

interface IReaction {
	_id: string;
	emoji: string;
	usernames: string[];
}

interface IMessageReaction {
	reaction: IReaction;
	getCustomEmoji: TGetCustomEmoji;
	theme: TSupportedThemes;
}

interface IMessageReactions {
	reactions?: IReaction[];
	getCustomEmoji: TGetCustomEmoji;
}

const AddReaction = React.memo(({ theme }: { theme: TSupportedThemes }) => {
	const { reactionInit } = useContext(MessageContext);
	return (
		<Touchable
			onPress={reactionInit}
			key='message-add-reaction'
			testID='message-add-reaction'
			style={[styles.reactionButton, { backgroundColor: themes[theme].surfaceRoom }]}
			background={Touchable.Ripple(themes[theme].surfaceNeutral)}
			hitSlop={BUTTON_HIT_SLOP}
		>
			<View style={[styles.reactionContainer, { borderColor: themes[theme].strokeLight }]}>
				<CustomIcon name='reaction-add' size={21} color={themes[theme].badgeBackgroundLevel2} />
			</View>
		</Touchable>
	);
});

const Reaction = React.memo(({ reaction, getCustomEmoji, theme }: IMessageReaction) => {
	const { onReactionPress, onReactionLongPress, user } = useContext(MessageContext);
	const reacted = reaction.usernames.findIndex((item: string) => item === user.username) !== -1;
	return (
		<Touchable
			onPress={() => onReactionPress(reaction.emoji)}
			onLongPress={onReactionLongPress}
			key={reaction.emoji}
			testID={`message-reaction-${reaction.emoji}`}
			style={[styles.reactionButton, { backgroundColor: reacted ? themes[theme].surfaceNeutral : themes[theme].surfaceRoom }]}
			background={Touchable.Ripple(themes[theme].surfaceNeutral)}
			hitSlop={BUTTON_HIT_SLOP}
		>
			<View
				style={[
					styles.reactionContainer,
					{ borderColor: reacted ? themes[theme].badgeBackgroundLevel2 : themes[theme].strokeLight }
				]}
			>
				<Emoji
					content={reaction.emoji}
					standardEmojiStyle={styles.reactionEmoji}
					customEmojiStyle={styles.reactionCustomEmoji}
					getCustomEmoji={getCustomEmoji}
				/>
				<Text style={[styles.reactionCount, { color: themes[theme].badgeBackgroundLevel2 }]}>{reaction.usernames.length}</Text>
			</View>
		</Touchable>
	);
});

const Reactions = React.memo(({ reactions, getCustomEmoji }: IMessageReactions) => {
	const { theme } = useTheme();

	if (!Array.isArray(reactions) || reactions.length === 0) {
		return null;
	}
	return (
		<View style={styles.reactionsContainer}>
			{reactions.map(reaction => (
				<Reaction key={reaction.emoji} reaction={reaction} getCustomEmoji={getCustomEmoji} theme={theme} />
			))}
			<AddReaction theme={theme} />
		</View>
	);
});

Reaction.displayName = 'MessageReaction';
Reactions.displayName = 'MessageReactions';
AddReaction.displayName = 'MessageAddReaction';

export default Reactions;
