import React, { useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';

import { useTheme } from '../../theme';
import I18n from '../../i18n';
import { CustomIcon } from '../CustomIcon';
import { IEmoji } from '../../definitions';
import { useFrequentlyUsedEmoji } from '../../lib/hooks';
import { addFrequentlyUsed, searchEmojis } from '../../lib/methods';
import { useDebounce } from '../../lib/methods/helpers';
import sharedStyles from '../../views/Styles';
import { PressableEmoji } from '../EmojiPicker/PressableEmoji';
import { EmojiSearch } from '../EmojiPicker/EmojiSearch';
import { EMOJI_BUTTON_SIZE } from '../EmojiPicker/styles';
import { events, logEvent } from '../../lib/methods/helpers/log';

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

interface IEmojiSearchBarProps {
	openEmoji: () => void;
	closeEmoji: () => void;
	onEmojiSelected: (emoji: IEmoji) => void;
}

const EmojiSearchBar = ({ openEmoji, closeEmoji, onEmojiSelected }: IEmojiSearchBarProps): React.ReactElement => {
	const { colors } = useTheme();
	const [searchText, setSearchText] = useState<string>('');
	const { frequentlyUsed } = useFrequentlyUsedEmoji(true);
	const [emojis, setEmojis] = useState<IEmoji[]>([]);

	const handleTextChange = useDebounce(async (text: string) => {
		logEvent(events.MB_SB_EMOJI_SEARCH);
		setSearchText(text);
		const result = await searchEmojis(text);
		setEmojis(result);
	}, 300);

	const handleEmojiSelected = (emoji: IEmoji) => {
		logEvent(events.MB_SB_EMOJI_SELECTED);
		onEmojiSelected(emoji);
		addFrequentlyUsed(emoji);
	};

	const renderItem = ({ item }: { item: IEmoji }) => <PressableEmoji emoji={item} onPress={handleEmojiSelected} />;

	return (
		<View style={[styles.container, { borderTopColor: colors.borderColor, backgroundColor: colors.messageboxBackground }]}>
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
				keyExtractor={item => (typeof item === 'string' ? item : item.name)}
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
					<CustomIcon name='chevron-left' size={24} color={colors.auxiliaryTintColor} />
				</Pressable>
				<View style={styles.inputContainer}>
					<EmojiSearch onBlur={closeEmoji} onChangeText={handleTextChange} />
				</View>
			</View>
		</View>
	);
};

export default EmojiSearchBar;
