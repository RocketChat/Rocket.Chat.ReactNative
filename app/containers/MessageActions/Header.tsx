import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { TSupportedThemes, useTheme } from '../../theme';
import { themes } from '../../lib/constants';
import { CustomIcon } from '../CustomIcon';
import shortnameToUnicode from '../../lib/methods/helpers/shortnameToUnicode';
import CustomEmoji from '../EmojiPicker/CustomEmoji';
import { useDimensions } from '../../dimensions';
import sharedStyles from '../../views/Styles';
import { IEmoji, TAnyMessageModel, TFrequentlyUsedEmojiModel } from '../../definitions';
import Touch from '../Touch';
import { addFrequentlyUsed, useFrequentlyUsedEmoji } from '../EmojiPicker/frequentlyUsedEmojis';
import { PressableEmoji } from '../EmojiPicker/PressableEmoji';
import { getEmojiText } from '../EmojiPicker/helpers';

type TItem = TFrequentlyUsedEmojiModel | string;

export interface IHeader {
	handleReaction: (emoji: TItem, message: TAnyMessageModel) => void;
	message: TAnyMessageModel;
	isMasterDetail: boolean;
}

type TOnReaction = ({ emoji }: { emoji: TItem }) => void;

interface THeaderItem {
	item: IEmoji;
	onReaction: TOnReaction;
	theme: TSupportedThemes;
}

interface THeaderFooter {
	onReaction: TOnReaction;
	theme: TSupportedThemes;
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

const keyExtractor = (item: IEmoji) => {
	const emojiModel = item as TFrequentlyUsedEmojiModel;
	return (emojiModel.id ? emojiModel.content : item) as string;
};

const HeaderItem = ({ item, onReaction, theme }: THeaderItem) => {
	console.log('🚀 ~ file: Header.tsx ~ line 72 ~ HeaderItem ~ item', item);

	// return <PressableEmoji emoji={item} onPress={() => onReaction(getEmojiText(item))} />;
	// const emojiModel = item;
	// const emoji = ('id' in emojiModel ? emojiModel.content : item) as string;
	// if (typeof emoji === 'string') {
	// 	return <Text style={styles.categoryEmoji}>{shortnameToUnicode(`:${emoji}:`)}</Text>;
	// }
	// return <CustomEmoji style={styles.customCategoryEmoji} emoji={emoji} />;
	return (
		<Touch
			testID={`message-actions-emoji-${item}`}
			onPress={() => onReaction({ emoji: `:${item}:` })}
			style={[styles.headerItem, { backgroundColor: themes[theme].auxiliaryBackground }]}
		>
			{typeof item === 'string' ? (
				<Text style={styles.headerIcon}>{shortnameToUnicode(`:${item}:`)}</Text>
			) : (
				<CustomEmoji style={styles.customEmoji} emoji={item} />
			)}
		</Touch>
	);
};

const HeaderFooter = ({ onReaction, theme }: THeaderFooter) => (
	<Touch
		testID='add-reaction'
		onPress={(param: any) => onReaction(param)}
		style={[styles.headerItem, { backgroundColor: themes[theme].auxiliaryBackground }]}
	>
		<CustomIcon name='reaction-add' size={24} color={themes[theme].bodyText} />
	</Touch>
);

const Header = React.memo(({ handleReaction, message, isMasterDetail }: IHeader) => {
	const { width, height } = useDimensions();
	const { theme } = useTheme();
	const { frequentlyUsed, loaded } = useFrequentlyUsedEmoji(true);
	const isLandscape = width > height;
	const size = (isLandscape || isMasterDetail ? width / 2 : width) - CONTAINER_MARGIN * 2;
	const quantity = Math.trunc(size / (ITEM_SIZE + ITEM_MARGIN * 2) - 1);

	const onReaction: TOnReaction = ({ emoji }) => {
		addFrequentlyUsed(emoji);
		handleReaction(emoji, message);
	};

	const renderItem = ({ item }: { item: IEmoji }) => <HeaderItem item={item} onReaction={onReaction} theme={theme} />;

	const renderFooter = () => <HeaderFooter onReaction={onReaction} theme={theme} />;

	if (!loaded) {
		return null;
	}

	return (
		<View style={[styles.container, { backgroundColor: themes[theme].focusedBackground }]}>
			<FlatList
				data={frequentlyUsed.slice(0, quantity)}
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
