# Icons

Icons are generated using IcoMoon and react-native-vector-icons https://github.com/oblador/react-native-vector-icons#createiconsetfromicomoonconfig-fontfamily-fontfile

# Typescript

After icons are already working on the app, we need to get Typescript working properly.
For that, we run a script to generate a new file containing the icons data (just like a `d.ts.`).

```sh
yarn build-icon-set
```

It maps all icons on `selection.json` and creates `mappedIcons.js`.
With this file, Typescript provides autocompletes for the existing icons on our Icon Set and lint warnings in case we try to use a non-exiting one.
