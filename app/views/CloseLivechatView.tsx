import React, { useState, useLayoutEffect } from 'react';
import { StyleSheet, ScrollView, Text } from 'react-native';
import { BlockContext } from '@rocket.chat/ui-kit';

import { IBaseScreen } from '../definitions';
import I18n from '../i18n';
import { ChatsStackParamList } from '../stacks/types';
import { useTheme } from '../theme';
import KeyboardView from '../containers/KeyboardView';
import SafeAreaView from '../containers/SafeAreaView';
import { FormTextInput } from '../containers/TextInput';
import Button from '../containers/Button';
import { useAppSelector } from '../lib/hooks';
import sharedStyles from './Styles';
import scrollPersistTaps from '../lib/methods/helpers/scrollPersistTaps';
import { MultiSelect } from '../containers/UIKit/MultiSelect';
import { closeLivechat } from '../lib/methods/helpers/closeLivechat';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16
	},
	subtitleText: {
		marginBottom: 10,
		fontSize: 14,
		...sharedStyles.textSemibold
	},
	buttonMarginVertical: { marginVertical: 20 }
});

const CloseLivechatView = ({ navigation, route }: IBaseScreen<ChatsStackParamList, 'CloseLivechatView'>) => {
	const rid = route.params?.rid;
	const departmentInfo = route.params?.departmentInfo;
	const tagsList = route.params?.tagsList;
	const requestTags = departmentInfo?.requestTagBeforeClosingChat;

	const [inputValue, setInputValue] = useState('');
	const [tagParamSelected, setTagParamSelected] = useState<string[]>([]);

	const { colors } = useTheme();

	const { isMasterDetail, livechatRequestComment } = useAppSelector(state => ({
		isMasterDetail: state.app.isMasterDetail,
		livechatRequestComment: state.settings.Livechat_request_comment_when_closing_conversation as boolean
	}));

	useLayoutEffect(() => {
		navigation.setOptions({
			title: I18n.t('Close_Chat')
		});
	}, [navigation]);

	const canSubmit = () => {
		if (!requestTags && !livechatRequestComment) {
			return true;
		}
		if (requestTags && tagParamSelected.length > 0 && !livechatRequestComment) {
			return true;
		}
		if (livechatRequestComment && !!inputValue && !requestTags) {
			return true;
		}
		if (livechatRequestComment && requestTags && tagParamSelected.length > 0 && !!inputValue) {
			return true;
		}
		return false;
	};

	const submit = () => {
		closeLivechat({ rid, isMasterDetail, comment: inputValue, tags: tagParamSelected });
	};

	return (
		<KeyboardView
			style={{ backgroundColor: colors.surfaceHover }}
			contentContainerStyle={sharedStyles.container}
			keyboardVerticalOffset={128}>
			<ScrollView {...scrollPersistTaps} style={styles.container}>
				<SafeAreaView>
					<FormTextInput
						label={I18n.t('Please_add_a_comment')}
						defaultValue={''}
						onChangeText={text => setInputValue(text)}
						onSubmitEditing={() => {
							if (canSubmit()) {
								submit();
							}
						}}
					/>

					{requestTags ? (
						<>
							<Text style={[styles.subtitleText, { color: colors.fontTitlesLabels }]}>{I18n.t('Tags')}</Text>
							<MultiSelect
								options={tagsList?.map(({ name }) => ({ text: { text: name }, value: name }))}
								onChange={({ value }: { value: string[] }) => {
									setTagParamSelected(value);
								}}
								placeholder={{ text: I18n.t('Select_tags') }}
								value={tagParamSelected}
								context={BlockContext.FORM}
								multiselect
								inputStyle={{ borderColor: colors.strokeLight }}
							/>
						</>
					) : null}
					<Button
						title={I18n.t('Close')}
						onPress={submit}
						disabled={!canSubmit()}
						backgroundColor={colors.buttonBackgroundDangerDefault}
						type='primary'
						style={styles.buttonMarginVertical}
					/>
				</SafeAreaView>
			</ScrollView>
		</KeyboardView>
	);
};

export default CloseLivechatView;
