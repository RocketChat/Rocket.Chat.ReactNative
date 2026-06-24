// Jest mock for react-native-unistyles.
//
// This mirrors the mock shipped at react-native-unistyles/mocks, with one change: the theme
// registry is SEEDED from the app's real color tokens at factory time instead of starting empty
// and waiting for StyleSheet.configure(). The shipped mock leaves themes empty until configure()
// runs, but jest.resetModules() rebuilds this factory's closure with an empty registry and does
// not re-run setup files, so any module-scope `StyleSheet.create(theme => ...)` loaded after a
// reset would receive an undefined theme and crash. Seeding here keeps themes available across
// resets without depending on configure() being called again.

jest.mock('react-native-nitro-modules', () => ({
	NitroModules: {
		createHybridObject: () => ({
			add: () => {},
			init: () => {},
			createHybridStatusBar: () => ({
				setStyle: () => {}
			}),
			createHybridNavigationBar: () => {}
		})
	}
}));

jest.mock('react-native-unistyles', () => {
	const { createElement } = require('react');
	// eslint-disable-next-line global-require
	const { colors } = require('./app/lib/constants/colors');
	const _REGISTRY = {
		themes: {
			light: { colors: colors.light },
			dark: { colors: colors.dark },
			black: { colors: colors.black }
		},
		breakpoints: {}
	};
	const miniRuntime = {
		themeName: undefined,
		breakpoint: undefined,
		hasAdaptiveThemes: false,
		colorScheme: 'unspecified',
		contentSizeCategory: 'Medium',
		insets: { top: 0, left: 0, right: 0, bottom: 0, ime: 0 },
		pixelRatio: 1,
		fontScale: 1,
		rtl: false,
		isLandscape: false,
		isPortrait: true,
		navigationBar: { width: 0, height: 0 },
		screen: { width: 0, height: 0 },
		statusBar: { width: 0, height: 0 }
	};
	const unistylesRuntime = {
		colorScheme: 'unspecified',
		contentSizeCategory: 'Medium',
		orientation: 'portrait',
		isPortrait: true,
		isLandscape: false,
		breakpoints: {},
		dispose: () => {},
		equals: () => false,
		name: 'UnistylesRuntimeMock',
		miniRuntime,
		statusBar: {
			height: 0,
			width: 0,
			name: 'StatusBarMock',
			equals: () => false,
			setHidden: () => {},
			setStyle: () => {}
		},
		navigationBar: {
			height: 0,
			width: 0,
			name: 'NavigationBarMock',
			equals: () => false,
			setHidden: () => {},
			dispose: () => {}
		},
		fontScale: 1,
		hasAdaptiveThemes: false,
		pixelRatio: 0,
		rtl: false,
		getTheme: () => Object.values(_REGISTRY.themes).at(0) ?? {},
		setTheme: () => {},
		updateTheme: () => {},
		setRootViewBackgroundColor: () => {},
		nativeSetRootViewBackgroundColor: () => {},
		createHybridStatusBar: () => ({}),
		createHybridNavigationBar: () => ({}),
		setAdaptiveThemes: () => {},
		setImmersiveMode: () => {},
		setImmersiveModeNative: () => {},
		insets: { top: 0, left: 0, right: 0, bottom: 0, ime: 0 },
		screen: { width: 0, height: 0 },
		breakpoint: undefined
	};
	const stripVariants = styleEntries => {
		const result = {};
		for (const [name, style] of Object.entries(styleEntries)) {
			if (typeof style === 'function') {
				result[name] = (...args) => {
					const resolved = style(...args);
					const { variants, compoundVariants, ...rest } = resolved;
					return rest;
				};
			} else if (style !== null && typeof style === 'object' && !Array.isArray(style)) {
				const { variants, compoundVariants, ...rest } = style;
				result[name] = rest;
			} else {
				result[name] = style;
			}
		}
		return result;
	};
	return {
		Hide: () => null,
		Display: () => null,
		ScopedTheme: () => null,
		withUnistyles: (Component, mapper) => props =>
			createElement(Component, {
				...mapper?.(Object.values(_REGISTRY.themes).at(0) ?? {}, miniRuntime),
				...props
			}),
		mq: {
			only: {
				width: () => ({ and: { height: () => ({}) } }),
				height: () => ({ and: { width: () => ({}) } })
			},
			width: () => ({ and: { height: () => ({}) } }),
			height: () => ({ and: { width: () => ({}) } })
		},
		useUnistyles: () => ({
			theme: Object.values(_REGISTRY.themes).at(0) ?? {},
			rt: unistylesRuntime
		}),
		StyleSheet: {
			absoluteFillObject: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
			absoluteFill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
			compose: styles => styles,
			flatten: styles => styles,
			create: styles => {
				const resolved = typeof styles === 'function' ? styles(Object.values(_REGISTRY.themes).at(0) ?? {}, miniRuntime) : styles;
				return { ...stripVariants(resolved), useVariants: () => {} };
			},
			configure: config => {
				if (config.breakpoints) {
					_REGISTRY.breakpoints = config.breakpoints;
				}
				if (config.themes) {
					_REGISTRY.themes = config.themes;
				}
			},
			jsMethods: {
				processColor: () => null,
				parseBoxShadowString: () => []
			},
			hairlineWidth: 1,
			addChangeListener: () => () => {},
			init: () => {},
			name: 'StyleSheetMock',
			dispose: () => {},
			equals: () => false
		},
		UnistylesRuntime: unistylesRuntime
	};
});

jest.mock('react-native-unistyles/reanimated', () => {
	const unistyles = require('react-native-unistyles');
	const mockedSharedValue = value => ({
		get: () => value,
		set: () => {},
		value
	});
	return {
		useAnimatedTheme: () => {
			const { theme } = unistyles.useUnistyles();
			return mockedSharedValue(theme);
		},
		useAnimatedVariantColor: () => ({
			fromValue: mockedSharedValue('#000000'),
			toValue: mockedSharedValue('#FFFFFF')
		})
	};
});
