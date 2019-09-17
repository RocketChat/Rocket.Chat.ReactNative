import React, { PureComponent } from 'react';
import { View, Text, Image } from 'react-native';
import { Parser, Node } from 'commonmark';
import Renderer from 'commonmark-react-renderer';
import PropTypes from 'prop-types';
import { toShort, shortnameToUnicode } from 'emoji-toolkit';

import I18n from '../../i18n';

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

import styles from './styles';

// Support <http://link|Text>
const formatText = text => text.replace(
	new RegExp('(?:<|<)((?:https|http):\\/\\/[^\\|]+)\\|(.+?)(?=>|>)(?:>|>)', 'gm'),
	(match, url, title) => `[${ title }](${ url })`
);

const emojiRanges = [
	'\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]', // unicode emoji from https://www.regextester.com/106421
	':.{1,40}:', // custom emoji
	' |\n' // allow spaces and line breaks
].join('|');

const removeAllEmoji = str => str.replace(new RegExp(emojiRanges, 'g'), '');

const isOnlyEmoji = str => !removeAllEmoji(str).length;

const removeOneEmoji = str => str.replace(new RegExp(emojiRanges), '');

const emojiCount = (str) => {
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

const encodeEmojis = str => toShort(shortnameToUnicode(str));

export default class Markdown extends PureComponent {
	static propTypes = {
		msg: PropTypes.string,
		getCustomEmoji: PropTypes.func,
		baseUrl: PropTypes.string,
		username: PropTypes.string,
		tmid: PropTypes.string,
		isEdited: PropTypes.bool,
		numberOfLines: PropTypes.number,
		useMarkdown: PropTypes.bool,
		channels: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
		mentions: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
		navToRoomInfo: PropTypes.func
	};

	constructor(props) {
		super(props);

		this.parser = this.createParser();
		this.renderer = this.createRenderer();
	}

	createParser = () => new Parser();

	createRenderer = () => new Renderer({
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

	editedMessage = (ast) => {
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

	renderText = ({ context, literal }) => {
		const { numberOfLines } = this.props;
		return (
			<Text
				style={[
					this.isMessageContainsOnlyEmoji ? styles.textBig : styles.text,
					...context.map(type => styles[type])
				]}
				numberOfLines={numberOfLines}
			>
				{literal}
			</Text>
		);
	}

	renderCodeInline = ({ literal }) => <Text style={styles.codeInline}>{literal}</Text>;

	renderCodeBlock = ({ literal }) => <Text style={styles.codeBlock}>{literal}</Text>;

	renderBreak = () => {
		const { tmid } = this.props;
		return <Text>{tmid ? ' ' : '\n'}</Text>;
	}

	renderParagraph = ({ children }) => {
		if (!children || children.length === 0) {
			return null;
		}
		return (
			<View style={styles.block}>
				<Text>
					{children}
				</Text>
			</View>
		);
	};

	renderLink = ({ children, href }) => (
		<MarkdownLink link={href}>
			{children}
		</MarkdownLink>
	);

	renderHashtag = ({ hashtag }) => {
		const { channels, navToRoomInfo } = this.props;
		return (
			<MarkdownHashtag
				hashtag={hashtag}
				channels={channels}
				navToRoomInfo={navToRoomInfo}
			/>
		);
	}

	renderAtMention = ({ mentionName }) => {
		const { username, mentions, navToRoomInfo } = this.props;
		return (
			<MarkdownAtMention
				mentions={mentions}
				mention={mentionName}
				username={username}
				navToRoomInfo={navToRoomInfo}
			/>
		);
	}

	renderEmoji = ({ emojiName, literal }) => {
		const { getCustomEmoji, baseUrl } = this.props;
		return (
			<MarkdownEmoji
				emojiName={emojiName}
				literal={literal}
				isMessageContainsOnlyEmoji={this.isMessageContainsOnlyEmoji}
				getCustomEmoji={getCustomEmoji}
				baseUrl={baseUrl}
			/>
		);
	}

	renderImage = ({ src }) => <Image style={styles.inlineImage} source={{ uri: src }} />;

	renderEditedIndicator = () => <Text style={styles.edited}> ({I18n.t('edited')})</Text>;

	renderHeading = ({ children, level }) => {
		const textStyle = styles[`heading${ level }Text`];
		return (
			<Text style={textStyle}>
				{children}
			</Text>
		);
	};

	renderList = ({
		children, start, tight, type
	}) => (
		<MarkdownList
			ordered={type !== 'bullet'}
			start={start}
			tight={tight}
		>
			{children}
		</MarkdownList>
	);

	renderListItem = ({
		children, context, ...otherProps
	}) => {
		const level = context.filter(type => type === 'list').length;

		return (
			<MarkdownListItem
				level={level}
				{...otherProps}
			>
				{children}
			</MarkdownListItem>
		);
	};

	renderBlockQuote = ({ children }) => (
		<MarkdownBlockQuote>
			{children}
		</MarkdownBlockQuote>
	);

	renderTable = ({ children, numColumns }) => (
		<MarkdownTable numColumns={numColumns}>
			{children}
		</MarkdownTable>
	);

	renderTableRow = args => <MarkdownTableRow {...args} />;

	renderTableCell = args => <MarkdownTableCell {...args} />;

	render() {
		const {
			msg, useMarkdown = true, numberOfLines
		} = this.props;

		if (!msg) {
			return null;
		}

		let m = formatText(msg);

		// Ex: '[ ](https://open.rocket.chat/group/test?msg=abcdef)  Test'
		// Return: 'Test'
		m = m.replace(/^\[([\s]]*)\]\(([^)]*)\)\s/, '').trim();

		if (!useMarkdown) {
			return <Text style={styles.text} numberOfLines={numberOfLines}>{m}</Text>;
		}

		const ast = this.parser.parse(m);
		const encodedEmojis = encodeEmojis(m);
		this.isMessageContainsOnlyEmoji = isOnlyEmoji(encodedEmojis) && emojiCount(encodedEmojis) <= 3;

		this.editedMessage(ast);

		return this.renderer.render(ast);
	}
}
