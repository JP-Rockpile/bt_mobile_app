/// <reference types="expo/types" />

declare module '*.png' {
  const value: number;
  export default value;
}

declare module '*.jpg' {
  const value: number;
  export default value;
}

declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}

// Extend module declarations for react-native-vector-icons
declare module 'react-native-vector-icons/MaterialCommunityIcons' {
  import { Icon } from 'react-native-vector-icons/Icon';
  export default Icon;
}
