import React from 'react';
import PropTypes from 'prop-types';
import { Text } from 'react-native';

import { themes } from '../../constants/colors';
import { CustomIcon } from '../../lib/Icons';
import styles from './styles';
import { Button } from './Button';
import Avatar from '../Avatar';

export const Item = React.memo(({
	item, hide, theme, user, baseUrl, reactionsMode
}) => {
	const onPress = () => {
		hide();
		item.onPress ? item.onPress() : () => { };
	};

	return (
		<Button
			onPress={reactionsMode ? () => {} : onPress}
			style={[styles.item, { backgroundColor: themes[theme].focusedBackground }]}
			theme={theme}
		>
			{reactionsMode
				? (
					<Avatar
						text={item}
						size={30}
						baseUrl={baseUrl}
						userId={user.id}
						token={user.token}
						theme={theme}
					/>
				)
				: <CustomIcon name={item?.icon} size={20} color={item?.danger ? themes[theme].dangerColor : themes[theme].bodyText} />
			}
			<Text
				numberOfLines={1}
				style={[styles.title, { color: item?.danger ? themes[theme].dangerColor : themes[theme].bodyText }]}
			>
				{item.title || item}
			</Text>
		</Button>
	);
});
Item.propTypes = {
	item: PropTypes.shape({
		title: PropTypes.string,
		icon: PropTypes.string,
		danger: PropTypes.bool,
		onPress: PropTypes.func
	}),
	hide: PropTypes.func,
	theme: PropTypes.string,
	baseUrl: PropTypes.string,
	reactionsMode: PropTypes.bool,
	user: PropTypes.shape({
		id: PropTypes.string,
		token: PropTypes.string
	})
};
