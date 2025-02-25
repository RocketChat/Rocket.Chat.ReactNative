import React, { useCallback, useEffect, useLayoutEffect } from 'react';
import { shallowEqual, useDispatch } from 'react-redux';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm } from 'react-hook-form';

import { useAppSelector, usePermissions } from '../../lib/hooks';
import { sendLoadingEvent } from '../../containers/Loading';
import { createChannelRequest } from '../../actions/createChannel';
import { removeUser as removeUserAction } from '../../actions/selectedUsers';
import KeyboardView from '../../containers/KeyboardView';
import scrollPersistTaps from '../../lib/methods/helpers/scrollPersistTaps';
import I18n from '../../i18n';
import StatusBar from '../../containers/StatusBar';
import { useTheme } from '../../theme';
import { Review } from '../../lib/methods/helpers/review';
import SafeAreaView from '../../containers/SafeAreaView';
import sharedStyles from '../Styles';
import { ChatsStackParamList } from '../../stacks/types';
import Button from '../../containers/Button';
import { ControlledFormTextInput } from '../../containers/TextInput';
import Chip from '../../containers/Chip';
import { RoomSettings } from './RoomSettings';
import { ISelectedUser } from '../../reducers/selectedUsers';

const styles = StyleSheet.create({
	container: {
		flex: 1
	},
	containerTextInput: {
		paddingHorizontal: 16,
		marginTop: 32
	},
	containerStyle: {
		marginBottom: 16
	},
	list: {
		width: '100%'
	},
	invitedHeader: {
		marginVertical: 12,
		marginHorizontal: 16,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center'
	},
	invitedCount: {
		fontSize: 12,
		...sharedStyles.textRegular
	},
	invitedList: {
		paddingHorizontal: 16
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
		formState: { isDirty },
		setValue
	} = useForm<IFormData>({
		defaultValues: {
			channelName: '',
			broadcast: false,
			encrypted: e2eEnabledDefaultPrivateRooms,
			readOnly: false,
			type: createPrivateChannelPermission
		}
	});

	const navigation = useNavigation<NativeStackNavigationProp<ChatsStackParamList, 'CreateChannelView'>>();
	const { params } = useRoute<RouteProp<ChatsStackParamList, 'CreateChannelView'>>();
	const isTeam = params?.isTeam || false;
	const teamId = params?.teamId;
	const { colors } = useTheme();
	const dispatch = useDispatch();

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
		<KeyboardView
			style={{ backgroundColor: colors.surfaceRoom }}
			contentContainerStyle={[sharedStyles.container, styles.container]}
			keyboardVerticalOffset={128}>
			<StatusBar />
			<SafeAreaView style={{ backgroundColor: colors.surfaceRoom }} testID='create-channel-view'>
				<ScrollView {...scrollPersistTaps}>
					<View style={[styles.containerTextInput, { borderColor: colors.strokeLight }]}>
						<ControlledFormTextInput
							required
							label={isTeam ? I18n.t('Team_Name') : I18n.t('Channel_Name')}
							testID='create-channel-name'
							returnKeyType='done'
							containerStyle={styles.containerStyle}
							name={'channelName'}
							control={control}
						/>
						<RoomSettings
							createChannelPermission={createChannelPermission}
							createPrivateChannelPermission={createPrivateChannelPermission}
							isTeam={isTeam}
							setValue={setValue}
							e2eEnabledDefaultPrivateRooms={e2eEnabledDefaultPrivateRooms}
						/>
					</View>
					{users.length > 0 ? (
						<>
							<View style={styles.invitedHeader}>
								<Text style={[styles.invitedCount, { color: colors.fontSecondaryInfo }]}>
									{I18n.t('N_Selected_members', { n: users.length })}
								</Text>
							</View>
							<FlatList
								data={users}
								extraData={users}
								keyExtractor={item => item._id}
								style={[
									styles.list,
									{
										backgroundColor: colors.surfaceRoom,
										borderColor: colors.strokeLight
									}
								]}
								contentContainerStyle={styles.invitedList}
								renderItem={({ item }) => {
									const name = useRealName && item.fname ? item.fname : item.name;
									const username = item.name;

									return (
										<Chip
											text={name}
											avatar={username}
											onPress={() => removeUser(item)}
											testID={`create-channel-view-item-${item.name}`}
										/>
									);
								}}
								keyboardShouldPersistTaps='always'
								horizontal
							/>
						</>
					) : null}
					<Button
						title={isTeam ? I18n.t('Create_Team') : I18n.t('Create_Channel')}
						type='primary'
						onPress={handleSubmit(submit)}
						disabled={!isDirty}
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
