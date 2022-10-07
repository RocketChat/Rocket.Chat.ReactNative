import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, FlatList } from 'react-native';

import { FormTextInput } from '../../TextInput/FormTextInput';
import { useTheme } from '../../../theme';
import I18n from '../../../i18n';
import { CustomIcon } from '../../CustomIcon';
import { IEmoji } from '../../../definitions';
import styles from '../styles';
import { useFrequentlyUsedEmoji } from '../../EmojiPicker/frequentlyUsedEmojis';
import { DEFAULT_EMOJIS } from '../../EmojiPicker/data';
import { ListItem } from './ListItem';

const BUTTON_HIT_SLOP = { top: 4, right: 4, bottom: 4, left: 4 };

interface IEmojiSearchBarProps {
	openEmoji: () => void;
	onChangeText: (value: string) => void;
	emojis: IEmoji[];
	onEmojiSelected: (emoji: IEmoji) => void;
}

const EmojiSearchBar = React.forwardRef<TextInput, IEmojiSearchBarProps>(
	({ openEmoji, onChangeText, emojis, onEmojiSelected }, ref) => {
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

		const renderItem = ({ item }: { item: IEmoji }) => <ListItem emoji={item} onEmojiSelected={onEmojiSelected} />;

		return (
			<View
				style={[styles.emojiSearchViewContainer, { borderTopColor: colors.borderColor, backgroundColor: colors.backgroundColor }]}
			>
				<FlatList
					horizontal
					data={searchText ? emojis : frequentlyUsedWithDefaultEmojis}
					renderItem={renderItem}
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
						<CustomIcon name='chevron-left' size={24} color={colors.collapsibleChevron} />
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
