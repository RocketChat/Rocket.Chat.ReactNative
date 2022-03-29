# Icons

Currently we use the [IcoMoon App](https://icomoon.io/app), a free icon library. To use that, we also need the [react-native-vector-icons](https://github.com/oblador/react-native-vector-icons), so we can create an icon component with the function:

`createIconSetFromIcoMoon(icoMoonConfig, 'custom', 'custom.ttf');`

```
import { createIconSetFromIcoMoon } from 'react-native-vector-icons';
import icoMoonConfig from './selection.json';
const IconMoon = createIconSetFromIcoMoon(
  icoMoonConfig,
  'custom',
  'custom.ttf'
);
```
Make sure you're using the Download option in IcoMoon, and use the .json file that's included in the .zip you've downloaded. 
You'll also need to import the .ttf font file into your project, following the instructions above.

# Typescript

To extract all the advantages of typescript and be able to type our component with all available icons, we first need a constant with the complete list of icons.

For that, we create a script that will go through the previously downloaded json file and generate a new javascript file with all the information we need.

**Attention**, whenever the `selection.json` file changes, it is necessary to run the command:
`yarn build-icons-name` or `npm run build-icons-name` to update the `glyphIcoMoon.js` file that we used to type the component. otherwise you will see an error similar to:

```
TS2322: Type "some-icon-name" is not assignable to type '"search" | "bold" | "link" | "strike" | "avatar" | "image" | "attach" | "status-away" | "status-busy" | "status-loading"
 | "status-offline" | "status-online" | "teams-private" | ... 185 more ... | "add"'.  index.tsx(14, 2): 
 The expected type comes from property 'name' which is declared here on type 'IntrinsicAttributes & ICustomIcon'
```
