import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, TextInput, FlatList } from 'react-native';

import { FormTextInput } from '../TextInput/FormTextInput';
import { useTheme } from '../../theme';
import I18n from '../../i18n';
import { CustomIcon } from '../CustomIcon';
import { IEmoji } from '../../definitions';
import shortnameToUnicode from '../../lib/methods/helpers/shortnameToUnicode';
import CustomEmoji from '../EmojiPicker/CustomEmoji';
import styles from './styles';
import { useFrequentlyUsedEmoji } from '../EmojiPicker';

const BUTTON_HIT_SLOP = { top: 15, right: 15, bottom: 15, left: 15 };
const EMOJI_SIZE = 30;
const DEFAULT_EMOJIS = ['clap', '+1', 'heart_eyes', 'grinning', 'thinking_face', 'smiley'];
interface IEmojiSearchbarProps {
	openEmoji: () => void;
	onChangeText: (value: string) => void;
	emojis: IEmoji[];
	onEmojiSelected: (emoji: IEmoji) => void;
	baseUrl: string;
}

interface ICustomEmoji {
	name: string;
	extension: string;
}

const Emoji = React.memo(({ emoji, baseUrl }: { emoji: IEmoji; baseUrl: string }) => {
	const { colors } = useTheme();
	if (emoji.isCustom || emoji.name) {
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
		const [frequentlyUsedEmojis, setFrequentlyUsed] = useState<(string | ICustomEmoji)[]>();
		const { frequentlyUsed, loaded } = useFrequentlyUsedEmoji();

		useEffect(() => {
			if (loaded) {
				const frequentlyUsedWithDefaultEmojis = frequentlyUsed
					.filter(emoji => {
						if (typeof emoji === 'string') return !DEFAULT_EMOJIS.includes(emoji);
						return !DEFAULT_EMOJIS.includes(emoji.name);
					})
					.concat(DEFAULT_EMOJIS);
				setFrequentlyUsed(frequentlyUsedWithDefaultEmojis);
			}
		}, [loaded]);

		const handleTextChange = (text: string) => {
			setSearchText(text);
			onChangeText(text);
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
					data={searchText ? emojis : frequentlyUsedEmojis}
					renderItem={({ item }) => renderItem(item as IEmoji)}
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
