import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

import I18n from '../../i18n';
import SafeAreaView from '../../containers/SafeAreaView';
import * as List from '../../containers/List';
import { type ProfileStackParamList } from '../../stacks/types';
import { FormTextInput } from '../../containers/TextInput';
import Chip from '../../containers/Chip';
import userPreferences, { useUserPreferences } from '../../lib/methods/userPreferences';
import { CURRENT_SERVER, WATCHOS_QUICKREPLIES } from '../../lib/constants/keys';
import { syncWatchOSQuickReplies } from '../../lib/methods/WatchOSQuickReplies/syncReplies';
import log from '../../lib/methods/helpers/log';

interface IUserWatchOSQuickRepliesViewProps {
	navigation: NativeStackNavigationProp<ProfileStackParamList, 'UserWatchOSQuickRepliesView'>;
}

const UserWatchOSQuickRepliesView = ({ navigation }: IUserWatchOSQuickRepliesViewProps): JSX.Element => {
	const currentServer = userPreferences.getString(CURRENT_SERVER);
	const [quickReplies, setQuickReplies] = useUserPreferences<string[]>(`${currentServer}-${WATCHOS_QUICKREPLIES}`, []);
	const [input, setInput] = useState<string>('');

	useEffect(() => {
		navigation.setOptions({
			title: I18n.t('WatchOS_Quick_Replies')
		});
	}, [navigation]);

	const removeQuickReply = (reply: string) => {
		if (!currentServer) {
			log(new Error('Error: cannot set quick replies, current server is undefined'));
			return;
		}
		const newReplies = quickReplies?.filter(quickreply => quickreply !== reply);
		setQuickReplies(newReplies);
		syncWatchOSQuickReplies();
	};

	const addQuickReply = () => {
		if (!currentServer) {
			console.error('Error: cannot set quick replies, current server is undefined');
			return;
		}
		const value = input.trim();
		if (!value) return;
		if (!quickReplies?.includes(value)) setQuickReplies([...(quickReplies ?? []), value]);
		setInput('');
		syncWatchOSQuickReplies();
	};

	return (
		<SafeAreaView testID='watchos-preferences-view'>
			<List.Container>
				<List.Section title='WatchOS_Quick_Replies'>
					<>
						{quickReplies && quickReplies.length !== 0 && (
							<ScrollView horizontal style={styles.chipContainer} showsHorizontalScrollIndicator={false}>
								{quickReplies.map(reply => (
									<Chip key={reply} text={reply} onPress={() => removeQuickReply(reply)} />
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

const styles = StyleSheet.create({
	chipContainer: { marginVertical: 8, paddingHorizontal: 4 }
});
export default UserWatchOSQuickRepliesView;
