import { View } from 'react-native';

import { themes } from '~/lib/constants/colors';
import { useTheme } from '~/theme';
import styles from '../styles';

const HorizontalRule = () => {
	const { theme } = useTheme();
	return <View style={[styles.horizontalRule, { backgroundColor: themes[theme].strokeLight }]} />;
};

export default HorizontalRule;
