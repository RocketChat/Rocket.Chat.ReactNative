import { memo } from 'react';
import { FlatList, Text, View, useWindowDimensions } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { CustomIcon } from '../CustomIcon';
import useShortnameToUnicode from '../../lib/hooks/useShortnameToUnicode';
import { addFrequentlyUsed } from '../../lib/methods/emojis';
import { useFrequentlyUsedEmoji } from '../../lib/hooks/useFrequentlyUsedEmoji';
import CustomEmoji from '../EmojiPicker/CustomEmoji';
import sharedStyles from '../../views/Styles';
import { type IEmoji, type TAnyMessageModel } from '../../definitions';
import Touch from '../Touch';
import I18n from '../../i18n';

export interface IHeader {
	handleReaction: (emoji: IEmoji | null, message: TAnyMessageModel) => void;
	message: TAnyMessageModel;
	isMasterDetail: boolean;
}

type TOnReaction = ({ emoji }: { emoji?: IEmoji }) => void;

interface THeaderItem {
	item: IEmoji;
	onReaction: TOnReaction;
}

interface THeaderFooter {
	onReaction: TOnReaction;
}

export const HEADER_HEIGHT = 54;
const ITEM_SIZE = 36;
const CONTAINER_MARGIN = 8;
const ITEM_MARGIN = 8;

const styles = StyleSheet.create(theme => ({
	container: {
		alignItems: 'center',
		marginHorizontal: CONTAINER_MARGIN,
		paddingBottom: 16,
		backgroundColor: theme.colors.surfaceLight
	},
	headerItem: {
		height: ITEM_SIZE,
		width: ITEM_SIZE,
		borderRadius: ITEM_SIZE / 2,
		marginHorizontal: ITEM_MARGIN,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: theme.colors.surfaceHover
	},
	headerIcon: {
		...sharedStyles.textAlignCenter,
		fontSize: 20,
		color: '#fff'
	},
	customEmoji: {
		height: 20,
		width: 20
	},
	flatList: {
		backgroundColor: theme.colors.surfaceLight
	}
}));

const HeaderItem = ({ item, onReaction }: THeaderItem) => {
	const { formatShortnameToUnicode } = useShortnameToUnicode();
	const unicodeEmoji = formatShortnameToUnicode(`:${item}:`);
	return (
		<Touch
			testID={`message-actions-emoji-${item}`}
			accessible
			accessibilityLabel={I18n.t('React_with_emojjname', { emojiName: item })}
			onPress={() => onReaction({ emoji: item })}
			style={styles.headerItem}>
			{typeof item === 'string' ? (
				<Text style={styles.headerIcon}>{unicodeEmoji}</Text>
			) : (
				<CustomEmoji style={styles.customEmoji} emoji={item} />
			)}
		</Touch>
	);
};
const HeaderFooter = ({ onReaction }: THeaderFooter) => (
	<Touch
		testID='add-reaction'
		accessible
		accessibilityLabel={I18n.t('Select_emoji_reaction')}
		onPress={(param: any) => onReaction(param)}
		style={styles.headerItem}>
		<CustomIcon name='reaction-add' size={24} />
	</Touch>
);

const Header = memo(({ handleReaction, message, isMasterDetail }: IHeader) => {
	const { width } = useWindowDimensions();
	const { frequentlyUsed, loaded } = useFrequentlyUsedEmoji(true);
	const size = (isMasterDetail ? width / 2 : width) - CONTAINER_MARGIN * 2;
	const quantity = Math.trunc(size / (ITEM_SIZE + ITEM_MARGIN * 2) - 1);

	const onReaction: TOnReaction = ({ emoji }) => {
		handleReaction(emoji || null, message);
		if (emoji) {
			addFrequentlyUsed(emoji);
		}
	};

	const renderItem = ({ item }: { item: IEmoji }) => <HeaderItem item={item} onReaction={onReaction} />;

	const renderFooter = () => <HeaderFooter onReaction={onReaction} />;

	if (!loaded) {
		return null;
	}

	return (
		<View style={styles.container}>
			<FlatList
				data={frequentlyUsed.slice(0, quantity)}
				renderItem={renderItem}
				ListFooterComponent={renderFooter}
				style={styles.flatList}
				keyExtractor={item => (typeof item === 'string' ? item : item.name)}
				showsHorizontalScrollIndicator={false}
				scrollEnabled={false}
				horizontal
			/>
		</View>
	);
});

export default Header;
