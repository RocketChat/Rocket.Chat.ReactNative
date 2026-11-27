import { useMemo, type FC } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { type Root } from '@rocket.chat/message-parser';
import { EnrichedMarkdownText } from 'react-native-enriched-markdown';

import { type IUserMention, type IUserChannel, type TOnLinkPress } from './interfaces';
import { buildMarkdownStyle } from './buildMarkdownStyle';
import { useMarkdownLinkPress } from './hooks/useMarkdownLinkPress';
import { useMarkdownSegments } from './hooks/useMarkdownSegments';
import { useTheme } from '~/theme';
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
}

const Markdown: FC<IMarkdownProps> = ({
	msg,
	md,
	mentions,
	channels,
	navToRoomInfo,
	useRealName,
	username = '',
	onLinkPress
}: IMarkdownProps) => {
	const { colors } = useTheme();
	const { fontScale } = useWindowDimensions();
	const { handleLinkPress, handleLinkLongPress } = useMarkdownLinkPress({ navToRoomInfo, onLinkPress });
	const { segments, bigEmojiOnly } = useMarkdownSegments({
		msg: String(msg || ''),
		md,
		mentions,
		channels,
		useRealName,
		username
	});
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
						markdownStyle={markdownStyle}
						flavor='github'
						md4cFlags={{ latexMath: true }}
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
