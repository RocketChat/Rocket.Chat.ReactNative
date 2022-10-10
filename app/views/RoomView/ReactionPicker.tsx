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
	show: boolean;
	reactionClose: () => void;
	onEmojiSelected: (shortname: string, id: string) => void;
	width: number;
	height: number;
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

	const handleEmojiSelect = (_eventType: EventTypes, emoji?: string, shortname?: string) => {
		// standard emojis: `emoji` is unicode and `shortname` is :joy:
		// custom emojis: only `emoji` is returned with shortname type (:joy:)
		// to set reactions, we need shortname type
		if (message) {
			// @ts-ignore
			onEmojiSelected(shortname || emoji, message.id);
		}
		reactionClose();
	};

	return (
		<View style={styles.reactionPickerContainer} testID='reaction-picker'>
			<View style={styles.reactionSearchContainer}>
				<EmojiSearch onChangeText={handleTextChange} />
			</View>
			<EmojiPicker onItemClicked={handleEmojiSelect} searching={searching} searchedEmojis={searchedEmojis} />
		</View>
	);
};

export default ReactionPicker;
