import React from 'react';
import PropTypes from 'prop-types';
import { View, Text } from 'react-native';

import Touchable from 'react-native-platform-touchable';
import { themes } from '../../constants/colors';
import * as List from '../../containers/List';
import styles from './styles';
import Button from '../../containers/Button';
import { CustomIcon } from '../../lib/Icons';
import I18n from '../../i18n';

const CannedResponseItem = ({
	theme, onPressDetail, shortcut, scope, onPressUse, text, tags
}) => (
	<>
		<Touchable onPress={onPressDetail} style={[styles.wrapCannedItem, { backgroundColor: themes[theme].messageboxBackground }]}>
			<>
				<View style={styles.cannedRow}>
					<View style={styles.cannedWrapShortcutScope}>
						<Text style={[styles.cannedShortcut, { color: themes[theme].titleText }]}>!{shortcut}</Text>
						<Text style={[styles.cannedScope, { color: themes[theme].auxiliaryTintColor }]}>{scope}</Text>
					</View>

					<Button
						title={I18n.t('Use')}
						fontSize={12}
						color={themes[theme].titleText}
						style={[styles.cannedUseButton, { backgroundColor: themes[theme].chatComponentBackground }]}
						theme={theme}
						onPress={onPressUse}
					/>

					<CustomIcon
						name='chevron-right'
						color={themes[theme].auxiliaryText}
						size={20}
					/>
				</View>

				<Text style={[styles.cannedText, { color: themes[theme].auxiliaryTintColor }]}>“{text}”</Text>

				<View style={styles.cannedTagContainer}>
					{
						tags?.length > 0
							? tags.map(t => (
								<View style={[styles.cannedTagWrap, { backgroundColor: themes[theme].searchboxBackground }]}>
									<Text style={[styles.cannedTag, { color: themes[theme].auxiliaryTintColor }]}>{t}</Text>
								</View>
							))
							: null
					}
				</View>
			</>
		</Touchable>
		<List.Separator />
	</>

);

CannedResponseItem.propTypes = {
	theme: PropTypes.string,
	onPressDetail: PropTypes.func,
	shortcut: PropTypes.string,
	scope: PropTypes.string,
	onPressUse: PropTypes.func,
	text: PropTypes.string,
	tags: PropTypes.array
};

CannedResponseItem.defaultProps = {
	onPressDetail: () => {},
	onPressUse: () => {}
};

export default CannedResponseItem;
