import { createDrawerNavigator } from "@react-navigation/drawer";
import { DrawerParamList } from "../../stacks/types";
import { Text } from "react-native";
import Sidebar from '../../views/SidebarView';
import { I18nManager } from 'react-native';
import { View } from "react-native";
const Drawer = createDrawerNavigator();

function Test() {
return <View>
	<Text> good </Text>
	</View>
}
const DrawerNavigator = () => {
	// const { theme } = React.useContext(ThemeContext);
	return (
		<Drawer.Navigator >
			<Drawer.Screen name='test' component={Test}/>
			<Drawer.Screen name='test2' component={Test}/>
			{/* <Drawer.Screen name='ProfileStackNavigator' component={ProfileStackNavigator} />
			<Drawer.Screen name='SettingsStackNavigator' component={SettingsStackNavigator} />
			<Drawer.Screen name='AdminPanelStackNavigator' component={AdminPanelStackNavigator} />
			<Drawer.Screen name='DisplayPrefStackNavigator' component={DisplayPrefStackNavigator} /> */}
		</Drawer.Navigator>
	);
};

export default DrawerNavigator; 