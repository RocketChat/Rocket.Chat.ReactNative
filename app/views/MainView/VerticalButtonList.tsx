import React from 'react';
import { View, Button, StyleSheet, Alert } from 'react-native';

const VerticalButtonList = () => {
    // Function to handle press events
    const handlePress = (buttonName: string) => {
        Alert.alert('Button Pressed', `You pressed ${buttonName}`);
    };

    return (
        <View style={styles.container}>
            <Button
                title="Button 1"
                onPress={() => handlePress("Button 1")}
            />
            <Button
                title="Button 2"
                onPress={() => handlePress("Button 2")}
            />
            <Button
                title="Button 3"
                onPress={() => handlePress("Button 3")}
            />
            <Button
                title="Button 4"
                onPress={() => handlePress("Button 4")}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10
    }
});

export default VerticalButtonList;
