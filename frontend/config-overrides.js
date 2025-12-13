// Конфигурация для отключения предупреждений source-map-loader
module.exports = function override(config, env) {
  // Игнорировать все предупреждения о source maps
  config.ignoreWarnings = [
    /Failed to parse source map/,
    /source-map-loader/,
    /ENOENT: no such file or directory/,
    /node_modules/,
  ];

  // Найти и настроить все правила source-map-loader
  const configureSourceMapLoader = (rules) => {
    if (!rules) return;
    
    rules.forEach((rule) => {
      // Обработка обычных правил
      if (rule.enforce === 'pre' && rule.use && Array.isArray(rule.use)) {
        rule.use.forEach((use) => {
          if (use.loader && use.loader.includes('source-map-loader')) {
            // Исключить node_modules
            if (!rule.exclude) {
              rule.exclude = /node_modules/;
            } else if (typeof rule.exclude === 'function') {
              const originalExclude = rule.exclude;
              rule.exclude = (modulePath) => {
                if (/node_modules/.test(modulePath)) return true;
                return originalExclude(modulePath);
              };
            } else if (Array.isArray(rule.exclude)) {
              if (!rule.exclude.some(exp => exp.toString() === /node_modules/.toString())) {
                rule.exclude.push(/node_modules/);
              }
            } else if (rule.exclude.toString() !== /node_modules/.toString()) {
              rule.exclude = [rule.exclude, /node_modules/];
            }
          }
        });
      }
      
      // Обработка oneOf правил
      if (rule.oneOf) {
        configureSourceMapLoader(rule.oneOf);
      }
    });
  };

  configureSourceMapLoader(config.module.rules);

  return config;
};

