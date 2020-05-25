import React from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';

import styles from './styles';
import Markdown from '../../containers/markdown';
import { themes } from '../../constants/colors';

const Item = ({
	label, content, theme, testID
}) => (
	content ? (
		<View style={styles.item} testID={testID}>
			<Text accessibilityLabel={label} style={[styles.itemLabel, { color: themes[theme].titleText }]}>{label}</Text>
			<Markdown
				style={[styles.itemContent, { color: themes[theme].auxiliaryText }]}
				msg={content}
				theme={theme}
			/>
		</View>
	) : null
);
Item.propTypes = {
	label: PropTypes.string,
	content: PropTypes.string,
	theme: PropTypes.string,
	testID: PropTypes.string
};

export default Item;
