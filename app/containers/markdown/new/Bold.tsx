import { Bold as BoldProps } from '@rocket.chat/message-parser';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

import sharedStyles from '../../../views/Styles';
import Italic from './Italic';
import Link from './Link';
import Plain from './Plain';
import Strike from './Strike';

interface IBoldProps {
	value: BoldProps['value'];
}

const styles = StyleSheet.create({
	text: {
		...sharedStyles.textBold
	}
});

const Bold = ({ value }: IBoldProps) => (
	<Text style={styles.text}>
		{value.map((block, index) => {
			const key = `${block.type}-${index}`;
			switch (block.type) {
				case 'LINK':
					return <Link key={key} value={block.value} />;
				case 'PLAIN_TEXT':
					return <Plain key={key} value={block.value} />;
				case 'STRIKE':
					return <Strike key={key} value={block.value} />;
				case 'ITALIC':
					return <Italic key={key} value={block.value} />;
				case 'MENTION_CHANNEL':
					return <Plain key={key} value={`#${block.value.value}`} />;
				default:
					return null;
			}
		})}
	</Text>
);

export default Bold;
