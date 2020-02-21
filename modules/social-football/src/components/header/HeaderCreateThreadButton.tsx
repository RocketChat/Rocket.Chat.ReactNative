import React from 'react';
import { HeaderButton } from './HeaderButton';

export const HeaderCreateThreadButton = ({ navigation }) => (
    <HeaderButton onPress={() => navigation.push('CreateThreadPage')} image={require('../../assets/images/new-post.png')} />
);