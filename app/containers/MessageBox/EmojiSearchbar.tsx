import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, FlatList, StyleSheet } from 'react-native';

import { useTheme } from '../../theme';
import I18n from '../../i18n';
import { CustomIcon } from '../CustomIcon';
import { IEmoji } from '../../definitions';
import { addFrequentlyUsed, useFrequentlyUsedEmoji } from '../EmojiPicker/frequentlyUsedEmojis';
import { useDebounce } from '../../lib/methods/helpers';
import sharedStyles from '../../views/Styles';
import { PressableEmoji } from '../EmojiPicker/PressableEmoji';
import { EmojiSearch } from '../EmojiPicker/EmojiSearch';
import { EMOJI_BUTTON_SIZE } from '../EmojiPicker/styles';
import { getEmojiText, searchEmojis } from '../EmojiPicker/helpers';

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
	closeEmoji: () => void;
	onEmojiSelected: (emoji: string) => void;
}

const EmojiSearchBar = React.forwardRef<TextInput, IEmojiSearchBarProps>(({ openEmoji, closeEmoji, onEmojiSelected }, ref) => {
	const { colors } = useTheme();
	const [searchText, setSearchText] = useState<string>('');
	const { frequentlyUsed } = useFrequentlyUsedEmoji(true);
	const [emojis, setEmojis] = useState<IEmoji[]>([]);

	const handleTextChange = useDebounce(async (text: string) => {
		setSearchText(text);
		const result = await searchEmojis(text);
		setEmojis(result);
	}, 300);

	const handleEmojiSelected = (emoji: IEmoji) => {
		onEmojiSelected(getEmojiText(emoji));
		addFrequentlyUsed(emoji);
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
					<EmojiSearch ref={ref} onBlur={closeEmoji} onChangeText={handleTextChange} />
				</View>
			</View>
		</View>
	);
});

export default EmojiSearchBar;
