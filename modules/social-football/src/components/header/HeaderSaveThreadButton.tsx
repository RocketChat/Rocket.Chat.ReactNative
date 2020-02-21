import React from 'react';
import { HeaderButton } from './HeaderButton';

export const HeaderSaveThreadButton = ({ onPress }) => (
    <HeaderButton onPress={onPress} image={require('../../assets/images/save-post.png')} />
);
