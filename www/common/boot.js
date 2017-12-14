// Stage 0, this gets cached which means we can't change it. boot2.js is changable.
define(['../api/config?cb=' + (+new Date()).toString(16), 'module'], function (Config, Module) {
    Config.requireConf = Config.requireConf || {};
    if (Config.prefix) {
        Config.requireConf.onNodeCreated = function (node /*, config, module, path*/) {
            if (node.getAttribute('src').indexOf('/') === 0) {
                console.log(node.getAttribute('src'));
                console.log(Config.prefix);
                node.setAttribute('src', '/' + Config.prefix + node.getAttribute('src'));
            }
        };
    }
    require.config(Config.requireConf);
    require(['/common/boot2.js']);
});
