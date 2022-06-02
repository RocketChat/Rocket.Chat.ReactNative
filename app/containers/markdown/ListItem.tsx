import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../theme';

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
	children: React.ReactElement | null;
	bulletWidth: number;
	level: number;
	ordered: boolean;
	continue: boolean;
	index: number;
	testID: string;
}

const ListItem = React.memo(({ children, level, bulletWidth, continue: _continue, ordered, index, testID }: IListItem) => {
	const { colors } = useTheme();

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
		<View style={style.container} testID={`${testID}-list`}>
			<View style={[{ width: bulletWidth }, style.bullet]}>
				<Text style={{ color: colors.bodyText }}>{bullet}</Text>
			</View>
			<View style={style.contents}>{children}</View>
		</View>
	);
});

export default ListItem;
