import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { appColors } from '../theme/colors';
import { appStyles } from '../theme/style';

interface Props {
    title: string;
}

const styles = StyleSheet.create({
    container: {
        padding: 10,
        borderRadius: 4,
        backgroundColor: appColors.error,
    },
});

export const Alert = ({ title }: Props) => (
    <View style={styles.container}>
        <Text style={appStyles.errorText}>{title}</Text>
    </View>
);