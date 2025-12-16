import React from 'react';
import { StyleSheet } from 'react-native-unistyles';

import Button from '../Button';
import AvatarContainer from './AvatarContainer';
import { type IAvatar } from './interfaces';
import I18n from '../../i18n';
import { useTheme } from '../../theme';
import { BUTTON_HIT_SLOP } from '../message/utils';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { compareServerVersion } from '../../lib/methods/helpers/compareServerVersion';
import sharedStyles from '../../views/Styles';

const styles = StyleSheet.create({
	editAvatarButton: {
		marginTop: 16,
		paddingVertical: 8,
		paddingHorizontal: 12,
		marginBottom: 0,
		height: undefined
	},
	textButton: {
		fontSize: 12,
		...sharedStyles.textSemibold
	}
});

interface IAvatarContainer extends Omit<IAvatar, 'size'> {
	handleEdit?: () => void;
	editAccessibilityLabel?: string;
}

const AvatarWithEdit = ({
	style,
	text = '',
	avatar,
	emoji,
	borderRadius,
	type,
	children,
	onPress,
	getCustomEmoji,
	isStatic,
	rid,
	handleEdit,
	editAccessibilityLabel
}: IAvatarContainer): React.ReactElement => {
	const { colors } = useTheme();

	const { serverVersion } = useAppSelector(state => ({
		serverVersion: state.server.version
	}));

	return (
		<>
			<AvatarContainer
				style={style}
				text={text}
				avatar={avatar}
				emoji={emoji}
				size={120}
				borderRadius={borderRadius}
				type={type}
				children={children}
				onPress={onPress}
				getCustomEmoji={getCustomEmoji}
				isStatic={isStatic}
				rid={rid}
			/>
			{handleEdit && serverVersion && compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '3.6.0') ? (
				<Button
					accessibilityLabel={editAccessibilityLabel}
					title={I18n.t('Edit')}
					type='secondary'
					onPress={handleEdit}
					testID='avatar-edit-button'
					style={styles.editAvatarButton}
					styleText={styles.textButton}
					color={colors.fontTitlesLabels}
					hitSlop={BUTTON_HIT_SLOP}
				/>
			) : null}
		</>
	);
};

export default AvatarWithEdit;
