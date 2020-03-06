import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { appStyles } from '../theme/style';
import i18n from '../i18n'

/**
 * Defining a Link.
 */

interface Props {
    title: string;
    onPress: () => void;
}

export const Link: React.FunctionComponent<Props> = ({ title, onPress }) => (
    <TouchableOpacity onPress={onPress}>
        <Text style={[appStyles.linkText]}>{title}</Text>
    </TouchableOpacity>
)