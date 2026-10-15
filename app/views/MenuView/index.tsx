import { ScrollView, View } from 'react-native';

import scrollPersistTaps from '~/lib/methods/helpers/scrollPersistTaps';
import styles from './styles';
import MenuContent from './components/MenuContent';

const MenuView = () => (
	<View testID='sidebar-view' style={styles.container}>
		<ScrollView style={styles.container} {...scrollPersistTaps}>
			<MenuContent />
		</ScrollView>
	</View>
);

export default MenuView;
