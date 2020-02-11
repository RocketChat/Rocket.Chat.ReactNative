import React from 'react'
import { KeyboardAvoidingView, StyleSheet, Keyboard, TouchableWithoutFeedback } from 'react-native'

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export const KeyboardUtilityView: React.FunctionComponent<{}> = ({ children }) => (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView style={styles.container} behavior='padding' enabled>
            {children}
        </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
)