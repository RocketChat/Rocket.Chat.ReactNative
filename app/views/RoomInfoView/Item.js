import React from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';

import styles from './styles';
import Markdown from '../../containers/markdown';
import { themes } from '../../constants/colors';

const Item = ({ label, content, theme }) => (
	content ? (
		<View style={styles.item}>
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
	theme: PropTypes.string
};

export default Item;
