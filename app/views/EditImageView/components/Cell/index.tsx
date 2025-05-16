import React from "react";
import { StyleSheet, View } from "react-native";
import { ComposedGesture, GestureDetector, GestureType } from "react-native-gesture-handler";

const styles = StyleSheet.create({
    container: {
        flex: 1 / 3, 
        height: '100%',
        backgroundColor: 'transparent' 
    }
})

interface ICellProps  {
    gesture: ComposedGesture | GestureType;
};

const Cell = ({gesture}: ICellProps) => (
    <GestureDetector gesture={gesture}>
        <View style={styles.container} />
    </GestureDetector>
)

export default Cell