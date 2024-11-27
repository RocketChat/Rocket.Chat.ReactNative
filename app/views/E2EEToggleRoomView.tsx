import React, { useLayoutEffect } from 'react';

import * as List from '../containers/List';
import SafeAreaView from '../containers/SafeAreaView';
import StatusBar from '../containers/StatusBar';
import Switch from '../containers/Switch';
import I18n from '../i18n';
import { useTheme } from '../theme';

const E2EEToggleRoomView = ({ navigation }: { navigation: any }) => {
	const { colors } = useTheme();
	const encrypted = true;

	useLayoutEffect(() => {
		navigation?.setOptions({
			title: I18n.t('E2E_Encryption')
		});
	});

	return (
		<SafeAreaView testID='e2ee-toggle-room-view'>
			<StatusBar />
			<List.Container testID='notification-preference-view-list'>
				<List.Section>
					<List.Separator />
					<List.Item title='Encrypt {room-type}' translateTitle={false} right={() => <Switch value={encrypted} />} />
					<List.Separator />
					<List.Info info='Ensure only intended recipients can access messages and files in {room-name}.' translateInfo={false} />
				</List.Section>

				<List.Section>
					<List.Separator />
					<List.Item title='Reset encryption keys' translateTitle={false} color={colors.fontDanger} />
					<List.Separator />
					<List.Info
						info='Resetting E2EE keys is only recommend if no {room-type} member has a valid key to regain access to the previously encrypted content.'
						translateInfo={false}
					/>
				</List.Section>
			</List.Container>
		</SafeAreaView>
	);
};
export default E2EEToggleRoomView;
