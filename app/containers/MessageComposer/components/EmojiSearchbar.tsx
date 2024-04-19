import React, { useContext, useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';

import { MessageInnerContext, useMessageComposerApi, useShowEmojiSearchbar } from '../context';
import { useTheme } from '../../../theme';
import I18n from '../../../i18n';
import { CustomIcon } from '../../CustomIcon';
import { IEmoji } from '../../../definitions';
import { useFrequentlyUsedEmoji } from '../../../lib/hooks';
import { addFrequentlyUsed, searchEmojis } from '../../../lib/methods';
import { useDebounce } from '../../../lib/methods/helpers';
import sharedStyles from '../../../views/Styles';
import { PressableEmoji } from '../../EmojiPicker/PressableEmoji';
import { EmojiSearch } from '../../EmojiPicker/EmojiSearch';
import { EMOJI_BUTTON_SIZE } from '../../EmojiPicker/styles';

const BUTTON_HIT_SLOP = { top: 4, right: 4, bottom: 4, left: 4 };

export const EmojiSearchbar = (): React.ReactElement | null => {
	const { colors } = useTheme();
	const [searchText, setSearchText] = useState<string>('');
	const showEmojiSearchbar = useShowEmojiSearchbar();
	const { openEmojiKeyboard, closeEmojiKeyboard } = useMessageComposerApi();
	const { onEmojiSelected } = useContext(MessageInnerContext);
	const { frequentlyUsed } = useFrequentlyUsedEmoji(true);
	const [emojis, setEmojis] = useState<IEmoji[]>([]);

	const handleTextChange = useDebounce(async (text: string) => {
		setSearchText(text);
		const result = await searchEmojis(text);
		setEmojis(result);
	}, 300);

	const handleEmojiSelected = (emoji: IEmoji) => {
		onEmojiSelected(emoji);
		addFrequentlyUsed(emoji);
	};

	const renderItem = ({ item }: { item: IEmoji }) => <PressableEmoji emoji={item} onPress={handleEmojiSelected} />;

	if (!showEmojiSearchbar) {
		return null;
	}

	// TODO: Use RNGH
	return (
		<View style={{ backgroundColor: colors.surfaceLight }}>
			<FlatList
				horizontal
				data={searchText ? emojis : frequentlyUsed}
				renderItem={renderItem}
				showsHorizontalScrollIndicator={false}
				ListEmptyComponent={() => (
					<View style={styles.emptyContainer} testID='no-results-found'>
						<Text style={[styles.emptyText, { color: colors.fontHint }]}>{I18n.t('No_results_found')}</Text>
					</View>
				)}
				keyExtractor={item => (typeof item === 'string' ? item : item.name)}
				contentContainerStyle={styles.listContainer}
				keyboardShouldPersistTaps='always'
			/>
			<View style={styles.searchContainer}>
				<Pressable
					style={({ pressed }: { pressed: boolean }) => [styles.backButton, { opacity: pressed ? 0.7 : 1 }]}
					onPress={openEmojiKeyboard}
					hitSlop={BUTTON_HIT_SLOP}
					testID='openback-emoji-keyboard'
				>
					<CustomIcon name='chevron-left' size={24} />
				</Pressable>
				<View style={styles.inputContainer}>
					<EmojiSearch onBlur={closeEmojiKeyboard} onChangeText={handleTextChange} />
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	listContainer: {
		height: EMOJI_BUTTON_SIZE,
		margin: 8,
		flexGrow: 1
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
		borderRadius: 4
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
