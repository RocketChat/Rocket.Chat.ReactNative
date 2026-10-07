import { StyleSheet, Text, View } from 'react-native';
import { render, screen, within } from '@testing-library/react-native';

import { themes } from '~/lib/constants/colors';
import NativeListSection from '../Section';

const Row = ({ title }: { title: string; selected?: boolean }) => <Text>{title}</Text>;

const hostViewsWithBackground = (backgroundColor: string) =>
	screen.root.findAll(
		node => String(node.type) === 'View' && StyleSheet.flatten(node.props.style)?.backgroundColor === backgroundColor
	);

const separators = () => hostViewsWithBackground(themes.light.strokeExtraLight);

describe('NativeListSection', () => {
	it('highlights the selected row and drops the separators around it', async () => {
		await render(
			<View>
				<NativeListSection>
					<Row key='first' title='First' />
					<Row key='second' title='Second' selected />
					<Row key='third' title='Third' />
				</NativeListSection>
			</View>
		);

		const highlighted = hostViewsWithBackground(themes.light.surfaceSelected);
		expect(highlighted).toHaveLength(1);
		expect(within(highlighted[0]).getByText('Second')).toBeTruthy();
		expect(separators()).toHaveLength(0);
	});

	it('separates unselected rows', async () => {
		await render(
			<View>
				<NativeListSection>
					<Row key='first' title='First' />
					<Row key='second' title='Second' />
					<Row key='third' title='Third' />
				</NativeListSection>
			</View>
		);

		expect(hostViewsWithBackground(themes.light.surfaceSelected)).toHaveLength(0);
		expect(separators()).toHaveLength(2);
	});
});
