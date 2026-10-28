import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import I18n from '~/i18n';
import SafeAreaView from '~/containers/SafeAreaView';
import { type ProfileStackParamList } from '~/stacks/types';
import { FormTextInput } from '~/containers/TextInput';
import NativeListRow from '~/containers/NativeListRow';
import { PlainSeparator } from '~/containers/NativeListRow/components/Separator';
import { useUserPreferences } from '~/lib/methods/userPreferences';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { getWatchOSQuickRepliesKey } from '~/lib/constants/keys';
import { getQuickRepliesLimits } from '~/lib/methods/watchOSQuickReplies/getQuickRepliesLimits';
import { syncWatchOSQuickReplies } from '~/lib/methods/watchOSQuickReplies/syncReplies';
import { showToast } from '~/lib/methods/helpers/showToast';
import sharedStyles from '~/views/Styles';
import { useTheme } from '~/theme';

interface IUserWatchOSQuickRepliesViewProps {
	navigation: NativeStackNavigationProp<ProfileStackParamList, 'UserWatchOSQuickRepliesView'>;
}

const UserWatchOSQuickRepliesView = ({ navigation }: IUserWatchOSQuickRepliesViewProps): JSX.Element => {
	const server = useAppSelector(state => state.server.server);
	const settings = useAppSelector(state => state.settings);
	const { max, maxLength } = getQuickRepliesLimits(settings);
	const [quickReplies = [], setQuickReplies] = useUserPreferences<string[]>(getWatchOSQuickRepliesKey(server), []);
	const [input, setInput] = useState<string>('');
	const { colors } = useTheme();

	useEffect(() => {
		navigation.setOptions({
			title: I18n.t('Apple_Watch_Quick_Replies')
		});
	}, [navigation]);

	const removeQuickReply = (reply: string) => {
		const newReplies = quickReplies.filter(quickreply => quickreply !== reply);
		setQuickReplies(newReplies);
		syncWatchOSQuickReplies(server);
	};

	const addQuickReply = () => {
		const value = input.trim();
		if (!value) return;
		const isNew = !quickReplies.includes(value);
		if (isNew && quickReplies.length >= max) {
			showToast(I18n.t('Quick_replies_limit_reached', { max }));
			return;
		}
		if (isNew) setQuickReplies([...quickReplies, value]);
		setInput('');
		syncWatchOSQuickReplies(server);
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
							maxLength={maxLength}
						/>
						<Text style={[styles.info, { color: colors.fontHint }]}>
							{I18n.t('Apple_Watch_Quick_Replies_Description', { max, length: maxLength })}
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
