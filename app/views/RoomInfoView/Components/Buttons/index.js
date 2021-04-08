
import React from 'react';
import { View } from 'react-native';
import renderButton from './Button';
import styles from '../styles';
import I18n from '../../../../i18n';

const renderButtons = (isDirect, createDirect, jitsiEnabled, videoCall, goRoom) => (
	<View style={styles.roomButtonsContainer}>
		{renderButton(goRoom, 'message', I18n.t('Message'), isDirect, createDirect)}
		{jitsiEnabled && isDirect ? renderButton(videoCall, 'camera', I18n.t('Video_call'), isDirect, createDirect) : null}
	</View>
);

export default renderButtons;
