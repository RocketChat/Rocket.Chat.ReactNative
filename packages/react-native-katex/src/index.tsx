import React from 'react';
import { WebView } from 'react-native-webview';
import { WebViewSharedProps } from 'react-native-webview/lib/WebViewTypes';

import katexStyle from './katex-style';
import katexScript from './katex-script';

export interface KatexOptions {
  displayMode?: boolean;
  output?: 'html' | 'mathml' | 'htmlAndMathml';
  leqno?: boolean;
  fleqn?: boolean;
  throwOnError?: boolean;
  errorColor?: string;
  macros?: any;
  minRuleThickness?: number;
  colorIsTextColor?: boolean;
  maxSize?: number;
  maxExpand?: number;
  strict?: boolean | string;
  trust?: boolean;
  globalGroup?: boolean;
}

export interface ContentOptions extends KatexOptions {
  inlineStyle?: string;
  expression?: string;
}

function getContent({ inlineStyle, expression, ...options }: ContentOptions) {
  return `<!DOCTYPE html>
<html>
<head>
<style>
${katexStyle}
${inlineStyle}
</style>
<script>
window.onerror = e => document.write(e);
window.onload = () => katex.render(${JSON.stringify(expression)}, document.body, ${JSON.stringify(options)});
${katexScript}
</script>
</head>
<body>
</body>
</html>
`;
}

const defaultStyle = {
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
};

const defaultInlineStyle = `
html, body {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  margin: 0;
  padding: 0;
}
.katex {
  margin: 0;
  display: flex;
}
`;

export interface KatexProps extends ContentOptions, Omit<WebViewSharedProps, 'source'> {}

export default function Katex({
  expression = '',
  displayMode = false,
  output,
  leqno,
  fleqn,
  throwOnError = false,
  errorColor = '#f00',
  macros = {},
  minRuleThickness,
  colorIsTextColor = false,
  maxSize,
  maxExpand,
  strict,
  trust,
  globalGroup,
  inlineStyle = defaultInlineStyle,
  ...webViewProps
}: KatexProps) {
  return (
    <WebView
      style={defaultStyle}
      {...webViewProps}
      source={{
        html: getContent({
          expression,
          inlineStyle,
          displayMode,
          output,
          leqno,
          fleqn,
          throwOnError,
          errorColor,
          macros,
          minRuleThickness,
          colorIsTextColor,
          maxSize,
          maxExpand,
          strict,
          trust,
          globalGroup,
        }),
      }}
    />
  );
}
