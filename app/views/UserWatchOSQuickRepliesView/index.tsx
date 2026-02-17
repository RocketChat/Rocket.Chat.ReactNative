import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native-gesture-handler';

import I18n from '../../i18n';
import SafeAreaView from '../../containers/SafeAreaView';
import * as List from '../../containers/List';
import { type ProfileStackParamList } from '../../stacks/types';
import { FormTextInput } from '../../containers/TextInput';
import Chip from '../../containers/Chip';
import { useUserPreferences } from '../../lib/methods/userPreferences';
import { WATCHOS_QUICKREPLIES } from '../../lib/constants/keys';
import { syncWatchOSQuickReplies } from '../../lib/methods/WatchOSQuickReplies/syncReplies';
import { checkWatch } from '../../lib/methods/WatchOSQuickReplies/getWatchStatus';

interface IUserPreferencesViewProps {
	navigation: NativeStackNavigationProp<ProfileStackParamList, 'UserPreferencesView'>;
}

const UserPreferencesView = ({ navigation }: IUserPreferencesViewProps): JSX.Element => {
	const [quickReplies, setQuickReplies] = useUserPreferences<string[]>(WATCHOS_QUICKREPLIES, []);
	const [input, setInput] = useState<string>('');

	useEffect(() => {
		navigation.setOptions({
			title: I18n.t('Preferences')
		});
	}, [navigation]);

	useEffect(() => {
		const load = async () => {
			const status = await checkWatch();
			console.log(status);
			const result = await syncWatchOSQuickReplies(quickreplies ?? []);
			console.log(result);
		};
		load();
	}, [quickreplies]);

	const removeQuickReply = (reply: string) => {
		const newReplies = quickreplies?.filter(quickreply => quickreply !== reply);
		setQuickreplies(newReplies);
	};

	const addQuickReply = () => {
		const value = input.trim();
		if (!value) return;
		if (!quickreplies?.includes(input.trim())) setQuickreplies([...(quickreplies ?? []), value]);
		setInput('');
	};

	return (
		<SafeAreaView testID='preferences-view'>
			<List.Container>
				<List.Section title='WatchOS_Quick_Replies'>
					<>
						{quickreplies && quickreplies.length !== 0 && (
							<ScrollView horizontal style={{ marginVertical: 8, paddingHorizontal: 4 }}>
								{quickreplies.map((reply, index) => (
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
					/>
					<List.Separator />
					<List.Info info='WatchOS_Quick_Replies_Description' />
				</List.Section>
			</List.Container>
		</SafeAreaView>
	);
};

export default UserPreferencesView;
