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

type TBoldWithID<T> = T & { _id: string };

const Bold = ({ value }: IBoldProps) => (
	<Text style={styles.text}>
		{value.map(b => {
			const block = b as TBoldWithID<typeof b>;
			switch (block.type) {
				case 'LINK':
					return <Link key={block._id} value={block.value} />;
				case 'PLAIN_TEXT':
					return <Plain key={block._id} value={block.value} />;
				case 'STRIKE':
					return <Strike key={block._id} value={block.value} />;
				case 'ITALIC':
					return <Italic key={block._id} value={block.value} />;
				case 'MENTION_CHANNEL':
					return <Plain key={block._id} value={`#${block.value.value}`} />;
				default:
					return null;
			}
		})}
	</Text>
);
export default Bold;
