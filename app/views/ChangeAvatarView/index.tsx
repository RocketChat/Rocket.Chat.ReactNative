import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';

import KeyboardView from '../../containers/KeyboardView';
import sharedStyles from '../Styles';
import scrollPersistTaps from '../../lib/methods/helpers/scrollPersistTaps';
import StatusBar from '../../containers/StatusBar';
import { useTheme } from '../../theme';
import SafeAreaView from '../../containers/SafeAreaView';
import * as List from '../../containers/List';
import styles from './styles';
import { useAppSelector } from '../../lib/hooks';
import { getUserSelector } from '../../selectors/login';
import Avatar from '../../containers/Avatar';
import AvatarUrl from './AvatarUrl';
import Button from '../../containers/Button';
import I18n from '../../i18n';

const ChangeAvatarView = () => {
	const [avatarUrl, setAvatarUrl] = useState('');
	const { colors } = useTheme();

	const user = useAppSelector(state => getUserSelector(state));

	return (
		<KeyboardView
			style={{ backgroundColor: colors.auxiliaryBackground }}
			contentContainerStyle={sharedStyles.container}
			keyboardVerticalOffset={128}
		>
			<StatusBar />
			<SafeAreaView testID='change-avatar-view'>
				<ScrollView
					contentContainerStyle={sharedStyles.containerScrollView}
					testID='change-avatar-view-list'
					{...scrollPersistTaps}
				>
					<View style={styles.avatarContainer} testID='change-avatar-view-avatar'>
						<Avatar text={user.username} avatar={avatarUrl} isStatic={avatarUrl} size={100} />
					</View>
					<AvatarUrl onSubmit={(value: string) => setAvatarUrl(value)} />
					<List.Separator style={styles.separator} />

					<Button
						title={I18n.t('Upload_image')}
						type='secondary'
						backgroundColor={colors.chatComponentBackground}
						onPress={() => {}}
						testID='change-avatar-view-logout-other-locations'
					/>
					<Button
						title={I18n.t('Delete_image')}
						type='primary'
						backgroundColor={colors.dangerColor}
						onPress={() => {}}
						testID='change-avatar-view-delete-my-account'
					/>
					<Button
						title={I18n.t('Save')}
						type='primary'
						onPress={() => {}}
						// disabled={!this.formIsChanged()}
						testID='change-avatar-view-submit'
						// loading={saving}
					/>
				</ScrollView>
			</SafeAreaView>
		</KeyboardView>
	);
};

export default ChangeAvatarView;
