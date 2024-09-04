import { I18nManager, SafeAreaView } from "react-native";
import { useLayoutEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import * as List from '../containers/List';
import StatusBar from "../containers/StatusBar";
import { SettingsStackParamList } from "../stacks/types";
import i18n from "../i18n";

const GetHelpView = () => {

	const navigation = useNavigation<StackNavigationProp<SettingsStackParamList, 'GetHelpView'>>();

	useLayoutEffect(() => {
		navigation.setOptions({
			title: i18n.t('Help')
		});
	}, [navigation]);

	return (
		<SafeAreaView>
			<StatusBar />
			<List.Container>
				<List.Section>
					<List.Separator/>
					<List.Item
						title='Rocket_Chat_Documentation'
						right={() => <List.Icon name='new-window' style={I18nManager.isRTL ? { transform: [{ rotate: '180deg' }] } : null}/>}
						onPress={() => console.log('GetHelpView')}
					/>
					<List.Separator/>
					<List.Item
						title='Accessibility_statement'
						right={() => <List.Icon name='new-window' style={I18nManager.isRTL ? { transform: [{ rotate: '180deg' }] } : null}/>}
						onPress={() => console.log('GetHelpView')}
					/>
					<List.Separator/>
					<List.Item
						title='Glossary_of_simplified_terms'
						right={() => <List.Icon name='new-window' style={I18nManager.isRTL ? { transform: [{ rotate: '180deg' }] } : null}/>}
						onPress={() => console.log('GetHelpView')}
					/>
					<List.Separator/>
				</List.Section>
			</List.Container>
		</SafeAreaView>
	)
};

export default GetHelpView;