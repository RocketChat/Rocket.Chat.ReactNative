import React from 'react';
import { View } from 'react-native';

import EmojiPicker from '../../containers/EmojiPicker';
import styles from './styles';
import { IEmoji } from '../../definitions';
import { EventTypes } from '../../containers/EmojiPicker/interfaces';
import { searchEmojis } from '../../lib/methods';
import { useDebounce } from '../../lib/methods/helpers/debounce';
import { EmojiSearch } from '../../containers/EmojiPicker/EmojiSearch';
import { events, logEvent } from '../../lib/methods/helpers/log';

interface IReactionPickerProps {
	messageId?: string;
	reactionClose: () => void;
	onEmojiSelected: (emoji: IEmoji, id: string) => void;
}

const ReactionPicker = ({ onEmojiSelected, messageId, reactionClose }: IReactionPickerProps): React.ReactElement => {
	const [searchedEmojis, setSearchedEmojis] = React.useState<IEmoji[]>([]);
	const [searching, setSearching] = React.useState<boolean>(false);

	const handleTextChange = useDebounce((text: string) => {
		setSearching(text !== '');
		handleSearchEmojis(text);
	}, 300);

	const handleSearchEmojis = async (text: string) => {
		logEvent(events.REACTION_PICKER_SEARCH_EMOJIS);
		const emojis = await searchEmojis(text);
		setSearchedEmojis(emojis);
	};

	const handleEmojiSelect = (_eventType: EventTypes, emoji?: IEmoji) => {
		logEvent(events.REACTION_PICKER_EMOJI_SELECTED);
		if (messageId && emoji) {
			onEmojiSelected(emoji, messageId);
		}
		reactionClose();
	};

	return (
		<View style={styles.reactionPickerContainer} testID='reaction-picker'>
			<View style={styles.reactionSearchContainer}>
				<EmojiSearch onChangeText={handleTextChange} bottomSheet />
			</View>
			<EmojiPicker onItemClicked={handleEmojiSelect} searching={searching} searchedEmojis={searchedEmojis} />
		</View>
	);
};

export default ReactionPicker;
