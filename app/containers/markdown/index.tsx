import React, { useCallback, useEffect, useRef } from 'react';
import { Image, StyleProp, Text, TextStyle } from 'react-native';
import { Parser } from 'commonmark';
import Renderer from 'commonmark-react-renderer';
import { MarkdownAST } from '@rocket.chat/message-parser';

import MarkdownLink from './Link';
import MarkdownList from './List';
import MarkdownListItem from './ListItem';
import MarkdownAtMention from './AtMention';
import MarkdownHashtag from './Hashtag';
import MarkdownBlockQuote from './BlockQuote';
import MarkdownEmoji from './Emoji';
import MarkdownTable from './Table';
import MarkdownTableRow from './TableRow';
import MarkdownTableCell from './TableCell';
import mergeTextNodes from './mergeTextNodes';
import styles from './styles';
import { isValidURL } from '../../utils/url';
import NewMarkdown from './new';
import { formatText } from './formatText';
import { IUserMention, IUserChannel, TOnLinkPress } from './interfaces';
import { TGetCustomEmoji } from '../../definitions';
import { formatHyperlink } from './formatHyperlink';
import { useTheme } from '../../theme';
import { IRoomInfoParam } from '../../views/SearchMessagesView';

export { default as MarkdownPreview } from './Preview';

interface IMarkdownProps {
	msg?: string | null;
	md?: MarkdownAST;
	mentions?: IUserMention[];
	getCustomEmoji?: TGetCustomEmoji;
	baseUrl?: string;
	username?: string;
	tmid?: string;
	numberOfLines?: number;
	customEmojis?: boolean;
	useRealName?: boolean;
	channels?: IUserChannel[];
	enableMessageParser?: boolean;
	navToRoomInfo?: (params: IRoomInfoParam) => void;
	testID?: string;
	style?: StyleProp<TextStyle>[];
	onLinkPress?: TOnLinkPress;
}

type TLiteral = {
	literal: string;
};

const emojiRanges = [
	'\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]', // unicode emoji from https://www.regextester.com/106421
	':.{1,40}:', // custom emoji
	' |\n' // allow spaces and line breaks
].join('|');

const removeSpaces = (str: string) => str && str.replace(/\s/g, '');

const removeAllEmoji = (str: string) => str.replace(new RegExp(emojiRanges, 'g'), '');

const isOnlyEmoji = (str: string) => {
	str = removeSpaces(str);
	return !removeAllEmoji(str).length;
};

const removeOneEmoji = (str: string) => str.replace(new RegExp(emojiRanges), '');

const emojiCount = (str: string) => {
	str = removeSpaces(str);
	let oldLength = 0;
	let counter = 0;

	while (oldLength !== str.length) {
		oldLength = str.length;
		str = removeOneEmoji(str);
		if (oldLength !== str.length) {
			counter += 1;
		}
	}

	return counter;
};

const parser = new Parser();

const Markdown = ({
	msg,
	md,
	mentions,
	getCustomEmoji,
	baseUrl,
	username,
	tmid,
	numberOfLines,
	customEmojis,
	useRealName,
	channels,
	enableMessageParser,
	navToRoomInfo,
	style,
	onLinkPress
}: IMarkdownProps) => {
	const { theme, colors } = useTheme();
	const renderer = useRef<any>();
	const isMessageContainsOnlyEmoji = useRef(false);

	const isNewMarkdown = useCallback(() => !!enableMessageParser && !!md, [enableMessageParser, md]);
	const createRenderer = useCallback(
		() =>
			new Renderer({
				renderers: {
					text: renderText,

					emph: Renderer.forwardChildren,
					strong: Renderer.forwardChildren,
					del: Renderer.forwardChildren,
					code: renderCodeInline,
					link: renderLink,
					image: renderImage,
					atMention: renderAtMention,
					emoji: renderEmoji,
					hashtag: renderHashtag,

					paragraph: renderParagraph,
					heading: renderHeading,
					codeBlock: renderCodeBlock,
					blockQuote: renderBlockQuote,

					list: renderList,
					item: renderListItem,

					hardBreak: renderBreak,
					thematicBreak: renderBreak,
					softBreak: renderBreak,

					htmlBlock: renderText,
					htmlInline: renderText,

					table: renderTable,
					table_row: renderTableRow,
					table_cell: renderTableCell
				},
				renderParagraphsInLists: true
			}),
		[]
	);

	useEffect(() => {
		if (!isNewMarkdown() && msg) {
			renderer.current = createRenderer();
		}
	}, [createRenderer, isNewMarkdown, msg]);

	if (!msg) {
		return null;
	}

	const formattedMessage = formatHyperlink(formatText(msg));
	const ast = mergeTextNodes(parser.parse(formattedMessage));
	isMessageContainsOnlyEmoji.current = isOnlyEmoji(formattedMessage) && emojiCount(formattedMessage) <= 3;

	const renderText = ({ context, literal }: { context: []; literal: string }) => {
		const defaultStyle = [isMessageContainsOnlyEmoji.current ? styles.textBig : {}, ...context.map(type => styles[type])];
		return (
			<Text accessibilityLabel={literal} style={[styles.text, defaultStyle, ...(style || [])]} numberOfLines={numberOfLines}>
				{literal}
			</Text>
		);
	};

	const renderCodeInline = ({ literal }: TLiteral) => (
		<Text
			style={[
				{
					...styles.codeInline,
					color: colors.bodyText,
					backgroundColor: colors.bannerBackground,
					borderColor: colors.bannerBackground
				},
				...(style || [])
			]}>
			{literal}
		</Text>
	);

	const renderCodeBlock = ({ literal }: TLiteral) => (
		<Text
			style={[
				{
					...styles.codeBlock,
					color: colors.bodyText,
					backgroundColor: colors.bannerBackground,
					borderColor: colors.bannerBackground
				},
				...(style || [])
			]}>
			{literal}
		</Text>
	);

	const renderBreak = () => <Text>{tmid ? ' ' : '\n'}</Text>;

	const renderParagraph = ({ children }: any) => {
		if (!children || children.length === 0) {
			return null;
		}
		return (
			<Text style={[styles.text, style, { color: colors.bodyText }]} numberOfLines={numberOfLines}>
				{children}
			</Text>
		);
	};

	const renderLink = ({ children, href }: any) => (
		<MarkdownLink link={href} theme={theme} onLinkPress={onLinkPress}>
			{children}
		</MarkdownLink>
	);

	const renderHashtag = ({ hashtag }: { hashtag: string }) => (
		<MarkdownHashtag hashtag={hashtag} channels={channels} navToRoomInfo={navToRoomInfo} style={style} />
	);

	const renderAtMention = ({ mentionName }: { mentionName: string }) => (
		<MarkdownAtMention
			mentions={mentions}
			mention={mentionName}
			useRealName={useRealName}
			username={username}
			navToRoomInfo={navToRoomInfo}
			style={style}
		/>
	);

	const renderEmoji = ({ literal }: TLiteral) => (
		<MarkdownEmoji
			literal={literal}
			isMessageContainsOnlyEmoji={isMessageContainsOnlyEmoji.current}
			getCustomEmoji={getCustomEmoji}
			baseUrl={baseUrl || ''}
			customEmojis={customEmojis}
			style={style}
			theme={theme}
		/>
	);

	const renderImage = ({ src }: { src: string }) => {
		if (!isValidURL(src)) {
			return null;
		}

		return <Image style={styles.inlineImage} source={{ uri: encodeURI(src) }} />;
	};

	const renderHeading = ({ children, level }: any) => {
		// @ts-ignore
		const textStyle = styles[`heading${level}Text`];
		return (
			<Text numberOfLines={numberOfLines} style={[textStyle, { color: colors.bodyText }]}>
				{children}
			</Text>
		);
	};

	const renderList = ({ children, start, tight, type }: any) => (
		<MarkdownList ordered={type !== 'bullet'} start={start} tight={tight} numberOfLines={numberOfLines}>
			{children}
		</MarkdownList>
	);

	const renderListItem = ({ children, context, ...otherProps }: any) => {
		const level = context.filter((type: string) => type === 'list').length;

		return (
			<MarkdownListItem level={level} theme={theme} {...otherProps}>
				{children}
			</MarkdownListItem>
		);
	};

	const renderBlockQuote = ({ children }: { children: JSX.Element }) => (
		<MarkdownBlockQuote theme={theme}>{children}</MarkdownBlockQuote>
	);

	const renderTable = ({ children, numColumns }: { children: JSX.Element; numColumns: number }) => (
		<MarkdownTable numColumns={numColumns} theme={theme}>
			{children}
		</MarkdownTable>
	);

	const renderTableRow = (args: any) => <MarkdownTableRow {...args} theme={theme} />;

	const renderTableCell = (args: any) => <MarkdownTableCell {...args} theme={theme} />;

	if (isNewMarkdown()) {
		return (
			<NewMarkdown
				username={username || ''}
				baseUrl={baseUrl || ''}
				getCustomEmoji={getCustomEmoji}
				useRealName={useRealName}
				tokens={md}
				mentions={mentions}
				channels={channels}
				navToRoomInfo={navToRoomInfo}
				onLinkPress={onLinkPress}
			/>
		);
	}

	return renderer?.current?.render(ast) || null;
};
export default Markdown;
