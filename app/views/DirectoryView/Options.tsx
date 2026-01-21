import React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CustomIcon, type TIconsName } from '../../containers/CustomIcon';
import * as List from '../../containers/List';
import I18n from '../../i18n';
import styles from './styles';
import Switch from '../../containers/Switch';
import { useTheme } from '../../theme';

interface IDirectoryOptionsProps {
	type: string;
	globalUsers: boolean;
	isFederationEnabled: boolean;
	changeType: Function;
	toggleWorkspace(): void;
	hasViewOutsideRoomPermission: boolean;
}

const DirectoryOptions = ({
	type: propType,
	globalUsers,
	isFederationEnabled,
	changeType,
	toggleWorkspace,
	hasViewOutsideRoomPermission
}: IDirectoryOptionsProps) => {
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();

	const renderItem = (itemType: string) => {
		let text = 'Users';
		let icon: TIconsName = 'user';
		if (itemType === 'channels') {
			text = 'Channels';
			icon = 'channel-public';
		}

		if (itemType === 'teams') {
			text = 'Teams';
			icon = 'teams';
		}

		const isDisabled = itemType === 'users' && !hasViewOutsideRoomPermission;

		return (
			<List.Radio
				title={text}
				value={itemType}
				isSelected={propType === itemType}
				onPress={() => !isDisabled && changeType(itemType)}
				disabled={isDisabled}
				left={() => (
					<CustomIcon
						name={icon}
						size={22}
						color={isDisabled ? colors.fontDisabled : colors.fontDefault}
						style={styles.filterItemIcon}
					/>
				)}
			/>
		);
	};

	return (
		<View style={{ backgroundColor: colors.surfaceRoom, marginBottom: insets.bottom }}>
			<List.Separator />
			{renderItem('channels')}
			<List.Separator />
			{renderItem('users')}
			<List.Separator />
			{renderItem('teams')}
			<List.Separator />
			{isFederationEnabled ? (
				<>
					<List.Separator />
					<View style={[styles.filterItemContainer, styles.globalUsersContainer]}>
						<View style={styles.globalUsersTextContainer}>
							<Text style={[styles.filterItemText, { color: colors.fontHint }]}>{I18n.t('Search_global_users')}</Text>
							<Text style={[styles.filterItemDescription, { color: colors.fontHint }]}>
								{I18n.t('Search_global_users_description')}
							</Text>
						</View>
						<Switch value={globalUsers} onValueChange={toggleWorkspace} />
					</View>
				</>
			) : null}
		</View>
	);
};

export default DirectoryOptions;
