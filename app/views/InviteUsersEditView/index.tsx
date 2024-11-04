import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useLayoutEffect } from 'react';
import { View } from 'react-native';
import { useDispatch } from 'react-redux';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { inviteLinksCreate } from '../../actions/inviteLinks';
import Button from '../../containers/Button';
import * as List from '../../containers/List';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import I18n from '../../i18n';
import { ChatsStackParamList } from '../../stacks/types';
import { events, logEvent } from '../../lib/methods/helpers/log';
import styles from './styles';
import Picker from './Picker';

const InviteUsersEditView = () => {
	const navigation = useNavigation<NativeStackNavigationProp<ChatsStackParamList, 'InviteUsersEditView'>>();
	const { rid } = useRoute<RouteProp<ChatsStackParamList, 'InviteUsersEditView'>>().params;
	const dispatch = useDispatch();

	useLayoutEffect(() => {
		navigation.setOptions({
			title: I18n.t('Invite_users')
		});
	}, [navigation]);

	const createInviteLink = () => {
		logEvent(events.IU_EDIT_CREATE_LINK);
		dispatch(inviteLinksCreate(rid));
		navigation.pop();
	};

	return (
		<SafeAreaView>
			<List.Container>
				<StatusBar />
				<List.Section>
					<List.Separator />
					<List.Item title='Expiration_Days' right={() => <Picker param={'days'} first={'Never'} />} />
					<List.Separator />
					<List.Item title='Max_number_of_uses' right={() => <Picker param='maxUses' first='No_limit' />} />
					<List.Separator />
				</List.Section>
				<View style={styles.innerContainer}>
					<Button title={I18n.t('Generate_New_Link')} type='primary' onPress={createInviteLink} />
				</View>
			</List.Container>
		</SafeAreaView>
	);
};

export default InviteUsersEditView;
