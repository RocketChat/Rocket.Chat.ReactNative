import React from 'react';
import { StyleSheet, Text } from 'react-native';
import type { Bold as BoldProps } from '@rocket.chat/message-parser';

import { Italic, Link, Strike } from './index';
import Plain from '../Plain';
import sharedStyles from '../../../../views/Styles';

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
			switch (block.type) {
				case 'LINK':
					return <Link key={index} value={block.value} />;
				case 'PLAIN_TEXT':
					return <Plain key={index} value={block.value} />;
				case 'STRIKE':
					return <Strike key={index} value={block.value} />;
				case 'ITALIC':
					return <Italic key={index} value={block.value} />;
				case 'MENTION_CHANNEL':
					return <Plain key={index} value={`#${block.value.value}`} />;
				default:
					return null;
			}
		})}
	</Text>
);

export default Bold;
