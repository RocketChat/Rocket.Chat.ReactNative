import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";

const styles = StyleSheet.create({
    container: {
        flex: 1 / 3, 
        flexDirection: 'row',
        width: '100%', 
        backgroundColor: 'transparent'

    }
})

interface IRowProps extends ViewProps  {
};

const Grid = ({...rest}: IRowProps) => (
    <View {...rest} style={styles.container} />
)

export default Grid;