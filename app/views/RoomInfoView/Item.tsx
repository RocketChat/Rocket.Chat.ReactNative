import React from 'react';
import { View } from 'react-native';

import Markdown from '../../containers/markdown';
import styles from './styles';
import { ItemLabel } from './components/ItemLabel';

interface IItem {
	label?: string;
	content?: string;
	testID?: string;
}

const Item = ({ label, content, testID }: IItem): React.ReactElement | null => {
	if (!content) return null;

	return (
		<View style={styles.item} testID={testID}>
			{label ? <ItemLabel label={label} testID={testID} /> : null}
			<Markdown msg={content} />
		</View>
	);
};

export default Item;
