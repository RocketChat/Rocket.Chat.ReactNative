import React from 'react';
import { Text } from 'react-native';

import { useTheme } from '../../theme';
import Styles from '../../views/Styles';

export default function HeaderTitle({ title }: { title: string }): React.ReactElement {
	const { colors } = useTheme();
	return (
		<Text
			numberOfLines={1}
			style={{
				fontSize: 18,
				color: colors.headerTitleColor,
				...Styles.textSemibold
			}}
		>
			{title}
		</Text>
	);
}
