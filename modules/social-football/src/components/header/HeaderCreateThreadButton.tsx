import React from 'react';
import { HeaderButton } from './HeaderButton';

export const HeaderCreateThreadButton = ({ navigation }) => (
    <HeaderButton orientation={'right'} onPress={() => navigation.push('CreateThreadPage')} image={require('../../assets/images/new-post.png')} />
);