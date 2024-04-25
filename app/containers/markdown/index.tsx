import React, { PureComponent } from 'react';
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
import { isValidUrl } from '../../lib/methods/helpers/isValidUrl';
import NewMarkdown from './new';
import { formatText } from './formatText';
import { IUserMention, IUserChannel, TOnLinkPress } from './interfaces';
import { TGetCustomEmoji } from '../../definitions/IEmoji';
import { formatHyperlink } from './formatHyperlink';
import { TSupportedThemes, withTheme } from '../../theme';
import { themes } from '../../lib/constants';

export { default as MarkdownPreview } from './Preview';

interface IMarkdownProps {
	msg?: string | null;
	theme?: TSupportedThemes;
	md?: MarkdownAST;
	mentions?: IUserMention[];
	getCustomEmoji?: TGetCustomEmoji;
	username?: string;
	tmid?: string;
	numberOfLines?: number;
	customEmojis?: boolean;
	useRealName?: boolean;
	channels?: IUserChannel[];
	enableMessageParser?: boolean;
	// TODO: Refactor when migrate Room
	navToRoomInfo?: Function;
	testID?: string;
	style?: StyleProp<TextStyle>[];
	onLinkPress?: TOnLinkPress;
	isTranslated?: boolean;
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

class Markdown extends PureComponent<IMarkdownProps, any> {
	private renderer: any;

	private isMessageContainsOnlyEmoji!: boolean;

	constructor(props: IMarkdownProps) {
		super(props);
		this.renderer = this.createRenderer();
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
				table_cell: this.renderTableCell
			},
			renderParagraphsInLists: true
		});

	get isNewMarkdown(): boolean {
		const { md, enableMessageParser } = this.props;
		return (enableMessageParser ?? true) && !!md;
	}

	renderText = ({ context, literal }: { context: []; literal: string }) => {
		const { numberOfLines } = this.props;
		const defaultStyle = [this.isMessageContainsOnlyEmoji ? styles.textBig : {}, ...context.map(type => styles[type])];
		return (
			<Text accessibilityLabel={literal} style={[styles.text, defaultStyle]} numberOfLines={numberOfLines}>
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
						color: themes[theme!].fontDefault,
						backgroundColor: themes[theme!].surfaceNeutral,
						borderColor: themes[theme!].surfaceNeutral
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
						backgroundColor: themes[theme!].surfaceNeutral,
						borderColor: themes[theme!].strokeLight,
						color: themes[theme!].fontDefault
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
		const { numberOfLines, style = [], theme } = this.props;
		if (!children || children.length === 0) {
			return null;
		}
		return (
			<Text style={[styles.text, { color: themes[theme!].fontDefault }, ...style]} numberOfLines={numberOfLines}>
				{children}
			</Text>
		);
	};

	renderLink = ({ children, href }: any) => {
		const { theme, onLinkPress } = this.props;
		return (
			<MarkdownLink link={href} theme={theme!} onLinkPress={onLinkPress}>
				{children}
			</MarkdownLink>
		);
	};

	renderHashtag = ({ hashtag }: { hashtag: string }) => {
		const { channels, navToRoomInfo, style } = this.props;
		return <MarkdownHashtag hashtag={hashtag} channels={channels} navToRoomInfo={navToRoomInfo} style={style} />;
	};

	renderAtMention = ({ mentionName }: { mentionName: string }) => {
		const { username = '', mentions, navToRoomInfo, useRealName, style } = this.props;
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
		const { getCustomEmoji, customEmojis, style } = this.props;
		return (
			<MarkdownEmoji
				literal={literal}
				isMessageContainsOnlyEmoji={this.isMessageContainsOnlyEmoji}
				getCustomEmoji={getCustomEmoji}
				customEmojis={customEmojis}
				style={style}
			/>
		);
	};

	renderImage = ({ src }: { src: string }) => {
		if (!isValidUrl(src)) {
			return null;
		}

		return <Image style={styles.inlineImage} source={{ uri: encodeURI(src) }} />;
	};

	renderHeading = ({ children, level }: any) => {
		const { numberOfLines, theme } = this.props;
		// @ts-ignore
		const textStyle = styles[`heading${level}Text`];
		return (
			<Text numberOfLines={numberOfLines} style={[textStyle, { color: themes[theme!].fontDefault }]}>
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
		return <MarkdownBlockQuote theme={theme!}>{children}</MarkdownBlockQuote>;
	};

	renderTable = ({ children, numColumns }: { children: JSX.Element; numColumns: number }) => {
		const { theme } = this.props;
		return (
			<MarkdownTable numColumns={numColumns} theme={theme!}>
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
			mentions,
			channels,
			navToRoomInfo,
			useRealName,
			username = '',
			getCustomEmoji,
			onLinkPress,
			isTranslated
		} = this.props;

		if (!msg) {
			return null;
		}

		if (this.isNewMarkdown && !isTranslated) {
			return (
				<NewMarkdown
					username={username}
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
		m = formatHyperlink(m);
		let ast = parser.parse(m);
		ast = mergeTextNodes(ast);
		this.isMessageContainsOnlyEmoji = isOnlyEmoji(m) && emojiCount(m) <= 3;
		return this.renderer?.render(ast) || null;
	}
}

export default withTheme(Markdown);
