import React, { useState } from 'react';
import { TextInput as NativeTextInput, StyleSheet } from 'react-native';
import { appStyles } from '../theme/style';
import { appColors } from '../theme/colors';

/**
 * Defining a Text Input field.
 */

const styles = StyleSheet.create({
    input: {
        borderRadius: 4,
        borderWidth: 1,
        borderColor: appColors.inputBorder,
        paddingTop: 12,
        paddingBottom: 12,
        paddingLeft: 10,
        paddingRight: 10,
        textAlignVertical: 'top'
    },
    inputError: {
        borderColor: appColors.error,
    },
    multiline: {
        minHeight: 65,
    }
});

export const TextInput: React.FunctionComponent<any> = ({ required, submitted, onChangeText, ...props }) => {
    const [typed, setTyped] = useState(false);
    const [value, setValue] = useState<string|null>(null);
    const valid = !required || (value?.length ?? 0) > 0;
    const dirty = typed || submitted;

    return <NativeTextInput style={[styles.input, appStyles.inputText, (valid || !dirty) ? {} : styles.inputError, props.multiline ? styles.multiline : {} ]}
        onChangeText={(value) => {
            setValue(value);
            setTyped(true);
            onChangeText(value);
        }}
    {...props} />
}
