import React from 'react';
import { Text, PropTypes } from 'react-native';
import MarkdownLink from '../Link';
import MarkdownList from '../List';
// import MarkdownListItem from '../ListItem';
// import MarkdownAtMention from '../AtMention';
// import MarkdownHashtag from '../Hashtag';
import MarkdownBlockQuote from '../BlockQuote';
// import MarkdownTable from '../Table';
// import MarkdownTableRow from '../TableRow';
// import MarkdownTableCell from '../TableCell';
import styles from '../styles';
import { withTheme } from '../../../theme';
import { themes } from '../../../constants/colors';


const Body = ({
	md, style, numberOfLines, theme
}) => (
	<>
		{md.map((block, index) => {
			switch (block.type) {
				case 'UNORDERED_LIST':
					return <MarkdownList ordered={false} />;
				case 'ORDERED_LIST':
					return <MarkdownList ordered />;
				case 'QUOTE':
					return <MarkdownBlockQuote />;
				case 'PARAGRAPH':
					return (
						<Text style={[styles.text, style, { color: themes[theme].bodyText }]} numberOfLines={numberOfLines} index={index}>
							{block.value?.value}
						</Text>
					);
				case 'CODE':
					return <MarkdownLink />;
				case 'LINK':
					return <MarkdownLink />;
				default:
					return null;
			}
		})}
	</>
);

Body.propTypes = {
	md: PropTypes.array,
	theme: PropTypes.string,
	style: PropTypes.object,
	numberOfLines: PropTypes.number
};

export default withTheme(Body);
