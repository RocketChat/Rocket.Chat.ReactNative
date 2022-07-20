import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, TextInput, FlatList } from 'react-native';
import { orderBy } from 'lodash';

import { FormTextInput } from '../TextInput/FormTextInput';
import { useTheme } from '../../theme';
import I18n from '../../i18n';
import { CustomIcon } from '../CustomIcon';
import { IEmoji } from '../../definitions';
import shortnameToUnicode from '../../lib/methods/helpers/shortnameToUnicode';
import CustomEmoji from '../EmojiPicker/CustomEmoji';
import database from '../../lib/database';
import styles from './styles';

const BUTTON_HIT_SLOP = { top: 15, right: 15, bottom: 15, left: 15 };
const EMOJI_SIZE = 30;

interface IEmojiSearchbarProps {
	openEmoji: () => void;
	onChangeText: (value: string) => void;
	emojis: IEmoji[];
	onEmojiSelected: (emoji: IEmoji) => void;
	baseUrl: string;
}

const Emoji = React.memo(({ emoji, baseUrl }: { emoji: IEmoji; baseUrl: string }) => {
	const { colors } = useTheme();
	if (emoji?.name) {
		return <CustomEmoji style={{ height: EMOJI_SIZE, width: EMOJI_SIZE, margin: 4 }} emoji={emoji} baseUrl={baseUrl} />;
	}
	return (
		<Text style={[styles.searchedEmoji, { fontSize: EMOJI_SIZE, color: colors.backdropColor }]}>
			{shortnameToUnicode(`:${emoji}:`)}
		</Text>
	);
});

const EmojiSearchbar = React.forwardRef<TextInput, IEmojiSearchbarProps>(
	({ openEmoji, onChangeText, emojis, onEmojiSelected, baseUrl }, ref) => {
		const { colors } = useTheme();
		const [searchText, setSearchText] = useState<string>('');
		const [frequentlyUsed, setFrequentlyUsed] = useState([]);

		const getFrequentlyUsedEmojis = async () => {
			const db = database.active;
			const frequentlyUsedRecords = await db.get('frequently_used_emojis').query().fetch();
			const frequentlyUsedOrdered = orderBy(frequentlyUsedRecords, ['count'], ['desc']);
			const frequentlyUsedEmojis = frequentlyUsedOrdered.map(item => {
				if (item.isCustom) {
					return { name: item.content, extension: item.extension };
				}
				return item.content;
			});
			// @ts-ignore
			setFrequentlyUsed(frequentlyUsedEmojis);
		};

		useEffect(() => {
			getFrequentlyUsedEmojis();
		}, []);

		const handleTextChange = (text: string) => {
			setSearchText(text);
			onChangeText(text);
			if (!text) getFrequentlyUsedEmojis();
		};

		const renderItem = (emoji: IEmoji) => (
			<View style={[styles.emojiContainer]}>
				<Pressable onPress={() => onEmojiSelected(emoji)}>
					<Emoji emoji={emoji} baseUrl={baseUrl} />
				</Pressable>
			</View>
		);
		return (
			<View style={{ borderTopWidth: 1, borderTopColor: colors.borderColor, backgroundColor: colors.backgroundColor }}>
				<FlatList
					horizontal
					data={searchText ? emojis : frequentlyUsed}
					renderItem={({ item }) => renderItem(item)}
					showsHorizontalScrollIndicator={false}
					ListEmptyComponent={() => (
						<View style={styles.listEmptyComponent}>
							<Text style={{ color: colors.auxiliaryText }}>{I18n.t('No_results_found')}</Text>
						</View>
					)}
					// @ts-ignore
					keyExtractor={item => item?.name || item}
					contentContainerStyle={styles.emojiListContainer}
					keyboardShouldPersistTaps='always'
				/>
				<View style={styles.emojiSearchbarContainer}>
					<Pressable
						style={({ pressed }: { pressed: boolean }) => [styles.openEmojiKeyboard, { opacity: pressed ? 0.7 : 1 }]}
						onPress={openEmoji}
						hitSlop={BUTTON_HIT_SLOP}>
						<CustomIcon name='chevron-left' size={30} color={colors.collapsibleChevron} />
					</Pressable>
					<View style={{ flex: 1 }}>
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
						/>
					</View>
				</View>
			</View>
		);
	}
);

export default EmojiSearchbar;
