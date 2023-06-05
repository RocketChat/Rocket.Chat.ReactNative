import React from 'react';
import { StyleSheet } from 'react-native';

import Button from '../Button';
import AvatarContainer from './AvatarContainer';
import { IAvatar } from './interfaces';
import I18n from '../../i18n';
import { useTheme } from '../../theme';
import { BUTTON_HIT_SLOP } from '../message/utils';
import { useAppSelector } from '../../lib/hooks';
import { compareServerVersion } from '../../lib/methods/helpers';
import sharedStyles from '../../views/Styles';

const styles = StyleSheet.create({
	editAvatarButton: {
		marginTop: 8,
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
	handleEdit
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
					title={I18n.t('Edit')}
					type='secondary'
					backgroundColor={colors.editAndUploadButtonAvatar}
					onPress={handleEdit}
					testID='avatar-edit-button'
					style={styles.editAvatarButton}
					styleText={styles.textButton}
					color={colors.titleText}
					hitSlop={BUTTON_HIT_SLOP}
				/>
			) : null}
		</>
	);
};

export default AvatarWithEdit;
