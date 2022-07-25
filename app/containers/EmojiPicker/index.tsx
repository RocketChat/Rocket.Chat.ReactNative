import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import ScrollableTabView from 'react-native-scrollable-tab-view';
import orderBy from 'lodash/orderBy';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import TabBar from './TabBar';
import EmojiCategory from './EmojiCategory';
import Footer from './Footer';
import styles from './styles';
import categories from './categories';
import database from '../../lib/database';
import { emojisByCategory } from './emojis';
import protectedFunction from '../../lib/methods/helpers/protectedFunction';
import shortnameToUnicode from '../../lib/methods/helpers/shortnameToUnicode';
import log from '../../lib/methods/helpers/log';
import { useTheme } from '../../theme';
import { IEmoji, ICustomEmojis, TFrequentlyUsedEmojiModel } from '../../definitions';
import { useAppSelector } from '../../lib/hooks';
import { IEmojiPickerProps, EventTypes } from './interfaces';

export const useFrequentlyUsedEmoji = () => {
	const [frequentlyUsed, setFrequentlyUsed] = useState<(string | IEmoji)[]>([]);
	const [loaded, setLoaded] = useState(false);
	const getFrequentlyUsedEmojis = async () => {
		const db = database.active;
		const frequentlyUsedRecords = await db.get('frequently_used_emojis').query().fetch();
		const frequentlyUsedOrdered = orderBy(frequentlyUsedRecords, ['count'], ['desc']);
		const frequentlyUsedEmojis = frequentlyUsedOrdered.map(item => {
			if (item.isCustom) {
				return { content: item.content, extension: item.extension, isCustom: item.isCustom };
			}
			return shortnameToUnicode(`${item.content}`);
		}) as (string | IEmoji)[];
		setFrequentlyUsed(frequentlyUsedEmojis);
		setLoaded(true);
	};
	useEffect(() => {
		getFrequentlyUsedEmojis();
	}, []);
	return { frequentlyUsed, loaded };
};

const EmojiPicker = ({
	onItemClicked,
	tabEmojiStyle,
	isEmojiKeyboard = false,
	searching = false,
	searchedEmojis = []
}: IEmojiPickerProps): React.ReactElement | null => {
	const [width, setWidth] = useState(null);
	const { colors } = useTheme();
	const { frequentlyUsed, loaded } = useFrequentlyUsedEmoji();

	const baseUrl = useAppSelector(state => state.server?.server);
	const allCustomEmojis: ICustomEmojis = useAppSelector(state => state.customEmojis);
	const customEmojis = useMemo(
		() =>
			Object.keys(allCustomEmojis)
				.filter(item => item === allCustomEmojis[item].name)
				.map(item => ({
					content: allCustomEmojis[item].name,
					extension: allCustomEmojis[item].extension,
					isCustom: true
				})),
		[allCustomEmojis]
	);

	const handleEmojiSelect = (emoji: IEmoji) => {
		try {
			if (emoji.isCustom) {
				_addFrequentlyUsed({
					content: emoji.content,
					extension: emoji.extension,
					isCustom: true
				});
				onItemClicked(EventTypes.EMOJI_PRESSED, `:${emoji.content}:`);
			} else {
				const content = emoji;
				_addFrequentlyUsed({ content, isCustom: false });
				const shortname = `:${emoji}:`;
				onItemClicked(EventTypes.EMOJI_PRESSED, shortnameToUnicode(shortname), shortname);
			}
		} catch (e) {
			log(e);
		}
	};

	const _addFrequentlyUsed = protectedFunction(async (emoji: IEmoji) => {
		const db = database.active;
		const freqEmojiCollection = db.get('frequently_used_emojis');
		let freqEmojiRecord: TFrequentlyUsedEmojiModel;
		try {
			freqEmojiRecord = await freqEmojiCollection.find(emoji.content);
		} catch (error) {
			// Do nothing
		}

		await db.write(async () => {
			if (freqEmojiRecord) {
				await freqEmojiRecord.update(f => {
					if (f.count) {
						f.count += 1;
					}
				});
			} else {
				await freqEmojiCollection.create(f => {
					f._raw = sanitizedRaw({ id: emoji.content }, freqEmojiCollection.schema);
					Object.assign(f, emoji);
					f.count = 1;
				});
			}
		});
	});

	const onLayout = ({
		nativeEvent: {
			layout: { width }
		}
	}: any) => setWidth(width);

	const renderCategory = (category: keyof typeof emojisByCategory, i: number, label: string, tabsCount: number) => {
		let emojis = [];
		if (i === 0) {
			emojis = frequentlyUsed;
		} else if (i === 1) {
			emojis = customEmojis;
		} else {
			emojis = emojisByCategory[category];
		}
		return (
			<EmojiCategory
				emojis={emojis as IEmoji[]}
				onEmojiSelected={(emoji: IEmoji) => handleEmojiSelect(emoji)}
				style={styles.categoryContainer}
				width={width}
				baseUrl={baseUrl}
				tabLabel={label}
				tabsCount={tabsCount}
			/>
		);
	};

	if (!loaded) {
		return null;
	}

	const tabsCount = frequentlyUsed.length === 0 ? categories.tabs.length - 1 : categories.tabs.length;

	return (
		<View onLayout={onLayout} style={{ flex: 1 }}>
			{searching ? (
				<EmojiCategory
					emojis={searchedEmojis as IEmoji[]}
					onEmojiSelected={(emoji: IEmoji) => handleEmojiSelect(emoji)}
					style={styles.categoryContainer}
					width={width}
					baseUrl={baseUrl}
					tabLabel={'searching'}
					tabsCount={tabsCount}
				/>
			) : (
				<ScrollableTabView
					renderTabBar={() => <TabBar tabEmojiStyle={tabEmojiStyle} />}
					contentProps={{
						keyboardShouldPersistTaps: 'always',
						keyboardDismissMode: 'none'
					}}
					style={{ backgroundColor: colors.focusedBackground }}
				>
					{categories.tabs.map((tab: any, i) =>
						i === 0 && frequentlyUsed.length === 0
							? null // when no frequentlyUsed don't show the tab
							: renderCategory(tab.category, i, tab.tabLabel, tabsCount)
					)}
				</ScrollableTabView>
			)}
			{isEmojiKeyboard && (
				<Footer
					onSearchPressed={() => onItemClicked(EventTypes.SEARCH_PRESSED)}
					onBackspacePressed={() => onItemClicked(EventTypes.BACKSPACE_PRESSED)}
				/>
			)}
		</View>
	);
};

export default EmojiPicker;
