# Icons

Icons are rendered with [react-native-nano-icons](https://github.com/software-mansion-labs/react-native-nano-icons), which builds an icon font from the SVGs in `assets/icons/custom/`.
The SVGs come from the [Iconography Figma file](https://www.figma.com/design/W1fsDedouj59h65GBTkyvj/Iconography?node-id=110-41&p=f&m=dev). The file name is the icon name.

## Adding or changing an icon

1. Export the icon from Figma as a single-color SVG into `assets/icons/custom/<icon-name>.svg`.
2. Regenerate the font and glyph map, and link them into the native projects:

```sh
pnpm build-icon-set
```

3. Commit the SVG together with the generated `app/containers/CustomIcon/nanoicons/custom.ttf`, `app/containers/CustomIcon/nanoicons/custom.glyphmap.json` and the native font changes under `android/` and `ios/`.
4. Rebuild the native app (run `pnpm pod-install` first on iOS).

`TIconsName` is typed from the glyph map, so TypeScript autocompletes existing icons and flags unknown ones.
