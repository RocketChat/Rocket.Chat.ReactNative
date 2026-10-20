import { View } from 'react-native';

import ListContainer from '~/containers/List/components/ListContainer.ios';
import styles from './styles';
import MenuSections from './MenuSections.ios';

const MenuView = () => (
	<View testID='sidebar-view' style={styles.container}>
		<ListContainer>
			<MenuSections />
		</ListContainer>
	</View>
);

export default MenuView;
