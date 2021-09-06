import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

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

interface IListItem {
	children: JSX.Element;
	bulletWidth: number;
	level: number;
	ordered: boolean;
	continue: boolean;
	theme: string;
	index: number;
}

const ListItem = React.memo(({ children, level, bulletWidth, continue: _continue, ordered, index, theme }: IListItem) => {
	let bullet;
	if (_continue) {
		bullet = '';
	} else if (ordered) {
		bullet = `${index}.`;
	} else if (level % 2 === 0) {
		bullet = '◦';
	} else {
		bullet = '•';
	}

	return (
		<View style={style.container}>
			<View style={[{ width: bulletWidth }, style.bullet]}>
				<Text style={{ color: themes[theme].bodyText }}>{bullet}</Text>
			</View>
			<View style={style.contents}>{children}</View>
		</View>
	);
});

export default ListItem;
