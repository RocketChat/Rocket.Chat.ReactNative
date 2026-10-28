import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import I18n from '~/i18n';
import SafeAreaView from '~/containers/SafeAreaView';
import { type ProfileStackParamList } from '~/stacks/types';
import { FormTextInput } from '~/containers/TextInput';
import NativeListRow from '~/containers/NativeListRow';
import { PlainSeparator } from '~/containers/NativeListRow/components/Separator';
import userPreferences, { useUserPreferences } from '~/lib/methods/userPreferences';
import { CURRENT_SERVER, getWatchOSQuickRepliesKey } from '~/lib/constants/keys';
import { QUICK_REPLIES_MAX, QUICK_REPLY_MAX_LENGTH } from '~/lib/methods/watchOSQuickReplies/constants';
import { syncWatchOSQuickReplies } from '~/lib/methods/watchOSQuickReplies/syncReplies';
import log from '~/lib/methods/helpers/log';
import { showToast } from '~/lib/methods/helpers/showToast';
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
		syncWatchOSQuickReplies(currentServer);
	};

	const addQuickReply = () => {
		if (!currentServer) {
			log(new Error('Error: cannot set quick replies, current server is undefined'));
			return;
		}
		const value = input.trim();
		if (!value) return;
		const isNew = !quickReplies.includes(value);
		if (isNew && quickReplies.length >= QUICK_REPLIES_MAX) {
			showToast(I18n.t('Quick_replies_limit_reached', { max: QUICK_REPLIES_MAX }));
			return;
		}
		if (isNew) setQuickReplies([...quickReplies, value]);
		setInput('');
		syncWatchOSQuickReplies(currentServer);
	};

	return (
		<SafeAreaView testID='watchos-quick-replies-view'>
			<FlatList
				data={quickReplies}
				keyExtractor={reply => reply}
				contentContainerStyle={[styles.content, { backgroundColor: colors.surfaceTint }]}
				keyboardShouldPersistTaps='handled'
				keyboardDismissMode='interactive'
				ItemSeparatorComponent={PlainSeparator}
				ListHeaderComponent={
					<View style={styles.header}>
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
					</View>
				}
				renderItem={({ item, index }) => (
					<NativeListRow
						title={item}
						testID={`watchos-quick-reply-${item}`}
						accessibilityLabel={item}
						isFirst={index === 0}
						isLast={index === quickReplies.length - 1}
						trailingAction={{
							icon: 'delete',
							onPress: () => removeQuickReply(item),
							testID: `watchos-quick-reply-${item}-delete`,
							accessibilityLabel: I18n.t('Delete')
						}}
					/>
				)}
			/>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	content: {
		flexGrow: 1,
		paddingTop: 32,
		paddingBottom: 24
	},
	header: {
		gap: 12,
		paddingHorizontal: 16,
		paddingBottom: 16
	},
	inputContainer: {
		marginBottom: 0
	},
	info: {
		fontSize: 14,
		lineHeight: 20,
		...sharedStyles.textRegular
	}
});

export default UserWatchOSQuickRepliesView;
