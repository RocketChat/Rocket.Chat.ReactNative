import { useMemo, type FC } from 'react';
import { type StyleProp, StyleSheet, type TextStyle, View, useWindowDimensions } from 'react-native';
import { EnrichedMarkdownText } from 'react-native-enriched-markdown';
import { parse } from '@rocket.chat/message-parser';
import type { Root } from '@rocket.chat/message-parser';
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

	const { tokens, segments } = useMemo(() => {
		if (!msg) {
			return { tokens: null, segments: [] };
		}

		try {
			const parsed = !isTranslated && md ? md : parse(msg, parseOptions);
			if (isEmpty(parsed)) {
				return { tokens: null, segments: [] };
			}

			return {
				tokens: parsed,
				segments: buildRenderSegments(parsed, {
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
				})
			};
		} catch (error) {
			log(error);
			return { tokens: null, segments: [] };
		}
	}, [
		msg,
		md,
		isTranslated,
		parseOptions,
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

	if (segments.length === 0) {
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
						containerStyle={StyleSheet.flatten(textStyle)}
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
