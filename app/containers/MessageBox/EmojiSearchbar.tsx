import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, FlatList } from 'react-native';

import { FormTextInput } from '../TextInput/FormTextInput';
import { useTheme } from '../../theme';
import I18n from '../../i18n';
import { CustomIcon } from '../CustomIcon';
import { IEmoji } from '../../definitions';
import shortnameToUnicode from '../../lib/methods/helpers/shortnameToUnicode';
import CustomEmoji from '../EmojiPicker/CustomEmoji';
import styles from './styles';
import { useFrequentlyUsedEmoji, addFrequentlyUsed } from '../EmojiPicker/frequentlyUsedEmojis';
import { DEFAULT_EMOJIS } from '../EmojiPicker/emojis';

const BUTTON_HIT_SLOP = { top: 4, right: 4, bottom: 4, left: 4 };
const EMOJI_SIZE = 24;
interface IEmojiSearchBarProps {
	openEmoji: () => void;
	onChangeText: (value: string) => void;
	emojis: (IEmoji | string)[];
	onEmojiSelected: (emoji: IEmoji | string) => void;
	baseUrl: string;
}

interface IListItem {
	emoji: IEmoji | string;
	onEmojiSelected: (emoji: IEmoji | string) => void;
	baseUrl: string;
}

const Emoji = ({ emoji, baseUrl }: { emoji: IEmoji | string; baseUrl: string }): React.ReactElement => {
	const { colors } = useTheme();
	if (typeof emoji === 'string') {
		return (
			<Text style={[styles.searchedEmoji, { fontSize: EMOJI_SIZE, color: colors.backdropColor }]}>
				{shortnameToUnicode(`:${emoji}:`)}
			</Text>
		);
	}
	return (
		<CustomEmoji
			style={[styles.emojiSearchCustomEmoji, { height: EMOJI_SIZE, width: EMOJI_SIZE }]}
			emoji={emoji}
			baseUrl={baseUrl}
		/>
	);
};

const ListItem = ({ emoji, onEmojiSelected, baseUrl }: IListItem): React.ReactElement => {
	const key = typeof emoji === 'string' ? emoji : emoji?.name || emoji?.content;
	const onPress = () => {
		onEmojiSelected(emoji);
		if (typeof emoji === 'string') {
			addFrequentlyUsed({ content: emoji, name: emoji, isCustom: false });
		} else {
			addFrequentlyUsed({
				content: emoji?.content || emoji?.name,
				name: emoji?.name,
				extension: emoji.extension,
				isCustom: true
			});
		}
	};
	return (
		<View style={styles.emojiContainer} key={key} testID={`searched-emoji-${key}`}>
			<Pressable onPress={onPress}>
				<Emoji emoji={emoji} baseUrl={baseUrl} />
			</Pressable>
		</View>
	);
};

const EmojiSearchBar = React.forwardRef<TextInput, IEmojiSearchBarProps>(
	({ openEmoji, onChangeText, emojis, onEmojiSelected, baseUrl }, ref) => {
		const { colors } = useTheme();
		const [searchText, setSearchText] = useState<string>('');
		const { frequentlyUsed } = useFrequentlyUsedEmoji();

		const frequentlyUsedWithDefaultEmojis = frequentlyUsed
			.filter(emoji => {
				if (typeof emoji === 'string') return !DEFAULT_EMOJIS.includes(emoji);
				return !DEFAULT_EMOJIS.includes(emoji.name);
			})
			.concat(DEFAULT_EMOJIS);

		const handleTextChange = (text: string) => {
			setSearchText(text);
			onChangeText(text);
		};

		return (
			<View
				style={[styles.emojiSearchViewContainer, { borderTopColor: colors.borderColor, backgroundColor: colors.backgroundColor }]}
			>
				<FlatList
					horizontal
					data={searchText ? emojis : frequentlyUsedWithDefaultEmojis}
					renderItem={({ item }) => <ListItem emoji={item} onEmojiSelected={onEmojiSelected} baseUrl={baseUrl} />}
					showsHorizontalScrollIndicator={false}
					ListEmptyComponent={() => (
						<View style={styles.listEmptyComponent} testID='no-results-found'>
							<Text style={{ color: colors.auxiliaryText }}>{I18n.t('No_results_found')}</Text>
						</View>
					)}
					// @ts-ignore
					keyExtractor={item => item?.content || item?.name || item}
					contentContainerStyle={styles.emojiListContainer}
					keyboardShouldPersistTaps='always'
				/>
				<View style={styles.emojiSearchbarContainer}>
					<Pressable
						style={({ pressed }: { pressed: boolean }) => [styles.openEmojiKeyboard, { opacity: pressed ? 0.7 : 1 }]}
						onPress={openEmoji}
						hitSlop={BUTTON_HIT_SLOP}
						testID='openback-emoji-keyboard'
					>
						<CustomIcon name='chevron-left' size={30} color={colors.collapsibleChevron} />
					</Pressable>
					<View style={styles.emojiSearchInput}>
						<FormTextInput
							inputRef={ref}
							autoCapitalize='none'
							autoCorrect={false}
							blurOnSubmit
							placeholder={I18n.t('Search_emoji')}
							returnKeyType='search'
							underlineColorAndroid='transparent'
							onChangeText={handleTextChange}
							style={[styles.emojiSearchbar, { backgroundColor: colors.passcodeButtonActive }]}
							containerStyle={styles.textInputContainer}
							value={searchText}
							onClearInput={() => handleTextChange('')}
							iconRight={'search'}
							testID='emoji-searchbar-input'
						/>
					</View>
				</View>
			</View>
		);
	}
);

export default EmojiSearchBar;
