import { StyleSheet, Text } from 'react-native';

import { useTheme } from '~/theme';
import { useCallStore } from '~/lib/services/voip/useCallStore';
import I18n from '~/i18n';
import sharedStyles from '~/views/Styles';

const styles = StyleSheet.create({
	headerSubtitle: {
		...sharedStyles.textRegular,
		fontSize: 12,
		lineHeight: 16
	}
});

const Subtitle = () => {
	const { colors } = useTheme();
	const contact = useCallStore(state => state.contact);
	const extension = contact.sipExtension;
	const isOnHold = useCallStore(state => state.isOnHold || state.remoteHeld);
	const remoteMute = useCallStore(state => state.remoteMute);
	const callState = useCallStore(state => state.callState);

	let subtitle = '';
	if (callState === 'ringing') {
		subtitle = I18n.t('Calling');
	} else if (callState !== 'active') {
		subtitle = I18n.t('Connecting');
	} else {
		subtitle = extension ? `${extension}` : '';
		const callStatus = [];
		callStatus.push(isOnHold ? I18n.t('On_hold') : null);
		callStatus.push(remoteMute ? I18n.t('Muted') : null);
		subtitle += callStatus.filter(Boolean).length > 0 && extension ? ' - ' : '';
		subtitle += callStatus.filter(Boolean).join(', ');
	}

	if (!subtitle) {
		return null;
	}

	return (
		<Text
			style={[styles.headerSubtitle, { color: colors.fontSecondaryInfo }]}
			testID='call-view-header-subtitle'
			numberOfLines={1}>
			{subtitle}
		</Text>
	);
};

export default Subtitle;
