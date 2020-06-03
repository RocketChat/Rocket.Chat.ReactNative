import React from 'react';
import PropTypes from 'prop-types';
import { FlatList, Image } from 'react-native';
import { BorderlessButton } from 'react-native-gesture-handler';

import { BUTTON_HIT_SLOP } from '../../containers/message/utils';
import { themes } from '../../constants/colors';
import { CustomIcon } from '../../lib/Icons';
import styles from './styles';

const Thumb = React.memo(({ item, theme }) => {
	const type = item?.mime;

	if (type?.match(/video/)) {
		const { uri } = item;
		return (
			<>
				<Image source={{ uri }} style={styles.thumb} />
				<CustomIcon
					name='play'
					size={48}
					color={themes[theme].separatorColor}
					style={styles.play}
				/>
			</>
		);
	}

	return (
		<Image
			source={{ uri: item.path }}
			style={styles.thumb}
		/>
	);
});
Thumb.propTypes = {
	item: PropTypes.object,
	theme: PropTypes.string
};

const Thumbs = React.memo(({ attachments, onPress, theme }) => {
	if (attachments?.length > 1) {
		return (
			<FlatList
				horizontal
				data={attachments}
				renderItem={({ item, index }) => (
					<BorderlessButton style={styles.item} onPress={() => onPress(index)}>
						<Thumb
							item={item}
							theme={theme}
						/>
						<BorderlessButton
							hitSlop={BUTTON_HIT_SLOP}
							style={[styles.remove, { backgroundColor: themes[theme].bodyText, borderColor: themes[theme].auxiliaryBackground }]}
						>
							<CustomIcon
								name='cross'
								color={themes[theme].backgroundColor}
								size={16}
							/>
						</BorderlessButton>
					</BorderlessButton>
				)}
				style={[styles.list, { backgroundColor: themes[theme].auxiliaryBackground }]}
			/>
		);
	}
});
Thumbs.propTypes = {
	attachments: PropTypes.array,
	onPress: PropTypes.func,
	theme: PropTypes.string
};

export default Thumbs;
