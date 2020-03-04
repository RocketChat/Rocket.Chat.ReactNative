import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { appStyles } from '../theme/style';
import { appColors } from '../theme/colors';
import { getOutputFileNames } from 'typescript';

interface Props {
    title: string;
    loading?: boolean;
    onPress: () => void;
}

const styles = StyleSheet.create({
    button: {
        color: '#0DEFDE',
        borderRadius: 4,
        backgroundColor: appColors.primary,
        height: 30,
        width: 100,
        marginTop: 7,
    },
    buttonContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
});

export const PublishButton: React.FunctionComponent<Props> = ({ title, onPress, loading }) => (
    <TouchableOpacity style={[styles.button]} onPress={onPress}>
        <View style={[styles.buttonContainer]}>
            {loading ? <ActivityIndicator color='#ffffff' /> : <Text style={[appStyles.buttonText]}>{title}</Text>}
        </View>
    </TouchableOpacity>
)