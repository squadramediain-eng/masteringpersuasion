import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(80);
Config.setConcurrency(4);
Config.setCodec('h264');
Config.setOutputLocation('out');

// Allow SVG files to be imported as raw strings so scenes can animate per-layer
Config.overrideWebpackConfig((currentConfig) => {
  return {
    ...currentConfig,
    module: {
      ...currentConfig.module,
      rules: [
        // SVG as raw string — must come first so it takes priority
        {
          test: /\.svg$/i,
          type: 'asset/source',
        },
        // Keep all non-SVG rules
        ...(currentConfig.module?.rules ?? []).filter((rule: any) => {
          if (!rule || typeof rule !== 'object' || Array.isArray(rule)) return true;
          if (rule.test && typeof rule.test.toString === 'function') {
            return !rule.test.toString().toLowerCase().includes('svg');
          }
          return true;
        }),
      ],
    },
  };
});
