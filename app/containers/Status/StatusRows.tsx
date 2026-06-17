import { type ReactElement } from 'react';
import { StyleSheet, type StyleProp, Text, type TextStyle, View, type ViewStyle } from 'react-native';

import Status from '.';
import { CustomIcon } from '../CustomIcon';
import { type TUserStatus, STATUS_I18N_KEYS } from '../../definitions';
import { formatStatusExpiry } from '../../lib/methods/helpers/formatStatusExpiry';
import I18n from '../../i18n';

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		marginTop: 2
	}
});

interface IStatusRows {
	userId?: string;
	statusText?: string;
	status?: TUserStatus;
	statusExpiresAt?: string;
	statusTextColor: string;
	fontSecondaryInfo: string;
	renderStatusText?: (text: string) => ReactElement;
	textStyle?: StyleProp<TextStyle>;
	secondaryTextStyle?: StyleProp<TextStyle>;
	rowStyle?: StyleProp<ViewStyle>;
	expiryRowStyle?: StyleProp<ViewStyle>;
	testIDs?: {
		customStatus?: string;
		presenceStatus?: string;
		statusExpiry?: string;
	};
}

const StatusRows = ({
	userId,
	statusText,
	status,
	statusExpiresAt,
	statusTextColor,
	fontSecondaryInfo,
	renderStatusText,
	textStyle,
	secondaryTextStyle,
	rowStyle,
	expiryRowStyle,
	testIDs
}: IStatusRows): ReactElement => {
	const presenceLabel = !statusText && status ? STATUS_I18N_KEYS[status] : undefined;
	const formattedExpiry = statusExpiresAt ? formatStatusExpiry(statusExpiresAt) : undefined;

	return (
		<>
			{!!statusText && (
				<View testID={testIDs?.customStatus} style={[styles.row, rowStyle]}>
					{userId && <Status size={12} id={userId} />}
					{renderStatusText ? (
						renderStatusText(statusText)
					) : (
						<Text style={[textStyle, { color: statusTextColor }]}>{statusText}</Text>
					)}
				</View>
			)}
			{!!presenceLabel && (
				<View testID={testIDs?.presenceStatus} style={[styles.row, rowStyle]}>
					{userId && <Status size={12} id={userId} />}
					<Text style={[textStyle, { color: statusTextColor }]}>{I18n.t(presenceLabel)}</Text>
				</View>
			)}
			{!!formattedExpiry && (
				<View testID={testIDs?.statusExpiry} style={[styles.row, expiryRowStyle]}>
					<CustomIcon
						name='clock'
						size={14}
						color={fontSecondaryInfo}
						accessibilityElementsHidden
						importantForAccessibility='no'
					/>
					<Text style={[secondaryTextStyle, { color: fontSecondaryInfo }]}>{formattedExpiry}</Text>
				</View>
			)}
		</>
	);
};

export default StatusRows;
