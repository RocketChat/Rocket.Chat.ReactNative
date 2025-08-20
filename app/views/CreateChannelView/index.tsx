import React, { useCallback, useEffect, useLayoutEffect } from 'react';
import { shallowEqual, useDispatch } from 'react-redux';
import { ScrollView, StyleSheet, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

import { useAppSelector, usePermissions } from '../../lib/hooks';
import { sendLoadingEvent } from '../../containers/Loading';
import { createChannelRequest } from '../../actions/createChannel';
import { removeUser as removeUserAction } from '../../actions/selectedUsers';
import KeyboardView from '../../containers/KeyboardView';
import scrollPersistTaps from '../../lib/methods/helpers/scrollPersistTaps';
import I18n from '../../i18n';
import { useTheme } from '../../theme';
import { Review } from '../../lib/methods/helpers/review';
import SafeAreaView from '../../containers/SafeAreaView';
import { ChatsStackParamList } from '../../stacks/types';
import Button from '../../containers/Button';
import { ControlledFormTextInput } from '../../containers/TextInput';
import { RoomSettings } from './RoomSettings';
import { ISelectedUser } from '../../reducers/selectedUsers';
import useA11yErrorAnnouncement from '../../lib/hooks/useA11yErrorAnnouncement';
import SelectedUsersList from '../../containers/SelectedUsersList';

const styles = StyleSheet.create({
	containerTextInput: {
		paddingHorizontal: 16,
		marginTop: 32
	},
	containerStyle: {
		marginBottom: 16
	},
	buttonCreate: {
		marginTop: 32,
		marginHorizontal: 16
	}
});

export interface IFormData {
	channelName: string;
	type: boolean;
	readOnly: boolean;
	encrypted: boolean;
	broadcast: boolean;
}

const CreateChannelView = () => {
	const schema = yup.object().shape({
		channelName: yup.string().trim().required(I18n.t('Channel_name_required'))
	});

	const [createChannelPermission, createPrivateChannelPermission] = usePermissions(['create-c', 'create-p']);

	const { isFetching, useRealName, users, e2eEnabledDefaultPrivateRooms } = useAppSelector(
		state => ({
			isFetching: state.createChannel.isFetching,
			users: state.selectedUsers.users,
			useRealName: state.settings.UI_Use_Real_Name as boolean,
			e2eEnabledDefaultPrivateRooms: state.encryption.enabled && (state.settings.E2E_Enabled_Default_PrivateRooms as boolean)
		}),
		shallowEqual
	);

	const {
		control,
		handleSubmit,
		setValue,
		watch,
		formState: { errors }
	} = useForm<IFormData>({
		defaultValues: {
			channelName: '',
			broadcast: false,
			encrypted: e2eEnabledDefaultPrivateRooms,
			readOnly: false,
			type: createPrivateChannelPermission
		},
		mode: 'onChange',
		resolver: yupResolver(schema)
	});

	const navigation = useNavigation<NativeStackNavigationProp<ChatsStackParamList, 'CreateChannelView'>>();
	const { params } = useRoute<RouteProp<ChatsStackParamList, 'CreateChannelView'>>();
	const isTeam = params?.isTeam || false;
	const teamId = params?.teamId;
	const { colors } = useTheme();
	const dispatch = useDispatch();
	const inputValues = watch();

	useA11yErrorAnnouncement({ errors, inputValues });

	useEffect(() => {
		sendLoadingEvent({ visible: isFetching });
	}, [isFetching]);

	useLayoutEffect(() => {
		navigation.setOptions({
			title: isTeam ? I18n.t('Create_Team') : I18n.t('Create_Channel')
		});
	}, [isTeam, navigation]);

	const removeUser = useCallback(
		(user: ISelectedUser) => {
			dispatch(removeUserAction(user));
		},
		[dispatch]
	);

	const submit = ({ channelName, broadcast, encrypted, readOnly, type }: IFormData) => {
		if (!channelName.trim() || isFetching) {
			return;
		}
		// transform users object into array of usernames
		const usersMapped = users.map(user => user.name);
		// create channel or team
		const data = {
			name: channelName,
			users: usersMapped,
			type,
			readOnly,
			broadcast,
			encrypted,
			isTeam,
			teamId
		};
		dispatch(createChannelRequest(data));
		Review.pushPositiveEvent();
	};

	return (
		<KeyboardView>
			<SafeAreaView style={{ backgroundColor: colors.surfaceRoom }} testID='create-channel-view'>
				<ScrollView {...scrollPersistTaps}>
					<View style={[styles.containerTextInput, { borderColor: colors.strokeLight }]}>
						<ControlledFormTextInput
							required
							label={isTeam ? I18n.t('Team_Name') : I18n.t('Channel_Name')}
							testID='create-channel-name'
							returnKeyType='done'
							containerStyle={styles.containerStyle}
							inputStyle={{ backgroundColor: colors.surfaceTint }}
							name={'channelName'}
							control={control}
							error={errors?.channelName?.message}
						/>
						<RoomSettings
							createChannelPermission={createChannelPermission}
							createPrivateChannelPermission={createPrivateChannelPermission}
							isTeam={isTeam}
							setValue={setValue}
							e2eEnabledDefaultPrivateRooms={e2eEnabledDefaultPrivateRooms}
						/>
					</View>
					{users.length > 0 ? <SelectedUsersList onPress={removeUser} users={users} useRealName={useRealName} /> : null}
					<Button
						title={isTeam ? I18n.t('Create_Team') : I18n.t('Create_Channel')}
						type='primary'
						onPress={handleSubmit(submit)}
						testID='create-channel-submit'
						loading={isFetching}
						style={styles.buttonCreate}
					/>
				</ScrollView>
			</SafeAreaView>
		</KeyboardView>
	);
};

export default CreateChannelView;
