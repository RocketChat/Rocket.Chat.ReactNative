import React from 'react';
import { Text, View } from 'react-native';

import AvatarContainer from '../../../containers/Avatar';
import { CustomIcon } from '../../../containers/CustomIcon';
import { styles } from '../styles';

interface ICallerInfo {
	name: string;
	extension?: string;
	avatarText?: string;
	isMuted?: boolean;
	showOnlineStatus?: boolean;
}

const CallerInfo = ({ name, extension, avatarText, isMuted = false, showOnlineStatus = false }: ICallerInfo): React.ReactElement => (
	<View style={styles.callerInfoContainer}>
		<View style={styles.avatarContainer}>
			<AvatarContainer text={avatarText || name} size={120} borderRadius={16} />
			{showOnlineStatus && <View style={styles.statusIndicator} />}
		</View>
		<View style={styles.callerNameRow}>
			<Text style={styles.callerName} numberOfLines={1}>
				{name}
			</Text>
			{isMuted && <CustomIcon name='microphone-disabled' size={20} color='#F5455C' style={styles.mutedIndicator} />}
		</View>
		{extension ? <Text style={styles.callerExtension}>{extension}</Text> : null}
	</View>
);

export default CallerInfo;
