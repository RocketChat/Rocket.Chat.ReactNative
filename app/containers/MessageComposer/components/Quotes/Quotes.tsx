import { FlatList } from 'react-native';

import { useTheme } from '../../../../theme';
import { Quote } from './Quote';

export const Quotes = () => {
	const { colors } = useTheme();
	return <FlatList data={[1, 2]} contentContainerStyle={{ gap: 8 }} renderItem={() => <Quote />} horizontal />;
};
