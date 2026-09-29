import { memo } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-plain-text';
import { Row } from 'react-native-easy-grid';

import styles from './styles';
import { themes } from '~/lib/constants/colors';
import { useTheme } from '~/theme';

interface IPasscodeSubtitle {
	text: string;
}

const Subtitle = memo(({ text }: IPasscodeSubtitle) => {
	const { theme } = useTheme();

	return (
		<Row style={styles.row}>
			<View style={styles.subtitleView}>
				<Text style={[styles.textSubtitle, { color: themes[theme].fontDanger }]}>{text}</Text>
			</View>
		</Row>
	);
});

export default Subtitle;
