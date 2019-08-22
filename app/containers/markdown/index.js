import React, { PureComponent } from 'react';
import { View, Text, Image } from 'react-native';
import { Parser, Node } from 'commonmark';
import Renderer from 'commonmark-react-renderer';
import PropTypes from 'prop-types';

import I18n from '../../i18n';

import MarkdownLink from './Link';
import MarkdownList from './List';
import MarkdownListItem from './ListItem';
import MarkdownAtMention from './AtMention';
import MarkdownHashtag from './Hashtag';
import MarkdownBlockQuote from './BlockQuote';
import MarkdownEmoji from './Emoji';

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

			table: () => null,
			table_row: () => null,
			table_cell: () => null,

			editedIndicator: this.renderEditedIndicator
		},
		renderParagraphsInLists: true
	});

	renderText = ({ context, literal }) => <Text style={[styles.text, ...context.map(type => styles[type])]}>{literal}</Text>;

	renderCodeInline = ({ literal }) => <Text style={styles.codeInline}>{literal}</Text>;

	renderCodeBlock = ({ literal }) => <Text style={styles.codeBlock}>{literal}</Text>;

	renderBreak = () => <Text>{'\n'}</Text>;

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

	renderBlockQuote = ({ children, ...otherProps }) => (
		<MarkdownBlockQuote {...otherProps}>
			{children}
		</MarkdownBlockQuote>
	)

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
