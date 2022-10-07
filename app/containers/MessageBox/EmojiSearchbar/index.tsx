import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, FlatList, StyleSheet } from 'react-native';

import { FormTextInput } from '../../TextInput/FormTextInput';
import { useTheme } from '../../../theme';
import I18n from '../../../i18n';
import { CustomIcon } from '../../CustomIcon';
import { IEmoji } from '../../../definitions';
import { addFrequentlyUsed, useFrequentlyUsedEmoji } from '../../EmojiPicker/frequentlyUsedEmojis';
import { ListItem } from './ListItem';
import log from '../../../lib/methods/helpers/log';

const BUTTON_HIT_SLOP = { top: 4, right: 4, bottom: 4, left: 4 };

const styles = StyleSheet.create({
	emojiListContainer: { height: 40, paddingHorizontal: 5, marginVertical: 5, flexGrow: 1 },
	emojiSearchViewContainer: {
		borderTopWidth: 1
	},
	emojiSearchbarContainer: {
		flexDirection: 'row',
		height: 48,
		marginBottom: 15,
		justifyContent: 'center',
		alignItems: 'center'
	},
	openEmojiKeyboard: { marginHorizontal: 10, justifyContent: 'center' },
	emojiSearchbar: { paddingHorizontal: 20, borderRadius: 2, fontSize: 16, minHeight: 48 },
	textInputContainer: { justifyContent: 'center', marginBottom: 0, marginRight: 15 },
	listEmptyComponent: {
		width: '100%',
		alignItems: 'center',
		justifyContent: 'center'
	},
	emojiSearchInput: {
		flex: 1
	}
});

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
		const { frequentlyUsed } = useFrequentlyUsedEmoji(true);

		const handleTextChange = (text: string) => {
			setSearchText(text);
			onChangeText(text);
		};

		const handleEmojiSelected = (emoji: IEmoji) => {
			try {
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
			} catch (e) {
				log(e);
			}
		};

		const renderItem = ({ item }: { item: IEmoji }) => <ListItem emoji={item} onEmojiSelected={handleEmojiSelected} />;

		return (
			<View
				style={[styles.emojiSearchViewContainer, { borderTopColor: colors.borderColor, backgroundColor: colors.backgroundColor }]}
			>
				<FlatList
					horizontal
					data={searchText ? emojis : frequentlyUsed}
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
