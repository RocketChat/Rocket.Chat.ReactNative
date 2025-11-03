import { StyleSheet, UnistylesThemes } from 'react-native-unistyles'

import { initialTheme } from "./lib/methods/helpers/theme";
import { themes } from "./lib/constants/colors";

type AppThemes = typeof themes
//type AppBreakpoints = typeof breakpoints

declare module 'react-native-unistyles' {
    export interface UnistylesThemes extends AppThemes {}
    //export interface UnistylesBreakpoints extends AppBreakpoints {}
}

const settings = {
    initialTheme: initialTheme().currentTheme as keyof UnistylesThemes
}

StyleSheet.configure({
    themes,
    settings
})