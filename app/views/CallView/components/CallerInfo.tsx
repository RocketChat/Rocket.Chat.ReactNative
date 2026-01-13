import React from 'react';
import { Text, View } from 'react-native';

import AvatarContainer from '../../../containers/Avatar';
import { CustomIcon } from '../../../containers/CustomIcon';
import I18n from '../../../i18n';
import { useCallContact } from '../../../lib/services/voip/useCallStore';
import { styles } from '../styles';
import { useTheme } from '../../../theme';
// import Status from '../../../containers/Status';
import sharedStyles from '../../Styles';

interface ICallerInfo {
	isMuted?: boolean;
}

const CallerInfo = ({ isMuted = false }: ICallerInfo): React.ReactElement => {
	const { colors } = useTheme();
	const contact = useCallContact();

	const name = contact.displayName || contact.username || I18n.t('Unknown');
	const extension = contact.sipExtension;
	const avatarText = contact.username || name;

	return (
		<View style={styles.callerInfoContainer} testID='caller-info'>
			<View style={styles.avatarContainer}>
				<AvatarContainer text={avatarText} size={120} borderRadius={16}>
					<View style={[sharedStyles.status, { backgroundColor: colors.surfaceHover }]}>
						{/* <Status size={20} id={contact.username} />  */}
					</View>
				</AvatarContainer>
			</View>
			<View style={styles.callerNameRow}>
				<Text style={[styles.callerName, { color: colors.fontDefault }]} numberOfLines={1} testID='caller-info-name'>
					{name}
				</Text>
				{isMuted && (
					<CustomIcon
						name='microphone-disabled'
						size={20}
						color={colors.fontDanger}
						style={styles.mutedIndicator}
						testID='caller-info-muted'
					/>
				)}
			</View>
			{extension ? (
				<Text style={[styles.callerExtension, { color: colors.fontSecondaryInfo }]} testID='caller-info-extension'>
					{extension}
				</Text>
			) : null}
		</View>
	);
};

export default CallerInfo;
