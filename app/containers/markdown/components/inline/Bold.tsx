import React from 'react';
import { StyleSheet, Text, type TextStyle } from 'react-native';
import { type Bold as BoldProps } from '@rocket.chat/message-parser';

import { Italic, Link, Strike } from './index';
import Plain from '../Plain';
import sharedStyles from '../../../../views/Styles';

interface IBoldProps {
	value: BoldProps['value'];
	style?: TextStyle;
}

const styles = StyleSheet.create({
	text: {
		...sharedStyles.textBold
	}
});

const Bold = ({ value, style }: IBoldProps) => (
	<Text style={[styles.text, style]}>
		{value.map(block => {
			switch (block.type) {
				case 'LINK':
					return <Link value={block.value} style={style} />;
				case 'PLAIN_TEXT':
					return <Plain value={block.value} style={style}/>;
				case 'STRIKE':
					return <Strike value={block.value} style={style}/>;
				case 'ITALIC':
					return <Italic value={block.value} style={style}/>;
				case 'MENTION_CHANNEL':
					return <Plain value={`#${block.value.value}`} style={style}/>;
				default:
					return null;
			}
		})}
	</Text>
);

export default Bold;
