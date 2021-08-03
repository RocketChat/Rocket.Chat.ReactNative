import React from 'react';
import { Text, PropTypes } from 'react-native';
import MarkdownLink from '../Link';
import MarkdownList from '../List';
import MarkdownListItem from '../ListItem';
import MarkdownAtMention from '../AtMention';
import MarkdownHashtag from '../Hashtag';
import MarkdownBlockQuote from '../BlockQuote';
import MarkdownEmoji from '../Emoji';
import MarkdownTable from '../Table';
import MarkdownTableRow from '../TableRow';
import MarkdownTableCell from '../TableCell';
import styles from '../styles';
import { withTheme } from '../../../theme';
import { themes } from '../../../constants/colors';


const NewMarkdown = ({ md, theme }) => (
	<>
		{md.map((block, index) => {
			switch (block.type) {
				case 'PARAGRAPH':
					return (
						<Text style={[styles.text, style, { color: themes[theme].bodyText }]} numberOfLines={numberOfLines} index={index}>
							{block.value?.value}
						</Text>
					);
				case 'LINK':
					return <MarkdownLink />;
				default:
					return null;
			}
		})}
	</>
);

NewMarkdown.propTypes = {
	md: PropTypes.array,
	theme: PropTypes.string
};

export default withTheme(NewMarkdown);
