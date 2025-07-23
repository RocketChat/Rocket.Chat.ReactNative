import React from 'react';
import { Text } from 'react-native';
import { Timestamp as TimestampProps } from '@rocket.chat/message-parser';

import { useTheme } from '../../../../theme';
import styles from '../../styles';
import { formatTimestamp } from '../../../../lib/helpers/timestampUtils';
import RelativeTimestamp from './RelativeTimestamp';

interface ITimestampProps {
    block: TimestampProps; 
    index?: number;
}

const Timestamp = ({ block, index }: ITimestampProps) => {
    const { colors } = useTheme();
    const spaceLeft = index && index > 0 ? ' ' : ''; 

    // Get timestamp data from the message parser
    const { timestamp, format } = block.value; 

    // Use a special component for relative time
    if (format === 'R') {
        return (
            <>
                {spaceLeft}
                <RelativeTimestamp timestamp={Number(timestamp)} />
            </>
        );
    }

    
    // Static time display
    try {
        const date = new Date(Number(timestamp) * 1000);
        const displayText = formatTimestamp(date, format);
        
        return (
            <Text 
                style={[
                    styles.text, 
                    { 
                        color: colors.fontInfo,
                        fontWeight: '600' 
                    }
                ]}
                accessibilityLabel={`Timestamp: ${displayText}`}
            >
                {spaceLeft}{displayText}
            </Text>
        );
    } catch (error) {
        return (
            <Text style={[styles.text, { color: colors.fontDefault }]}>
                {spaceLeft}&lt;t:{timestamp}:{format}&gt;
            </Text>
        );
    }
};

export default Timestamp;