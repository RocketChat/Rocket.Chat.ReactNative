import React from 'react'
import { KeyboardAvoidingView, StyleSheet, Keyboard, TouchableWithoutFeedback } from 'react-native'

const styles = StyleSheet.create({
    centerContainer: {
        flex: 1,
        width: '100%',
    },
    centerContainerHorizontally: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerContainerVertically: {
        alignItems: 'center',
    },
});

export const KeyboardUtilityView: React.FunctionComponent<{ centerVertically?: boolean }> = ({ children, centerVertically }) => (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView style={[styles.centerContainer, styles.centerContainerHorizontally, centerVertically ? styles.centerContainerVertically : {}]} enabled>
            {children}
        </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
)