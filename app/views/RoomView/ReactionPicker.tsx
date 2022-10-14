import React from 'react';
import { View } from 'react-native';

import EmojiPicker from '../../containers/EmojiPicker';
import styles from './styles';
import { IEmoji } from '../../definitions';
import { EventTypes } from '../../containers/EmojiPicker/interfaces';
import { searchEmojis } from '../../containers/EmojiPicker/helpers';
import { useDebounce } from '../../lib/methods/helpers/debounce';
import { EmojiSearch } from '../../containers/EmojiPicker/EmojiSearch';

interface IReactionPickerProps {
	message?: any;
	reactionClose: () => void;
	onEmojiSelected: (emoji: IEmoji, id: string) => void;
}

const ReactionPicker = ({ onEmojiSelected, message, reactionClose }: IReactionPickerProps): React.ReactElement => {
	const [searchedEmojis, setSearchedEmojis] = React.useState<IEmoji[]>([]);
	const [searching, setSearching] = React.useState<boolean>(false);

	const handleTextChange = useDebounce((text: string) => {
		setSearching(text !== '');
		handleSearchEmojis(text);
	}, 300);

	const handleSearchEmojis = async (text: string) => {
		const emojis = await searchEmojis(text);
		setSearchedEmojis(emojis);
	};

	const handleEmojiSelect = (_eventType: EventTypes, emoji?: IEmoji) => {
		if (message && emoji) {
			onEmojiSelected(emoji, message.id);
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
