import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native-gesture-handler';

import I18n from '../../i18n';
import SafeAreaView from '../../containers/SafeAreaView';
import * as List from '../../containers/List';
import { type ProfileStackParamList } from '../../stacks/types';
import { FormTextInput } from '../../containers/TextInput';
import Chip from '../../containers/Chip';
import userPreferences, { useUserPreferences } from '../../lib/methods/userPreferences';
import { CURRENT_SERVER, WATCHOS_QUICKREPLIES } from '../../lib/constants/keys';
import { syncWatchOSQuickReplies } from '../../lib/methods/WatchOSQuickReplies/syncReplies';
import { checkWatch } from '../../lib/methods/WatchOSQuickReplies/getWatchStatus';
import { useAppSelector } from '../../lib/hooks/useAppSelector';

interface IUserWatchOSQuickRepliesViewProps {
	navigation: NativeStackNavigationProp<ProfileStackParamList, 'UserWatchOSQuickRepliesView'>;
}

const UserWatchOSQuickRepliesView = ({ navigation }: IUserWatchOSQuickRepliesViewProps): JSX.Element => {
	const currentServer = userPreferences.getString(CURRENT_SERVER);
	const [quickReplies, setQuickReplies] = useUserPreferences<string[]>(`${currentServer}-${WATCHOS_QUICKREPLIES}`, []);
	const [input, setInput] = useState<string>('');
	const appleWatchReplies = useAppSelector(state => state.settings.Apple_Watch_Quick_Actions);
	const isFirstLogin = useAppSelector(state => state.app.isFirstServerLogin);

	useEffect(() => {
		navigation.setOptions({
			title: I18n.t('WatchOS_Quick_Replies')
		});
	}, [navigation]);

	useEffect(() => {
		const load = () => {
			const status = checkWatch();
			console.log(status);
			syncWatchOSQuickReplies();
		};
		load();
	}, []);

	const removeQuickReply = (reply: string) => {
		const newReplies = quickReplies?.filter(quickreply => quickreply !== reply);
		setQuickReplies(newReplies);
		syncWatchOSQuickReplies();
	};

	const addQuickReply = () => {
		const value = input.trim();
		if (!value) return;
		if (!quickReplies?.includes(input.trim())) setQuickReplies([...(quickReplies ?? []), value]);
		setInput('');
		syncWatchOSQuickReplies();
	};

	useEffect(() => {
		if (appleWatchReplies && isFirstLogin && typeof appleWatchReplies === 'string') {
			const replies = appleWatchReplies.split(',');
			setQuickReplies(replies);
			syncWatchOSQuickReplies();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [appleWatchReplies, isFirstLogin]);

	return (
		<SafeAreaView testID='preferences-view'>
			<List.Container>
				<List.Section title='WatchOS_Quick_Replies'>
					<>
						{quickReplies && quickReplies.length !== 0 && (
							<ScrollView horizontal style={{ marginVertical: 8, paddingHorizontal: 4 }} showsHorizontalScrollIndicator={false}>
								{quickReplies.map((reply, index) => (
									<Chip key={index} text={reply} onPress={() => removeQuickReply(reply)} />
								))}
							</ScrollView>
						)}
					</>
					<List.Separator />
					<FormTextInput
						value={input}
						onChangeText={text => setInput(text)}
						placeholder={I18n.t('Add_Quick_Reply')}
						onSubmitEditing={addQuickReply}
						maxLength={30}
					/>
					<List.Separator />
					<List.Info info='WatchOS_Quick_Replies_Description' />
				</List.Section>
			</List.Container>
		</SafeAreaView>
	);
};

export default UserWatchOSQuickRepliesView;
