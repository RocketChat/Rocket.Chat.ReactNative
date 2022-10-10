import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, FlatList, StyleSheet } from 'react-native';

import { FormTextInput } from '../TextInput/FormTextInput';
import { useTheme } from '../../theme';
import I18n from '../../i18n';
import { CustomIcon } from '../CustomIcon';
import { IEmoji } from '../../definitions';
import { addFrequentlyUsed, useFrequentlyUsedEmoji } from '../EmojiPicker/frequentlyUsedEmojis';
import log from '../../lib/methods/helpers/log';
import sharedStyles from '../../views/Styles';
import { PressableEmoji } from '../EmojiPicker/PressableEmoji';
import { EMOJI_BUTTON_SIZE } from '../EmojiPicker/styles';

const BUTTON_HIT_SLOP = { top: 4, right: 4, bottom: 4, left: 4 };

const styles = StyleSheet.create({
	listContainer: {
		height: EMOJI_BUTTON_SIZE,
		margin: 8,
		flexGrow: 1
	},
	container: {
		borderTopWidth: 1
	},
	searchContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
		marginBottom: 12
	},
	backButton: {
		width: 32,
		height: 32,
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 10
	},
	input: {
		height: 32,
		borderWidth: 0,
		paddingVertical: 0,
		borderRadius: 4
	},
	textInputContainer: {
		marginBottom: 0
	},
	emptyContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center'
	},
	emptyText: {
		...sharedStyles.textRegular,
		fontSize: 16
	},
	inputContainer: {
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

		const renderItem = ({ item }: { item: IEmoji }) => <PressableEmoji emoji={item} onPress={handleEmojiSelected} />;

		return (
			<View style={[styles.container, { borderTopColor: colors.borderColor, backgroundColor: colors.backgroundColor }]}>
				<FlatList
					horizontal
					data={searchText ? emojis : frequentlyUsed}
					renderItem={renderItem}
					showsHorizontalScrollIndicator={false}
					ListEmptyComponent={() => (
						<View style={styles.emptyContainer} testID='no-results-found'>
							<Text style={[styles.emptyText, { color: colors.auxiliaryText }]}>{I18n.t('No_results_found')}</Text>
						</View>
					)}
					// @ts-ignore
					keyExtractor={item => item?.content || item?.name || item}
					contentContainerStyle={styles.listContainer}
					keyboardShouldPersistTaps='always'
				/>
				<View style={styles.searchContainer}>
					<Pressable
						style={({ pressed }: { pressed: boolean }) => [styles.backButton, { opacity: pressed ? 0.7 : 1 }]}
						onPress={openEmoji}
						hitSlop={BUTTON_HIT_SLOP}
						testID='openback-emoji-keyboard'
					>
						<CustomIcon name='chevron-left' size={24} color={colors.collapsibleChevron} />
					</Pressable>
					<View style={styles.inputContainer}>
						<FormTextInput
							inputRef={ref}
							autoCapitalize='none'
							autoCorrect={false}
							autoComplete='off'
							returnKeyType='search'
							textContentType='none'
							blurOnSubmit
							placeholder={I18n.t('Search_emoji')}
							underlineColorAndroid='transparent'
							onChangeText={handleTextChange}
							inputStyle={[styles.input, { backgroundColor: colors.textInputSecondaryBackground }]}
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
