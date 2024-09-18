import { I18nManager, SafeAreaView } from 'react-native';
import { useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import * as List from '../containers/List';
import StatusBar from '../containers/StatusBar';
import { SettingsStackParamList } from '../stacks/types';
import i18n from '../i18n';
import openLink from '../lib/methods/helpers/openLink';
import { useTheme } from '../theme';

const DOCS_LINK = 'https://docs.rocket.chat/';
const ACCESSIBILITY_LINK = 'https://go.rocket.chat/i/accessibility';
const GLOSSARY_LINK = 'https://go.rocket.chat/i/glossary';

const GetHelpView = () => {
	const navigation = useNavigation<StackNavigationProp<SettingsStackParamList, 'GetHelpView'>>();
	const { theme } = useTheme();

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
					<List.Separator />
					<List.Item
						title='Rocket_Chat_Documentation'
						right={() => <List.Icon name='new-window' style={I18nManager.isRTL ? { transform: [{ rotate: '180deg' }] } : null} />}
						onPress={() => openLink(DOCS_LINK, theme)}
						testID='settings-view-get-help-documentation'
					/>
					<List.Separator />
					<List.Item
						title='Accessibility_statement'
						right={() => <List.Icon name='new-window' style={I18nManager.isRTL ? { transform: [{ rotate: '180deg' }] } : null} />}
						onPress={() => openLink(ACCESSIBILITY_LINK, theme)}
						testID='settings-view-get-help-accessibility-statement'
					/>
					<List.Separator />
					<List.Item
						title='Glossary_of_simplified_terms'
						right={() => <List.Icon name='new-window' style={I18nManager.isRTL ? { transform: [{ rotate: '180deg' }] } : null} />}
						onPress={() => openLink(GLOSSARY_LINK, theme)}
						testID='settings-view-get-help-glossary'
					/>
					<List.Separator />
				</List.Section>
			</List.Container>
		</SafeAreaView>
	);
};

export default GetHelpView;
