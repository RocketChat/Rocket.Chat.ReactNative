import React from 'react';
import { View } from 'react-native';

import styles from './styles';
import { themes } from '../../constants/colors';
import Avatar from '../../containers/Avatar';

interface IWrapper {
	accessibilityLabel: string;
	avatar: string;
	avatarSize: number;
	type: string;
	theme: string;
	rid: string;
	children: JSX.Element;
}

const Wrapper = ({ accessibilityLabel, avatar, avatarSize, type, theme, rid, children }: IWrapper) => (
	<View style={styles.container} accessibilityLabel={accessibilityLabel}>
		<Avatar text={avatar} size={avatarSize} type={type} style={styles.avatar} rid={rid} />
		<View
			style={[
				styles.centerContainer,
				{
					borderColor: themes[theme].separatorColor
				}
			]}>
			{children}
		</View>
	</View>
);

export default Wrapper;
