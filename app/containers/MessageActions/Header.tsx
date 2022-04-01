import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../theme';
import { themes } from '../../constants/colors';
import { CustomIcon } from '../../lib/Icons';
import shortnameToUnicode from '../../utils/shortnameToUnicode';
import CustomEmoji from '../EmojiPicker/CustomEmoji';
import database from '../../lib/database';
import { Button } from '../ActionSheet';
import { useDimensions } from '../../dimensions';
import sharedStyles from '../../views/Styles';
import { TFrequentlyUsedEmojiModel } from '../../definitions/IFrequentlyUsedEmoji';
import { TAnyMessageModel } from '../../definitions';
import { IEmoji } from '../../definitions/IEmoji';

type TItem = TFrequentlyUsedEmojiModel | string;

export interface IHeader {
	handleReaction: (emoji: TItem, message: TAnyMessageModel) => void;
	server: string;
	message: TAnyMessageModel;
	isMasterDetail: boolean;
}

type TOnReaction = ({ emoji }: { emoji: TItem }) => void;

interface THeaderItem {
	item: TItem;
	onReaction: TOnReaction;
	server: string;
	theme: string;
}

interface THeaderFooter {
	onReaction: TOnReaction;
	theme: string;
}

export const HEADER_HEIGHT = 36;
const ITEM_SIZE = 36;
const CONTAINER_MARGIN = 8;
const ITEM_MARGIN = 8;

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		marginHorizontal: CONTAINER_MARGIN
	},
	headerItem: {
		height: ITEM_SIZE,
		width: ITEM_SIZE,
		borderRadius: ITEM_SIZE / 2,
		marginHorizontal: ITEM_MARGIN,
		justifyContent: 'center',
		alignItems: 'center'
	},
	headerIcon: {
		...sharedStyles.textAlignCenter,
		fontSize: 20,
		color: '#fff'
	},
	customEmoji: {
		height: 20,
		width: 20
	}
});

const keyExtractor = (item: TItem) => {
	const emojiModel = item as TFrequentlyUsedEmojiModel;
	return (emojiModel.id ? emojiModel.content : item) as string;
};

const DEFAULT_EMOJIS = ['clap', '+1', 'heart_eyes', 'grinning', 'thinking_face', 'smiley'];

const HeaderItem = ({ item, onReaction, server, theme }: THeaderItem) => {
	const emojiModel = item as TFrequentlyUsedEmojiModel;
	const emoji = (emojiModel.id ? emojiModel.content : item) as string;
	return (
		<Button
			testID={`message-actions-emoji-${emoji}`}
			onPress={() => onReaction({ emoji: `:${emoji}:` })}
			style={[styles.headerItem, { backgroundColor: themes[theme].auxiliaryBackground }]}
			theme={theme}>
			{emojiModel?.isCustom ? (
				<CustomEmoji style={styles.customEmoji} emoji={emojiModel as IEmoji} baseUrl={server} />
			) : (
				<Text style={styles.headerIcon}>{shortnameToUnicode(`:${emoji}:`)}</Text>
			)}
		</Button>
	);
};

const HeaderFooter = ({ onReaction, theme }: THeaderFooter) => (
	<Button
		testID='add-reaction'
		onPress={onReaction}
		style={[styles.headerItem, { backgroundColor: themes[theme].auxiliaryBackground }]}
		theme={theme}>
		<CustomIcon name='reaction-add' size={24} color={themes[theme].bodyText} />
	</Button>
);

const Header = React.memo(({ handleReaction, server, message, isMasterDetail }: IHeader) => {
	const [items, setItems] = useState<TItem[]>([]);
	const { width, height } = useDimensions();
	const { theme } = useTheme();

	// TODO: create custom hook to re-render based on screen size
	const setEmojis = async () => {
		try {
			const db = database.active;
			const freqEmojiCollection = db.get('frequently_used_emojis');
			let freqEmojis: TItem[] = await freqEmojiCollection.query().fetch();

			const isLandscape = width > height;
			const size = (isLandscape || isMasterDetail ? width / 2 : width) - CONTAINER_MARGIN * 2;
			const quantity = size / (ITEM_SIZE + ITEM_MARGIN * 2) - 1;

			freqEmojis = freqEmojis.concat(DEFAULT_EMOJIS).slice(0, quantity);
			setItems(freqEmojis);
		} catch {
			// Do nothing
		}
	};

	useEffect(() => {
		setEmojis();
	}, []);

	const onReaction: TOnReaction = ({ emoji }) => handleReaction(emoji, message);

	const renderItem = ({ item }: { item: TItem }) => (
		<HeaderItem item={item} onReaction={onReaction} server={server} theme={theme} />
	);

	const renderFooter = () => <HeaderFooter onReaction={onReaction} theme={theme} />;

	return (
		<View style={[styles.container, { backgroundColor: themes[theme].focusedBackground }]}>
			<FlatList
				data={items}
				renderItem={renderItem}
				ListFooterComponent={renderFooter}
				style={{ backgroundColor: themes[theme].focusedBackground }}
				keyExtractor={keyExtractor}
				showsHorizontalScrollIndicator={false}
				scrollEnabled={false}
				horizontal
			/>
		</View>
	);
});

export default Header;
