import { Text, useWindowDimensions, View } from 'react-native';

import I18n from '../../../i18n';
import MessageActionTouchable from './Touchable/MessageActionTouchable';
import { CustomIcon } from '../../CustomIcon';
import styles from '../styles';
import Emoji from './Emoji';
import { BUTTON_HIT_SLOP } from '../utils';
import { useTheme } from '../../../theme';
import { useMessageId, useMessageItem, useReactions } from '../stores/MessageStore';
import { useMessageUser, useReactionInit, useOnReactionPress, useOnReactionLongPress } from '../stores/MessageRoomStore';

interface IReaction {
	_id: string;
	emoji: string;
	usernames: string[];
}

interface IMessageReaction {
	reaction: IReaction;
}

const AddReaction = () => {
	'use memo';

	const { colors } = useTheme();
	const reactionInit = useReactionInit();
	const id = useMessageId();
	const { fontScale } = useWindowDimensions();
	const height = 28 * fontScale;
	return (
		<MessageActionTouchable
			onPress={() => reactionInit?.(id)}
			key='message-add-reaction'
			testID='message-add-reaction'
			accessibilityRole='button'
			accessibilityLabel={I18n.t('Add_reaction')}
			style={[styles.reactionButton, { backgroundColor: colors.surfaceRoom }]}
			hitSlop={BUTTON_HIT_SLOP}
			android_ripple={{ color: colors.strokeLight }}>
			<View style={[styles.reactionContainer, { borderColor: colors.strokeLight, height }]}>
				<CustomIcon name='reaction-add' size={20} color={colors.badgeBackgroundLevel2} />
			</View>
		</MessageActionTouchable>
	);
};

const Reaction = ({ reaction }: IMessageReaction) => {
	'use memo';

	const { colors } = useTheme();
	const item = useMessageItem();
	const id = useMessageId();
	const onReactionPress = useOnReactionPress();
	const onReactionLongPress = useOnReactionLongPress();
	const user = useMessageUser();
	const { fontScale } = useWindowDimensions();
	const height = 28 * fontScale;
	const reacted = reaction.usernames.findIndex((item: string) => item === user?.username) !== -1;
	return (
		<MessageActionTouchable
			onPress={() => onReactionPress?.(reaction.emoji, id)}
			onLongPress={() => onReactionLongPress?.(item)}
			key={reaction.emoji}
			testID={`message-reaction-${reaction.emoji}`}
			accessibilityRole='button'
			accessibilityLabel={`${reaction.emoji}, ${reaction.usernames.length}`}
			accessibilityState={{ selected: reacted }}
			style={[styles.reactionButton, { backgroundColor: reacted ? colors.surfaceNeutral : colors.surfaceRoom }]}
			hitSlop={BUTTON_HIT_SLOP}
			android_ripple={{ color: colors.strokeLight }}>
			<View
				style={[styles.reactionContainer, { borderColor: reacted ? colors.badgeBackgroundLevel2 : colors.strokeLight, height }]}>
				<Emoji content={reaction.emoji} standardEmojiStyle={styles.reactionEmoji} customEmojiStyle={styles.reactionCustomEmoji} />
				<Text style={[styles.reactionCount, { color: colors.badgeBackgroundLevel2 }]}>{reaction.usernames.length}</Text>
			</View>
		</MessageActionTouchable>
	);
};

const Reactions = () => {
	'use memo';

	const reactions = useReactions();

	if (!Array.isArray(reactions) || reactions.length === 0) {
		return null;
	}
	return (
		<View style={styles.reactionsContainer}>
			{reactions.map(reaction => (
				<Reaction key={reaction.emoji} reaction={reaction} />
			))}
			<AddReaction />
		</View>
	);
};

export default Reactions;
