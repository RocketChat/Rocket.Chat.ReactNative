import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet } from 'react-native';

import { withTheme } from '../theme';
import { themes } from '../constants/colors';
import TextInput from '../containers/TextInput';
import KeyboardView from '../presentation/KeyboardView';
import I18n from '../i18n';

import sharedStyles from './Styles';

const styles = StyleSheet.create({
	content: {
		padding: 16
	},
	title: {
		fontSize: 20,
		paddingVertical: 10,
		...sharedStyles.textMedium
	}
});

const Title = ({ title, theme }) => <Text style={[styles.title, { color: themes[theme].titleText }]}>{title}</Text>;
Title.propTypes = {
	title: PropTypes.string,
	theme: PropTypes.string
};

const LivechatEditView = ({ navigation, theme }) => {
	const livechat = navigation.getParam('livechat', {});
	const visitor = navigation.getParam('visitor', {});

	return (
		<KeyboardView
			style={{ backgroundColor: themes[theme].auxiliaryBackground }}
			contentContainerStyle={sharedStyles.container}
			keyboardVerticalOffset={128}
		>
			<View style={styles.content}>
				<Title
					title={visitor.username}
					theme={theme}
				/>
				<TextInput
					label={I18n.t('Name')}
					defaultValue={visitor.name}
					theme={theme}
				/>
				<TextInput
					label={I18n.t('Email')}
					defaultValue={visitor.visitorEmails[0]?.address}
					theme={theme}
				/>
				<TextInput
					label={I18n.t('Phone')}
					defaultValue={visitor.phone[0]?.phoneNumber}
					theme={theme}
				/>
				{Object.entries(visitor.livechatData).map(([key, value]) => (
					<TextInput
						label={key}
						defaultValue={value}
						theme={theme}
					/>
				))}
				<Title
					title={I18n.t('Conversation')}
					theme={theme}
				/>
				<TextInput
					label={I18n.t('Topic')}
					defaultValue={livechat.topic}
					theme={theme}
				/>
				{Object.entries(livechat.livechatData).map(([key, value]) => (
					<TextInput
						label={key}
						defaultValue={value}
						theme={theme}
					/>
				))}
			</View>
		</KeyboardView>
	);
};
LivechatEditView.propTypes = {
	navigation: PropTypes.object,
	theme: PropTypes.string
};
LivechatEditView.navigationOptions = {
	title: I18n.t('Livechat_edit')
};

export default withTheme(LivechatEditView);
