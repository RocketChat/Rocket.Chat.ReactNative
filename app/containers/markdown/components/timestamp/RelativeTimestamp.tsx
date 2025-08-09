import React, { useState, useEffect } from 'react';
import { Text } from 'react-native';
import moment from 'moment';

import { useTheme } from '../../../../theme';
import styles from '../../styles';

interface IRelativeTimestampProps {
    timestamp: number;
}

const RelativeTimestamp = ({ timestamp }: IRelativeTimestampProps) => {
    const { colors } = useTheme();
    const [displayText, setDisplayText] = useState('');

    useEffect(() => {
        const updateDisplay = () => {
            const date = moment.unix(timestamp);
            setDisplayText(date.fromNow());
        };

        updateDisplay();
        const interval = setInterval(updateDisplay, 60000);

        return () => clearInterval(interval);
    }, [timestamp]);

    return (
        <Text 
            style={[
                styles.text, 
                { 
                    color: colors.fontInfo,
                    fontWeight: '600'
                }
            ]}
            accessibilityLabel={`Relative timestamp: ${displayText}`}
        >
            {displayText}
        </Text>
    );
};

export default RelativeTimestamp;