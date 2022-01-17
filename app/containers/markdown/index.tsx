import React, { PureComponent } from 'react';
import { Image, Text } from 'react-native';
import { Node, Parser } from 'commonmark';
import Renderer from 'commonmark-react-renderer';
import removeMarkdown from 'remove-markdown';
import { MarkdownAST } from '@rocket.chat/message-parser';

import { UserMention } from '../message/interfaces';
import shortnameToUnicode from '../../utils/shortnameToUnicode';
import I18n from '../../i18n';
import { themes } from '../../constants/colors';
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

interface IMarkdownProps {
	msg: string;
	md: MarkdownAST;
	mentions: UserMention[];
	getCustomEmoji: Function;
	baseUrl: string;
	username: string;
	tmid: string;
	isEdited: boolean;
	numberOfLines: number;
	customEmojis: boolean;
	useRealName: boolean;
	channels: {
		name: string;
		_id: number;
	}[];
	enableMessageParser: boolean;
	navToRoomInfo: Function;
	preview: boolean;
	theme: string;
	testID: string;
	style: any;
	onLinkPress: Function;
}

type TLiteral = {
	literal: string;
};

// Support <http://link|Text>
const formatText = (text: string) =>
	text.replace(
		new RegExp('(?:<|<)((?:https|http):\\/\\/[^\\|]+)\\|(.+?)(?=>|>)(?:>|>)', 'gm'),
		(match, url, title) => `[${title}](${url})`
	);

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

class Markdown extends PureComponent<IMarkdownProps, any> {
	private renderer: any;

	private isMessageContainsOnlyEmoji!: boolean;

	constructor(props: IMarkdownProps) {
		super(props);
		if (!this.isNewMarkdown) {
			this.renderer = this.createRenderer();
		}
	}

	createRenderer = () =>
		new Renderer({
			renderers: {
				text: this.renderText,

				emph: Renderer.forwardChildren,
				strong: Renderer.forwardChildren,
				del: Renderer.forwardChildren,
				code: this.renderCodeInline,
				link: this.renderLink,
				image: this.renderImage,
				atMention: this.renderAtMention,
				emoji: this.renderEmoji,
				hashtag: this.renderHashtag,

				paragraph: this.renderParagraph,
				heading: this.renderHeading,
				codeBlock: this.renderCodeBlock,
				blockQuote: this.renderBlockQuote,

				list: this.renderList,
				item: this.renderListItem,

				hardBreak: this.renderBreak,
				thematicBreak: this.renderBreak,
				softBreak: this.renderBreak,

				htmlBlock: this.renderText,
				htmlInline: this.renderText,

				table: this.renderTable,
				table_row: this.renderTableRow,
				table_cell: this.renderTableCell,

				editedIndicator: this.renderEditedIndicator
			},
			renderParagraphsInLists: true
		});

	get isNewMarkdown(): boolean {
		const { md, enableMessageParser } = this.props;
		return enableMessageParser && !!md;
	}

	editedMessage = (ast: any) => {
		const { isEdited } = this.props;
		if (isEdited) {
			const editIndicatorNode = new Node('edited_indicator');
			if (ast.lastChild && ['heading', 'paragraph'].includes(ast.lastChild.type)) {
				ast.lastChild.appendChild(editIndicatorNode);
			} else {
				const node = new Node('paragraph');
				node.appendChild(editIndicatorNode);

				ast.appendChild(node);
			}
		}
	};

	renderText = ({ context, literal }: { context: []; literal: string }) => {
		const { numberOfLines, style = [] } = this.props;
		const defaultStyle = [this.isMessageContainsOnlyEmoji ? styles.textBig : {}, ...context.map(type => styles[type])];
		return (
			<Text accessibilityLabel={literal} style={[styles.text, defaultStyle, ...style]} numberOfLines={numberOfLines}>
				{literal}
			</Text>
		);
	};

	renderCodeInline = ({ literal }: TLiteral) => {
		const { theme, style = [] } = this.props;
		return (
			<Text
				style={[
					{
						...styles.codeInline,
						color: themes[theme].bodyText,
						backgroundColor: themes[theme].bannerBackground,
						borderColor: themes[theme].bannerBackground
					},
					...style
				]}>
				{literal}
			</Text>
		);
	};

	renderCodeBlock = ({ literal }: TLiteral) => {
		const { theme, style = [] } = this.props;
		return (
			<Text
				style={[
					{
						...styles.codeBlock,
						color: themes[theme].bodyText,
						backgroundColor: themes[theme].bannerBackground,
						borderColor: themes[theme].bannerBackground
					},
					...style
				]}>
				{literal}
			</Text>
		);
	};

	renderBreak = () => {
		const { tmid } = this.props;
		return <Text>{tmid ? ' ' : '\n'}</Text>;
	};

	renderParagraph = ({ children }: any) => {
		const { numberOfLines, style, theme } = this.props;
		if (!children || children.length === 0) {
			return null;
		}
		return (
			<Text style={[styles.text, style, { color: themes[theme].bodyText }]} numberOfLines={numberOfLines}>
				{children}
			</Text>
		);
	};

	renderLink = ({ children, href }: any) => {
		const { theme, onLinkPress } = this.props;
		return (
			<MarkdownLink link={href} theme={theme} onLinkPress={onLinkPress}>
				{children}
			</MarkdownLink>
		);
	};

	renderHashtag = ({ hashtag }: { hashtag: string }) => {
		const { channels, navToRoomInfo, style } = this.props;
		return <MarkdownHashtag hashtag={hashtag} channels={channels} navToRoomInfo={navToRoomInfo} style={style} />;
	};

	renderAtMention = ({ mentionName }: { mentionName: string }) => {
		const { username, mentions, navToRoomInfo, useRealName, style } = this.props;
		return (
			<MarkdownAtMention
				mentions={mentions}
				mention={mentionName}
				useRealName={useRealName}
				username={username}
				navToRoomInfo={navToRoomInfo}
				style={style}
			/>
		);
	};

	renderEmoji = ({ literal }: TLiteral) => {
		const { getCustomEmoji, baseUrl, customEmojis, style, theme } = this.props;
		return (
			<MarkdownEmoji
				literal={literal}
				isMessageContainsOnlyEmoji={this.isMessageContainsOnlyEmoji}
				getCustomEmoji={getCustomEmoji}
				baseUrl={baseUrl}
				customEmojis={customEmojis}
				style={style}
				theme={theme}
			/>
		);
	};

	renderImage = ({ src }: { src: string }) => {
		if (!isValidURL(src)) {
			return null;
		}

		return <Image style={styles.inlineImage} source={{ uri: encodeURI(src) }} />;
	};

	renderEditedIndicator = () => {
		const { theme } = this.props;
		return <Text style={[styles.edited, { color: themes[theme].auxiliaryText }]}> ({I18n.t('edited')})</Text>;
	};

	renderHeading = ({ children, level }: any) => {
		const { numberOfLines, theme } = this.props;
		const textStyle = styles[`heading${level}Text`];
		return (
			<Text numberOfLines={numberOfLines} style={[textStyle, { color: themes[theme].bodyText }]}>
				{children}
			</Text>
		);
	};

	renderList = ({ children, start, tight, type }: any) => {
		const { numberOfLines } = this.props;
		return (
			<MarkdownList ordered={type !== 'bullet'} start={start} tight={tight} numberOfLines={numberOfLines}>
				{children}
			</MarkdownList>
		);
	};

	renderListItem = ({ children, context, ...otherProps }: any) => {
		const { theme } = this.props;
		const level = context.filter((type: string) => type === 'list').length;

		return (
			<MarkdownListItem level={level} theme={theme} {...otherProps}>
				{children}
			</MarkdownListItem>
		);
	};

	renderBlockQuote = ({ children }: { children: JSX.Element }) => {
		const { theme } = this.props;
		return <MarkdownBlockQuote theme={theme}>{children}</MarkdownBlockQuote>;
	};

	renderTable = ({ children, numColumns }: { children: JSX.Element; numColumns: number }) => {
		const { theme } = this.props;
		return (
			<MarkdownTable numColumns={numColumns} theme={theme}>
				{children}
			</MarkdownTable>
		);
	};

	renderTableRow = (args: any) => {
		const { theme } = this.props;
		return <MarkdownTableRow {...args} theme={theme} />;
	};

	renderTableCell = (args: any) => {
		const { theme } = this.props;
		return <MarkdownTableCell {...args} theme={theme} />;
	};

	render() {
		const {
			msg,
			md,
			numberOfLines,
			preview = false,
			theme,
			style = [],
			testID,
			mentions,
			channels,
			navToRoomInfo,
			useRealName,
			username,
			getCustomEmoji,
			baseUrl,
			onLinkPress
		} = this.props;

		if (!msg) {
			return null;
		}

		if (this.isNewMarkdown && !preview) {
			return (
				<NewMarkdown
					username={username}
					baseUrl={baseUrl}
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

		let m = formatText(msg);

		// Ex: '[ ](https://open.rocket.chat/group/test?msg=abcdef)  Test'
		// Return: 'Test'
		m = m.replace(/^\[([\s]*)\]\(([^)]*)\)\s/, '').trim();

		if (preview) {
			m = shortnameToUnicode(m);
			// Removes sequential empty spaces
			m = m.replace(/\s+/g, ' ');
			m = removeMarkdown(m);
			m = m.replace(/\n+/g, ' ');
			return (
				<Text
					accessibilityLabel={m}
					style={[styles.text, { color: themes[theme].bodyText }, ...style]}
					numberOfLines={numberOfLines}
					testID={testID}>
					{m}
				</Text>
			);
		}

		let ast = parser.parse(m);
		ast = mergeTextNodes(ast);
		this.isMessageContainsOnlyEmoji = isOnlyEmoji(m) && emojiCount(m) <= 3;
		this.editedMessage(ast);
		return this.renderer.render(ast);
	}
}

export default Markdown;
