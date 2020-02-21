import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { appStyles } from '../theme/style';
import { appColors } from '../theme/colors';

interface Props {
    title: string;
    loading?: boolean;
    onPress: () => void;
}

const styles = StyleSheet.create({
    button: {
        borderRadius: 4,
        backgroundColor: appColors.primary,
        height: 40,
    },
    buttonContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
});

export const Button: React.FunctionComponent<Props> = ({ title, onPress, loading }) => (
    <TouchableOpacity style={[styles.button]} onPress={onPress}>
        <View style={[styles.buttonContainer]}>
            {loading ? <ActivityIndicator color='#ffffff' /> : <Text style={[appStyles.buttonText]}>{title}</Text>}
        </View>
    </TouchableOpacity>
)