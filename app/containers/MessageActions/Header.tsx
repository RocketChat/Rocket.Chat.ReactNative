import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { withTheme } from '../../theme';
import { themes } from '../../constants/colors';
import { CustomIcon } from '../../lib/Icons';
import shortnameToUnicode from '../../utils/shortnameToUnicode';
import CustomEmoji from '../EmojiPicker/CustomEmoji';
import database from '../../lib/database';
import { Button } from '../ActionSheet';
import { useDimensions } from '../../dimensions';
import sharedStyles from '../../views/Styles';
import { IEmoji } from '../EmojiPicker/interfaces';

interface IHeader {
	handleReaction: Function;
	server: string;
	message: object;
	isMasterDetail: boolean;
	theme?: string;
}

interface THeaderItem {
	item: IEmoji;
	onReaction: Function;
	server: string;
	theme: string;
}

interface THeaderFooter {
	onReaction: any;
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

const keyExtractor = (item: any) => item?.id || item;

const DEFAULT_EMOJIS = ['clap', '+1', 'heart_eyes', 'grinning', 'thinking_face', 'smiley'];

const HeaderItem = React.memo(({ item, onReaction, server, theme }: THeaderItem) => (
	<Button
		testID={`message-actions-emoji-${item.content || item}`}
		onPress={() => onReaction({ emoji: `:${item.content || item}:` })}
		style={[styles.headerItem, { backgroundColor: themes[theme].auxiliaryBackground }]}
		theme={theme}>
		{item?.isCustom ? (
			<CustomEmoji style={styles.customEmoji} emoji={item} baseUrl={server} />
		) : (
			<Text style={styles.headerIcon}>{shortnameToUnicode(`:${item.content || item}:`)}</Text>
		)}
	</Button>
));

const HeaderFooter = React.memo(({ onReaction, theme }: THeaderFooter) => (
	<Button
		testID='add-reaction'
		onPress={onReaction}
		style={[styles.headerItem, { backgroundColor: themes[theme].auxiliaryBackground }]}
		theme={theme}>
		<CustomIcon name='reaction-add' size={24} color={themes[theme].bodyText} />
	</Button>
));

const Header = React.memo(({ handleReaction, server, message, isMasterDetail, theme }: IHeader) => {
	const [items, setItems] = useState([]);
	const { width, height }: any = useDimensions();

	const setEmojis = async () => {
		try {
			const db = database.active;
			const freqEmojiCollection = db.get('frequently_used_emojis');
			let freqEmojis = await freqEmojiCollection.query().fetch();

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

	const onReaction = ({ emoji }: { emoji: IEmoji }) => handleReaction(emoji, message);

	const renderItem = useCallback(
		({ item }) => <HeaderItem item={item} onReaction={onReaction} server={server} theme={theme!} />,
		[]
	);

	const renderFooter = useCallback(() => <HeaderFooter onReaction={onReaction} theme={theme!} />, []);

	return (
		<View style={[styles.container, { backgroundColor: themes[theme!].focusedBackground }]}>
			<FlatList
				data={items}
				renderItem={renderItem}
				ListFooterComponent={renderFooter}
				style={{ backgroundColor: themes[theme!].focusedBackground }}
				keyExtractor={keyExtractor}
				showsHorizontalScrollIndicator={false}
				scrollEnabled={false}
				horizontal
			/>
		</View>
	);
});

export default withTheme(Header);
