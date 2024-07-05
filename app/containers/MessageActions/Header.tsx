import React from 'react';
import { FlatList, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { TSupportedThemes, useTheme } from '../../theme';
import { themes } from '../../lib/constants';
import { CustomIcon } from '../CustomIcon';
import shortnameToUnicode from '../../lib/methods/helpers/shortnameToUnicode';
import { addFrequentlyUsed } from '../../lib/methods';
import { useFrequentlyUsedEmoji } from '../../lib/hooks';
import CustomEmoji from '../EmojiPicker/CustomEmoji';
import sharedStyles from '../../views/Styles';
import { IEmoji, TAnyMessageModel } from '../../definitions';
import Touch from '../Touch';

export interface IHeader {
	handleReaction: (emoji: IEmoji | null, message: TAnyMessageModel) => void;
	message: TAnyMessageModel;
	isMasterDetail: boolean;
}

type TOnReaction = ({ emoji }: { emoji?: IEmoji }) => void;

interface THeaderItem {
	item: IEmoji;
	onReaction: TOnReaction;
	theme: TSupportedThemes;
}

interface THeaderFooter {
	onReaction: TOnReaction;
	theme: TSupportedThemes;
}

export const HEADER_HEIGHT = 54;
const ITEM_SIZE = 36;
const CONTAINER_MARGIN = 8;
const ITEM_MARGIN = 8;

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		marginHorizontal: CONTAINER_MARGIN,
		paddingBottom: 16
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

const HeaderItem = ({ item, onReaction, theme }: THeaderItem) => (
	<Touch
		testID={`message-actions-emoji-${item}`}
		onPress={() => onReaction({ emoji: item })}
		style={[styles.headerItem, { backgroundColor: themes[theme].surfaceHover }]}>
		{typeof item === 'string' ? (
			<Text style={styles.headerIcon}>{shortnameToUnicode(`:${item}:`)}</Text>
		) : (
			<CustomEmoji style={styles.customEmoji} emoji={item} />
		)}
	</Touch>
);

const HeaderFooter = ({ onReaction, theme }: THeaderFooter) => (
	<Touch
		testID='add-reaction'
		onPress={(param: any) => onReaction(param)}
		style={[styles.headerItem, { backgroundColor: themes[theme].surfaceHover }]}>
		<CustomIcon name='reaction-add' size={24} />
	</Touch>
);

const Header = React.memo(({ handleReaction, message, isMasterDetail }: IHeader) => {
	const { width } = useWindowDimensions();
	const { theme } = useTheme();
	const { frequentlyUsed, loaded } = useFrequentlyUsedEmoji(true);
	const size = (isMasterDetail ? width / 2 : width) - CONTAINER_MARGIN * 2;
	const quantity = Math.trunc(size / (ITEM_SIZE + ITEM_MARGIN * 2) - 1);

	const onReaction: TOnReaction = ({ emoji }) => {
		handleReaction(emoji || null, message);
		if (emoji) {
			addFrequentlyUsed(emoji);
		}
	};

	const renderItem = ({ item }: { item: IEmoji }) => <HeaderItem item={item} onReaction={onReaction} theme={theme} />;

	const renderFooter = () => <HeaderFooter onReaction={onReaction} theme={theme} />;

	if (!loaded) {
		return null;
	}

	return (
		<View style={[styles.container, { backgroundColor: themes[theme].surfaceLight }]}>
			<FlatList
				data={frequentlyUsed.slice(0, quantity)}
				renderItem={renderItem}
				ListFooterComponent={renderFooter}
				style={{ backgroundColor: themes[theme].surfaceLight }}
				keyExtractor={item => (typeof item === 'string' ? item : item.name)}
				showsHorizontalScrollIndicator={false}
				scrollEnabled={false}
				horizontal
			/>
		</View>
	);
});

export default Header;
