import React from 'react';
import { HeaderButton } from './HeaderButton';

/**
 * Defining a Create Thread Button within the Header.
 */

export const HeaderCreateThreadButton = ({ navigation }) => (
    <HeaderButton orientation={'right'} onPress={() => navigation.push('CreateThreadPage')} image={require('../../assets/images/new-post.png')} />
);