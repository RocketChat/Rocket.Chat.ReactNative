import { useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import SafeAreaView from '../containers/SafeAreaView';
import * as List from '../containers/List';
import StatusBar from '../containers/StatusBar';
import NewWindowIcon from '../containers/NewWindowIcon';
import { SettingsStackParamList } from '../stacks/types';
import i18n from '../i18n';
import openLink from '../lib/methods/helpers/openLink';
import { useTheme } from '../theme';

const DOCS_LINK = 'https://docs.rocket.chat/';
const ACCESSIBILITY_LINK = 'https://go.rocket.chat/i/accessibility';
const GLOSSARY_LINK = 'https://go.rocket.chat/i/glossary';

const GetHelpView = () => {
	const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList, 'GetHelpView'>>();
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
						accessibilityRole='link'
						right={() => <NewWindowIcon />}
						onPress={() => openLink(DOCS_LINK, theme)}
						testID='settings-view-get-help-documentation'
					/>
					<List.Separator />
					<List.Item
						title='Accessibility_statement'
						accessibilityRole='link'
						right={() => <NewWindowIcon />}
						onPress={() => openLink(ACCESSIBILITY_LINK, theme)}
						testID='settings-view-get-help-accessibility-statement'
					/>
					<List.Separator />
					<List.Item
						title='Glossary_of_simplified_terms'
						accessibilityRole='link'
						right={() => <NewWindowIcon />}
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
