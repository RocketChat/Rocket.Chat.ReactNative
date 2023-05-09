import React from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';

import * as List from '../../containers/List';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import { SettingsStackParamList } from '../../stacks/types';

const MediaAutoDownload = () => {
	const navigation = useNavigation<StackNavigationProp<SettingsStackParamList, 'MediaAutoDownloadView'>>();

	return (
		<SafeAreaView testID='security-privacy-view'>
			<StatusBar />
			<List.Container testID='security-privacy-view-list'>
				<List.Section>
					<List.Separator />
					<List.Item
						title='E2E_Encryption'
						showActionIndicator
						onPress={() => {}}
						// onPress={() => navigateToScreen('E2EEncryptionSecurityView')}
						testID='security-privacy-view-e2e-encryption'
					/>
					<List.Separator />
					<List.Item title='Screen_lock' showActionIndicator onPress={() => {}} testID='security-privacy-view-screen-lock' />
					<List.Separator />
				</List.Section>
			</List.Container>
		</SafeAreaView>
	);
};

export default MediaAutoDownload;
