import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { type Bold as BoldProps } from '@rocket.chat/message-parser';

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

const Bold = ({ value }: IBoldProps) => {
	const getBlockValueString = (v: any): string => {
		if (!v) return 'null';
		if (typeof v === 'string') return v;
		if (typeof v?.value === 'string') return v.value;
		return JSON.stringify(v).slice(0, 20);
	};
	return (
		<Text style={styles.text}>
			{value.map((block, index) => {
				// key example: LINK-https:rocket.chat/link/123...-3 <upto 20 chars only>
				const key = `${block.type}-${getBlockValueString(block.value)}-${index}`;
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
};
export default Bold;
