import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import I18n from '~/i18n';
import SafeAreaView from '~/containers/SafeAreaView';
import { type ProfileStackParamList } from '~/stacks/types';
import { FormTextInput } from '~/containers/TextInput';
import Chip from '~/containers/Chip';
import userPreferences, { useUserPreferences } from '~/lib/methods/userPreferences';
import { CURRENT_SERVER, getWatchOSQuickRepliesKey } from '~/lib/constants/keys';
import { QUICK_REPLIES_MAX, QUICK_REPLY_MAX_LENGTH } from '~/lib/methods/watchOSQuickReplies/constants';
import { syncWatchOSQuickReplies } from '~/lib/methods/watchOSQuickReplies/syncReplies';
import log from '~/lib/methods/helpers/log';
import sharedStyles from '~/views/Styles';
import { useTheme } from '~/theme';

interface IUserWatchOSQuickRepliesViewProps {
	navigation: NativeStackNavigationProp<ProfileStackParamList, 'UserWatchOSQuickRepliesView'>;
}

const UserWatchOSQuickRepliesView = ({ navigation }: IUserWatchOSQuickRepliesViewProps): JSX.Element => {
	const currentServer = userPreferences.getString(CURRENT_SERVER);
	const [quickReplies = [], setQuickReplies] = useUserPreferences<string[]>(getWatchOSQuickRepliesKey(currentServer ?? ''), []);
	const [input, setInput] = useState<string>('');
	const { colors } = useTheme();

	useEffect(() => {
		navigation.setOptions({
			title: I18n.t('Apple_Watch_Quick_Replies')
		});
	}, [navigation]);

	const removeQuickReply = (reply: string) => {
		if (!currentServer) {
			log(new Error('Error: cannot set quick replies, current server is undefined'));
			return;
		}
		const newReplies = quickReplies.filter(quickreply => quickreply !== reply);
		setQuickReplies(newReplies);
		syncWatchOSQuickReplies();
	};

	const addQuickReply = () => {
		if (!currentServer) {
			log(new Error('Error: cannot set quick replies, current server is undefined'));
			return;
		}
		const value = input.trim();
		if (!value || quickReplies.length >= QUICK_REPLIES_MAX) return;
		if (!quickReplies.includes(value)) setQuickReplies([...quickReplies, value]);
		setInput('');
		syncWatchOSQuickReplies();
	};

	return (
		<SafeAreaView testID='watchos-quick-replies-view'>
			<ScrollView
				contentContainerStyle={[sharedStyles.containerScrollView, styles.content, { backgroundColor: colors.surfaceTint }]}
				keyboardShouldPersistTaps='handled'
				keyboardDismissMode='interactive'>
				<FormTextInput
					label={I18n.t('Apple_Watch_Quick_Replies')}
					value={input}
					onChangeText={setInput}
					placeholder={I18n.t('Add_Quick_Reply')}
					onSubmitEditing={addQuickReply}
					submitBehavior='submit'
					returnKeyType='done'
					containerStyle={styles.inputContainer}
					maxLength={QUICK_REPLY_MAX_LENGTH}
				/>
				<Text style={[styles.info, { color: colors.fontHint }]}>
					{I18n.t('Apple_Watch_Quick_Replies_Description', { max: QUICK_REPLIES_MAX, length: QUICK_REPLY_MAX_LENGTH })}
				</Text>
				{quickReplies.length !== 0 && (
					<View style={styles.chipContainer}>
						{quickReplies.map(reply => (
							<Chip key={reply} text={reply} fullWidth onPress={() => removeQuickReply(reply)} />
						))}
					</View>
				)}
			</ScrollView>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	content: { flexGrow: 1, paddingTop: 32, gap: 12 },
	inputContainer: { marginBottom: 0 },
	info: { fontSize: 14, lineHeight: 20, ...sharedStyles.textRegular },
	chipContainer: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, marginHorizontal: -4 }
});
export default UserWatchOSQuickRepliesView;
