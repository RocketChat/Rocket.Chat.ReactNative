import { StyleSheet, Text } from 'react-native';
import { type Bold as BoldProps } from '@rocket.chat/message-parser';

import { Italic, Link, Strike } from './index';
import Plain from '../Plain';
import { Hashtag, AtMention } from '../mentions';
import sharedStyles from '../../../../views/Styles';

interface IBoldProps {
	value: BoldProps['value'];
}

const styles = StyleSheet.create({
	text: {
		...sharedStyles.textBold
	}
});

const Bold = ({ value }: IBoldProps) => {
	'use memo';

	return (
		<Text style={styles.text}>
			{value.map(block => {
				switch (block.type) {
					case 'LINK':
						return <Link value={block.value} />;
					case 'PLAIN_TEXT':
						return <Plain value={block.value} />;
					case 'STRIKE':
						return <Strike value={block.value} />;
					case 'ITALIC':
						return <Italic value={block.value} />;
					case 'MENTION_CHANNEL':
						return <Hashtag hashtag={block.value.value} />;
					case 'MENTION_USER':
						return <AtMention mention={block.value.value} />;
					default:
						return null;
				}
			})}
		</Text>
	);
};

export default Bold;
