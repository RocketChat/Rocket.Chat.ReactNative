import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import PropTypes from 'prop-types';
import { Keyboard } from 'react-native';
import { Modalize } from 'react-native-modalize';
import { FlatList } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

import Item from './Item';

import Separator from '../Separator';
import { themes } from '../../constants/colors';
import styles from './styles';

const ActionSheet = forwardRef(({ options, Header, theme }, ref) => {
	const modalizeRef = useRef();

	const hide = () => {
		modalizeRef.current?.close();
	};

	const show = () => {
		Keyboard.dismiss();
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		modalizeRef.current?.open();
	};

	useImperativeHandle(ref, () => ({
		show,
		hide
	}));

	return (
		<Modalize
			ref={modalizeRef}
			adjustToContentHeight
			HeaderComponent={Header}
			handleStyle={{ backgroundColor: themes[theme].auxiliaryText }}
			modalStyle={{ backgroundColor: themes[theme].backgroundColor }}
			handlePosition='inside'
		>
			<FlatList
				data={options}
				renderItem={({ item }) => (
					<Item
						item={item}
						onPress={() => {
							item.onPress();
							hide();
						}}
						theme={theme}
					/>
				)}
				style={{ backgroundColor: themes[theme].backgroundColor }}
				contentContainerStyle={styles.content}
				ListHeaderComponent={() => <Separator theme={theme} />}
				ItemSeparatorComponent={() => <Separator theme={theme} />}
			/>
		</Modalize>
	);
});
ActionSheet.propTypes = {
	options: PropTypes.array,
	Header: PropTypes.node,
	theme: PropTypes.string
};

export default ActionSheet;
