import { View } from 'react-native';

import Title from './Title';
import Subtitle from './Subtitle';

export const Content = () => (
	<View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center' }}>
		<Title />
		<Subtitle />
	</View>
);
