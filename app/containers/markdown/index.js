import React, { PureComponent } from 'react';
import { View, Text, Image } from 'react-native';
import { Parser, Node } from 'commonmark';
import Renderer from 'commonmark-react-renderer';
import PropTypes from 'prop-types';
import { emojify } from 'react-emojione';

import CustomEmoji from '../EmojiPicker/CustomEmoji';
import I18n from '../../i18n';

import MarkdownLink from './Link';
import MarkdownList from './List';
import MarkdownListItem from './ListItem';
import MarkdownAtMention from './AtMention';
import MarkdownHashtag from './Hashtag';

import styles from './styles';

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

export default class Markdown extends PureComponent {
	static propTypes = {
		msg: PropTypes.string,
		getCustomEmoji: PropTypes.func,
		baseUrl: PropTypes.string,
		username: PropTypes.string,
		isEdited: PropTypes.bool,
		numberOfLines: PropTypes.number,
		useMarkdown: PropTypes.bool,
		channels: PropTypes.oneOfType([PropTypes.array, PropTypes.object])
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
			channelLink: () => null,
			emoji: this.renderEmoji,
			hashtag: this.renderHashtag,

			paragraph: this.renderParagraph,
			heading: () => null,
			codeBlock: this.renderCodeBlock,
			blockQuote: () => null,

			list: this.renderList,
			item: this.renderListItem,

			hardBreak: () => null,
			thematicBreak: () => null,
			softBreak: () => null,

			htmlBlock: () => null,
			htmlInline: () => null,

			table: () => null,
			table_row: () => null,
			table_cell: () => null,

			editedIndicator: this.renderEditedIndicator
		},
		renderParagraphsInLists: true
	});

	renderText = ({ literal }) => <Text style={styles.text}>{literal}</Text>;

	renderCodeInline = ({ literal }) => <Text style={styles.codeInline}>{literal}</Text>;

	renderCodeBlock = ({ literal }) => <Text style={styles.codeBlock}>{literal}</Text>;

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

	renderLink = ({ href }) => <MarkdownLink link={href} />;

	renderHashtag = ({ hashtag }) => {
		const { channels } = this.props;
		return (
			<MarkdownHashtag
				hashtag={hashtag}
				channels={channels}
			/>
		);
	}

	renderAtMention = ({ mentionName }) => {
		const { username } = this.props;
		return (
			<MarkdownAtMention
				mention={mentionName}
				username={username}
			/>
		);
	}

	renderEmoji = ({ emojiName, literal }) => {
		const emojiUnicode = emojify(literal, { output: 'unicode' });
		const { getCustomEmoji, baseUrl } = this.props;
		const emoji = getCustomEmoji && getCustomEmoji(emojiName);
		if (emoji) {
			return (
				<CustomEmoji
					baseUrl={baseUrl}
					style={this.isMessageContainsOnlyEmoji ? styles.customEmojiBig : styles.customEmoji}
					emoji={emoji}
				/>
			);
		}
		return <Text style={this.isMessageContainsOnlyEmoji ? styles.textBig : styles.text}>{emojiUnicode}</Text>;
	}

	renderImage = ({ src }) => <Image style={styles.inlineImage} source={{ uri: src }} />;

	renderEditedIndicator = () => <Text style={styles.edited}> ({I18n.t('edited')})</Text>;

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

	render() {
		const {
			msg, isEdited, useMarkdown, numberOfLines
		} = this.props;

		if (!useMarkdown) {
			return <Text style={styles.text} numberOfLines={numberOfLines}>{msg}</Text>;
		}

		const ast = this.parser.parse(msg);
		this.isMessageContainsOnlyEmoji = isOnlyEmoji(msg) && emojiCount(msg) <= 3;

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

		return this.renderer.render(ast);
	}
}
