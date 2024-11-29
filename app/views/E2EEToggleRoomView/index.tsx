import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useLayoutEffect } from 'react';

import * as List from '../../containers/List';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import Switch from '../../containers/Switch';
import I18n from '../../i18n';
import { toggleRoomE2EE } from '../../lib/encryption/helpers/toggleRoomE2EE';
import { ChatsStackParamList } from '../../stacks/types';
import { useTheme } from '../../theme';
import { resetRoomKey } from './resetRoomKey';
import { useEncrypted } from './useEncrypted';
import { useHasE2EEWarning } from '../../lib/encryption/helpers/hooks';

const E2EEToggleRoomView = ({ navigation }: { navigation: any }) => {
	const route = useRoute<RouteProp<ChatsStackParamList, 'E2EEToggleRoomView'>>();
	const { rid } = route.params;
	const { colors } = useTheme();
	const { encrypted, E2EKey } = useEncrypted(rid);
	const hasE2EEWarning = useHasE2EEWarning(encrypted, E2EKey);

	useLayoutEffect(() => {
		navigation?.setOptions({
			title: I18n.t('E2E_Encryption')
		});
	}, []);

	return (
		<SafeAreaView>
			<StatusBar />
			<List.Container>
				<List.Section>
					<List.Separator />
					<List.Item
						title='Encrypt {room-type}'
						translateTitle={false}
						right={() => <Switch value={encrypted} onValueChange={() => toggleRoomE2EE(rid)} />}
					/>
					<List.Separator />
					<List.Info info='Ensure only intended recipients can access messages and files in {room-name}.' translateInfo={false} />
				</List.Section>

				{hasE2EEWarning ? (
					<List.Section>
						<List.Separator />
						<List.Item
							title='Reset encryption keys'
							translateTitle={false}
							color={colors.fontDanger}
							onPress={() => resetRoomKey(rid)}
						/>
						<List.Separator />
						<List.Info
							info='Resetting E2EE keys is only recommend if no {room-type} member has a valid key to regain access to the previously encrypted content.'
							translateInfo={false}
						/>
					</List.Section>
				) : null}
			</List.Container>
		</SafeAreaView>
	);
};
export default E2EEToggleRoomView;
