import React from 'react';
import PropTypes from 'prop-types';
import {
	StyleSheet,
	Text,
	View
} from 'react-native';

import { themes } from '../../constants/colors';

const style = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'flex-start'
	},
	bullet: {
		alignItems: 'flex-end',
		marginRight: 5
	},
	contents: {
		flex: 1
	}
});

const ListItem = React.memo(({
	children, level, bulletWidth, continue: _continue, ordered, index, theme
}) => {
	let bullet;
	if (_continue) {
		bullet = '';
	} else if (ordered) {
		bullet = `${ index }.`;
	} else if (level % 2 === 0) {
		bullet = '◦';
	} else {
		bullet = '•';
	}

	return (
		<View style={style.container}>
			<View style={[{ width: bulletWidth }, style.bullet]}>
				<Text style={{ color: themes[theme].bodyText }}>
					{bullet}
				</Text>
			</View>
			<View style={style.contents}>
				{children}
			</View>
		</View>
	);
});

ListItem.propTypes = {
	children: PropTypes.node,
	bulletWidth: PropTypes.number,
	level: PropTypes.number,
	ordered: PropTypes.bool,
	continue: PropTypes.bool,
	theme: PropTypes.string,
	index: PropTypes.number
};

export default ListItem;
