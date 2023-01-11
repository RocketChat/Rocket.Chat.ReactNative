import React from 'react';

import Button from '../Button';
import AvatarContainer from './AvatarContainer';
import { IAvatar } from './interfaces';
import I18n from '../../i18n';
import { useTheme } from '../../theme';
import { BUTTON_HIT_SLOP } from '../message/utils';
import styles from './styles';

interface IAvatarContainer extends IAvatar {
	handleEdit?: () => void;
}

const AvatarWithEdit = ({
	style,
	text = '',
	avatar,
	emoji,
	size,
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

	return (
		<>
			<AvatarContainer
				style={style}
				text={text}
				avatar={avatar}
				emoji={emoji}
				size={size}
				borderRadius={borderRadius}
				type={type}
				children={children}
				onPress={onPress}
				getCustomEmoji={getCustomEmoji}
				isStatic={isStatic}
				rid={rid}
			/>
			{handleEdit ? (
				<Button
					title={I18n.t('Edit')}
					type='secondary'
					backgroundColor={colors.editAndUploadButtonAvatar}
					onPress={handleEdit}
					testID='avatar-edit-button'
					style={styles.editAvatarButton}
					styleText={[styles.textButton]}
					color={colors.titleText}
					hitSlop={BUTTON_HIT_SLOP}
				/>
			) : null}
		</>
	);
};

export default AvatarWithEdit;
