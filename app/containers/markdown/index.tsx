import { useMemo, type FC } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { EnrichedMarkdownText } from 'react-native-enriched-markdown';
import isEmpty from 'lodash/isEmpty';

import { type IUserMention, type IUserChannel, type TOnLinkPress } from './interfaces';
import { parseMessage } from './parseMessage';
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
import { headers } from '~/lib/methods/helpers/fetch';
import { isIOS } from '~/lib/methods/helpers/deviceInfo';
import styles from './styles';

const imageRequestHeaders = isIOS && headers['User-Agent'] ? { 'User-Agent': headers['User-Agent'] } : undefined;

export { default as MarkdownPreview } from './components/Preview';

interface IMarkdownProps {
	msg?: string | null;
	mentions?: IUserMention[];
	username?: string;
	useRealName?: boolean;
	channels?: IUserChannel[];
	navToRoomInfo?: Function;
	onLinkPress?: TOnLinkPress;
}

const Markdown: FC<IMarkdownProps> = ({
	msg,
	mentions,
	channels,
	navToRoomInfo,
	useRealName,
	username = '',
	onLinkPress
}: IMarkdownProps) => {
	const { colors } = useTheme();
	const { fontScale } = useWindowDimensions();
	const baseUrl = useAppSelector(state => state.server.server);
	const convertAsciiEmoji = useAppSelector(state => getUserSelector(state)?.settings?.preferences?.convertAsciiEmoji ?? false);
	const getCustomEmoji = useCustomEmoji();
	const { formatShortnameToUnicode } = useShortnameToUnicode();
	const [mentionsWithAtSymbol] = useUserPreferences<boolean>(USER_MENTIONS_PREFERENCES_KEY, false);
	const [roomsWithHashTagSymbol] = useUserPreferences<boolean>(ROOM_MENTIONS_PREFERENCES_KEY, false);
	const { handleLinkPress, handleLinkLongPress } = useMarkdownLinkPress({ navToRoomInfo, onLinkPress });
	const parseOptions = useParseOptions();

	const { tokens, segments } = useMemo(() => {
		if (!msg) {
			return { tokens: null, segments: [] };
		}

		try {
			const parsed = parseMessage(String(msg), parseOptions);
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
						flavor='github'
						md4cFlags={{ latexMath: true }}
						imageRequestHeaders={imageRequestHeaders}
						selectable={false}
						enableTaskListItemToggle={false}
						enableBlockContextMenu={false}
						onLinkPress={event => handleLinkPress(event.url)}
						onLinkLongPress={event => handleLinkLongPress(event.url)}
					/>
				);
			})}
		</View>
	);
};

export default Markdown;
