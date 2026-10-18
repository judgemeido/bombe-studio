import { Config } from '@remotion/cli/config';
import { resolve } from 'node:path';

// The shared procedural model and ThreeCanvas must use one Three instance.
Config.overrideWebpackConfig(config => ({
  ...config,
  resolve: { ...config.resolve, alias: { ...config.resolve?.alias, three: resolve('node_modules/three') } },
}));
