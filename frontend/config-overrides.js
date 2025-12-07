// Конфигурация для отключения предупреждений source-map-loader и fork-ts-checker-webpack-plugin
module.exports = function override(config, env) {
  // Найти правило source-map-loader и исключить node_modules
  config.module.rules.forEach((rule) => {
    if (rule.enforce === 'pre' && rule.use && Array.isArray(rule.use)) {
      rule.use.forEach((use) => {
        if (use.loader && use.loader.includes('source-map-loader')) {
          // Исключить node_modules из обработки source-map-loader
          if (!rule.exclude) {
            rule.exclude = /node_modules/;
          } else if (Array.isArray(rule.exclude)) {
            rule.exclude.push(/node_modules/);
          } else {
            rule.exclude = [rule.exclude, /node_modules/];
          }
        }
      });
    }
  });

  // Отключить fork-ts-checker-webpack-plugin для избежания проблем с schema-utils
  if (config.plugins) {
    config.plugins = config.plugins.filter((plugin) => {
      // Проверяем по имени конструктора и по строковому представлению
      const pluginName = plugin.constructor?.name || '';
      const pluginString = plugin.toString();
      return (
        pluginName !== 'ForkTsCheckerWebpackPlugin' &&
        !pluginString.includes('ForkTsCheckerWebpackPlugin') &&
        !pluginString.includes('fork-ts-checker')
      );
    });
  }

  // Отключить минификацию и удалить minimizer для production, чтобы избежать проблем с ajv-formats
  if (env === 'production' && config.optimization) {
    // Отключаем минификацию полностью
    config.optimization.minimize = false;
    // Удаляем minimizer массив, чтобы TerserPlugin не использовался
    if (config.optimization.minimizer) {
      config.optimization.minimizer = [];
    }
  }

  return config;
};

