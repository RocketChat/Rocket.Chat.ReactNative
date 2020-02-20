import React from 'react';
import { HeaderButton } from './HeaderButton';

export const HeaderSaveThreadButton = ({ navigation }) => (
    <HeaderButton onPress={() => alert('morgen')} image={require('../../assets/images/save-post.png')} />
);