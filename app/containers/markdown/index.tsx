import { useMemo, type FC } from 'react';
import { type StyleProp, type TextStyle, View, useWindowDimensions } from 'react-native';
import { EnrichedMarkdownText } from 'react-native-enriched-markdown';
import { parse } from '@rocket.chat/message-parser';
import type { Options, Root } from '@rocket.chat/message-parser';
import isEmpty from 'lodash/isEmpty';

import { type IUserMention, type IUserChannel, type TOnLinkPress } from './interfaces';
import { buildRenderSegments, isBigEmojiOnly } from './serialize';
import { buildMarkdownStyle } from './buildMarkdownStyle';
import { useMarkdownLinkPress } from './hooks/useMarkdownLinkPress';
import { useParseOptions } from './hooks/useParseOptions';
import { useTheme } from '~/theme';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { useCustomEmoji } from '~/lib/hooks/useCustomEmoji';
import useShortnameToUnicode from '~/lib/hooks/useShortnameToUnicode';
import { useUserPreferences } from '~/lib/methods/userPreferences';
import { USER_MENTIONS_PREFERENCES_KEY, ROOM_MENTIONS_PREFERENCES_KEY } from '~/lib/constants/keys';
import { getUserSelector } from '~/selectors/login';
import log from '~/lib/methods/helpers/log';
import styles from './styles';

export { default as MarkdownPreview } from './components/Preview';

interface IMarkdownProps {
	msg?: string | null;
	md?: Root;
	mentions?: IUserMention[];
	username?: string;
	useRealName?: boolean;
	channels?: IUserChannel[];
	navToRoomInfo?: Function;
	onLinkPress?: TOnLinkPress;
	isTranslated?: boolean;
	textStyle?: StyleProp<TextStyle>;
}

const PARSE_CACHE_MAX = 200;
const parseCache = new Map<string, Root>();

const parseMessage = (msg: string, options: Options): Root => {
	const cacheKey = `${JSON.stringify(options)}${msg}`;
	const cached = parseCache.get(cacheKey);
	if (cached) {
		return cached;
	}

	const result = parse(msg, options);

	if (parseCache.size >= PARSE_CACHE_MAX) {
		const oldestKey = parseCache.keys().next().value;
		if (oldestKey !== undefined) {
			parseCache.delete(oldestKey);
		}
	}

	parseCache.set(cacheKey, result);
	return result;
};

const resolveTokens = (msg: string, md: Root | undefined, options: Options, isTranslated?: boolean): Root => {
	if (!isTranslated && md) {
		return md;
	}

	return parseMessage(msg, options);
};

const Markdown: FC<IMarkdownProps> = ({
	msg,
	md,
	mentions,
	channels,
	navToRoomInfo,
	useRealName,
	username = '',
	onLinkPress,
	isTranslated,
	textStyle
}: IMarkdownProps) => {
	const { colors } = useTheme();
	const { fontScale } = useWindowDimensions();
	const baseUrl = useAppSelector(state => state.server.server);
	const convertAsciiEmoji = useAppSelector(state => getUserSelector(state)?.settings?.preferences?.convertAsciiEmoji ?? false);
	const getCustomEmoji = useCustomEmoji();
	const { formatShortnameToUnicode } = useShortnameToUnicode();
	const [mentionsWithAtSymbol] = useUserPreferences<boolean>(USER_MENTIONS_PREFERENCES_KEY, false);
	const [roomsWithHashTagSymbol] = useUserPreferences<boolean>(ROOM_MENTIONS_PREFERENCES_KEY, false);
	const { handleLinkPress, handleLinkLongPress } = useMarkdownLinkPress({ channels, navToRoomInfo, onLinkPress });
	const parseOptions = useParseOptions();

	let tokens: Root | null = null;

	if (msg) {
		try {
			const result = resolveTokens(msg, md, parseOptions, isTranslated);
			tokens = isEmpty(result) ? null : result;
		} catch (e) {
			log(e);
		}
	}

	const segments = useMemo(() => {
		if (!tokens) {
			return [];
		}

		return buildRenderSegments(tokens, {
			mentions,
			channels,
			useRealName,
			username,
			mentionsWithAtSymbol: mentionsWithAtSymbol ?? false,
			roomsWithHashTagSymbol: roomsWithHashTagSymbol ?? false,
			getCustomEmoji,
			baseUrl,
			convertAsciiEmoji,
			formatShortnameToUnicode
		});
	}, [
		tokens,
		mentions,
		channels,
		useRealName,
		username,
		mentionsWithAtSymbol,
		roomsWithHashTagSymbol,
		getCustomEmoji,
		baseUrl,
		convertAsciiEmoji,
		formatShortnameToUnicode
	]);

	const bigEmojiOnly = isBigEmojiOnly(tokens);
	const markdownStyle = useMemo(() => buildMarkdownStyle(colors, bigEmojiOnly, fontScale), [colors, bigEmojiOnly, fontScale]);

	if (!tokens || segments.length === 0) {
		return null;
	}

	return (
		<View style={styles.blocks}>
			{segments.map((segment, index) => {
				if (segment.type === 'linebreak') {
					return <View key={`linebreak-${index}`} style={styles.lineBreak} />;
				}

				return (
					<EnrichedMarkdownText
						key={`markdown-${index}`}
						markdown={segment.content}
						accessibilityLabel={segment.accessibilityLabel}
						markdownStyle={markdownStyle}
						containerStyle={textStyle as TextStyle}
						flavor='github'
						md4cFlags={{ latexMath: true }}
						selectable={false}
						onLinkPress={event => handleLinkPress(event.url)}
						onLinkLongPress={event => handleLinkLongPress(event.url)}
					/>
				);
			})}
		</View>
	);
};

export default Markdown;
