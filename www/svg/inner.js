define([
    'jquery',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/textpatcher/TextPatcher.js',
    '/common/toolbar3.js',
    'json.sortify',
    '/bower_components/chainpad-json-validator/json-ot.js',
    '/common/cryptpad-common.js',
    '/common/common-util.js',
    '/common/cryptget.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/api/config',
    '/common/common-realtime.js',
    '/bower_components/hyperjson/hyperjson.js',

    '/customize/application_config.js',
    '/common/common-thumbnail.js',

    '/bower_components/diff-dom/diffDOM.js',
    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'less!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/customize/src/less2/main.less',
], function (
    $,
    Crypto,
    TextPatcher,
    Toolbar,
    JSONSortify,
    JsonOT,
    Cryptpad,
    Util,
    Cryptget,
    nThen,
    SFCommon,
    ApiConfig,
    CommonRealtime,
    Hyperjson,
    AppConfig,
    Thumb)
{
    var saveAs = window.saveAs;
    var Messages = Cryptpad.Messages;

    var APP = window.APP = {
        Cryptpad: Cryptpad,
        $: $
    };
    var Fabric = APP.Fabric = window.fabric;

    var stringify = function (obj) {
        return JSONSortify(obj);
    };

    var emitResize = APP.emitResize = function () {
        var cw = $('#cp-app-svg-editor-frame')[0].contentWindow;

        var evt = cw.document.createEvent('UIEvents');
        evt.initUIEvent('resize', true, false, cw, 0);
        cw.dispatchEvent(evt);
    };

    var toolbar;

    var onConnectError = function () {
        Cryptpad.errorLoadingScreen(Messages.websocketError);
    };

    var andThen = function (common) {
        var initializing = true;
        var $bar = $('#cp-toolbar');
        var isHistoryMode = false;
        var Title;
        var cpNfInner;
        var metadataMgr;
        var readOnly = false;

        var saveImage = APP.saveImage = function () {
            var defaultName = "pretty-picture.png";
            Cryptpad.prompt(Messages.exportPrompt, defaultName, function (filename) {
                if (!(typeof(filename) === 'string' && filename)) { return; }
                $canvas[0].toBlob(function (blob) {
                    saveAs(blob, filename);
                });
            });
        };

        var setEditable = function (bool) {
            if (readOnly && bool) { return; }
        };

        var config = APP.config = {
            transformFunction: JsonOT.validate,
            // cryptpad debug logging (default is 1)
            // logLevel: 0,
            validateContent: function (content) {
                try {
                    JSON.parse(content);
                    return true;
                } catch (e) {
                    console.log("Failed to parse, rejecting patch");
                    return false;
                }
            }
        };

        var canonicalize = function (str) {
            var tmp = document.createElement("div");
            tmp.innerHTML = str;
            var hjson = Hyperjson.fromDOM(tmp.firstChild);
            var dom = Hyperjson.toDOM(hjson);
            var tmp2 = document.createElement("div");
            tmp2.appendChild(dom);
            return tmp2.innerHTML;
        };

        var stringifyInner = function (textValue) {
            var obj = {
                content: canonicalize(textValue),
                metadata: metadataMgr.getMetadataLazy()
            };
            console.log(obj.content);
            // stringify the json and send it into chainpad
            return stringify(obj);
        };

        var storeSelection = function(svgCanvas) {
            var elementIds = [];
            var elements = svgCanvas.getSelectedElems();
            elements.forEach(function(element) {
                if (element!=null) {
                    elementIds.push(element.id);
                }
            });
            return elementIds;
        };

        var restoreSelection = function(svgCanvas, elements) {
            elements.forEach(function(element) {
                if (element!=null) {
                    var el = svgCanvas.getElem(element);
                    if (el!=null) {
                        svgCanvas.addToSelection([el]);
                    }
                }
            });
        }

        var onLocal = config.onLocal = function () {
            if (initializing) { return; }
            if (isHistoryMode) { return; }
            if (readOnly) { return; }

            var svgCanvas = frames[0].window.svgCanvas;
            var svgEditor = frames[0].window.svgEditor;

            // Store and remove selection
            console.error("in onLocal");
            var selectedElements = storeSelection(svgCanvas);
            console.log(selectedElements);
            svgCanvas.clearSelection();

            var content = stringifyInner(svgCanvas.getSvgString());
            console.log(content);
            APP.patchText(content);

            // Restore selection
            console.log(selectedElements);
            restoreSelection(svgCanvas, selectedElements);
        };

        config.onInit = function (info) {
            readOnly = metadataMgr.getPrivateData().readOnly;

            Title = common.createTitle({});

            var configTb = {
                displayed: ['title', 'useradmin', 'spinner', 'share', 'userlist', 'newpad', 'limit'],
                title: Title.getTitleConfig(),
                metadataMgr: metadataMgr,
                readOnly: readOnly,
                realtime: info.realtime,
                common: Cryptpad,
                sfCommon: common,
                $container: $bar,
                $contentContainer: $('#cp-app-svg-editor')
            };
            toolbar = APP.toolbar = Toolbar.create(configTb);
            Title.setToolbar(toolbar);

            var $rightside = toolbar.$rightside;

            // TODO
            /* add a history button */
            /*var histConfig = {};
            histConfig.onRender = function (val) {
                if (typeof val === "undefined") { return; }
                try {
                    console.log("History render: " + val);
                    var svgCanvas = frames[0].window.svgCanvas;
                    var svgEditor = frames[0].window.svgEditor;
                    var newSVG = hjson2domstring(val);
                    svgCanvas.clearSelection();
                    svgCanvas.clear();
                    svgCanvas.setSvgString(newSVG);
                    svgEditor.updateCanvas();
                } catch (e) {
                    // Probably a parse error
                    console.error(e);
                }
            };
            histConfig.onClose = function () {
                // Close button clicked
                setHistory(false, true);
                jQuery("#editor")[0].style="margin-top: 70px;";

            };
            histConfig.onRevert = function () {
                // Revert button clicked
                setHistory(false, false);
                onLocal();
                onRemote();
            };
            histConfig.onReady = function () {
                // Called when the history is loaded and the UI displayed
                setHistory(true);
                jQuery("#editor")[0].style="margin-top: 100px;";
            };
            histConfig.$toolbar = $bar;
            var $hist = Cryptpad.createButton('history', true, {histConfig: histConfig});
            $rightside.append($hist);*/

            /* save as template */
            if (!metadataMgr.getPrivateData().isTemplate) {
                var templateObj = {
                    rt: info.realtime,
                    getTitle: function () { return metadataMgr.getMetadata().title; }
                };
                var $templateButton = common.createButton('template', true, templateObj);
                $rightside.append($templateButton);
            }

            /* add an export button */
            var $export = common.createButton('export', true, {}, saveImage);
            $rightside.append($export);

            var $forget = common.createButton('forget', true, {}, function (err) {
                if (err) { return; }
                setEditable(false);
            });
            $rightside.append($forget);

            common.createButton('hashtag', true).appendTo($rightside);
        };

        config.onReady = function (info) {
            if (APP.realtime !== info.realtime) {
                var realtime = APP.realtime = info.realtime;
                APP.patchText = TextPatcher.create({
                    realtime: realtime,
                    //logging: true
                });
            }

            var userDoc = APP.realtime.getUserDoc();
            var isNew = false;
            var newDoc = '';
            if (userDoc === "" || userDoc === "{}") { isNew = true; }

            if (userDoc !== "") {
                var hjson = JSON.parse(userDoc);

                if (hjson && hjson.metadata) {
                    metadataMgr.updateMetadata(hjson.metadata);
                }
                if (typeof (hjson) !== 'object' || Array.isArray(hjson) ||
                    (hjson.metadata && typeof(hjson.metadata.type) !== 'undefined' &&
                     hjson.metadata.type !== 'svg')) {
                    var errorText = Messages.typeError;
                    Cryptpad.errorLoadingScreen(errorText);
                    throw new Error(errorText);
                }
                newDoc = hjson.content;
            } else {
                Title.updateTitle(Cryptpad.initialName || Title.defaultTitle);
            }

            initializing = false;
            config.onRemote();
            setEditable(!readOnly);
            config.onLocal();
            Cryptpad.removeLoadingScreen();
            if (readOnly) { return; }
            if (isNew) {
                common.openTemplatePicker();
            }
        };

        // FIXME: setSvgString produces a result slightly different than the value we provide,
        // resulting in an infinite "browser fight" bug
        config.onRemote = function () {
            if (initializing) { return; }
            if (isHistoryMode) { return; }

            var svgCanvas = frames[0].window.svgCanvas;
            var svgEditor = frames[0].window.svgEditor;

            var userDoc = APP.realtime.getUserDoc();
            console.log(userDoc);
            var json = JSON.parse(userDoc);

            if (json.metadata) {
                metadataMgr.updateMetadata(json.metadata);
            }

            console.error('onRemote');
            console.log(json);
            var selectedElements = storeSelection(svgCanvas);
            svgCanvas.clearSelection();
            var currentSVG = svgCanvas.getSvgString();

            var newSVG = json.content;
            if (newSVG === currentSVG) {
                restoreSelection(svgCanvas, selectedElements);
                return;
            }

            console.log(newSVG);
            svgCanvas.clear();
            svgCanvas.setSvgString(newSVG);
            svgCanvas.setSvgString(newSVG);
            svgCanvas.clearSelection();
            svgEditor.updateCanvas();
            restoreSelection(svgCanvas, selectedElements);

            common.notify();
            if (readOnly) { setEditable(false); }
        };


        config.onAbort = function () {
            // inform of network disconnect
            setEditable(false);
            toolbar.failed();
            Cryptpad.alert(Messages.common_connectionLost, undefined, true);
        };

        config.onConnectionChange = function (info) {
            setEditable(info.state);
            if (info.state) {
                initializing = true;
                Cryptpad.findOKButton().click();
            } else {
                Cryptpad.alert(Messages.common_connectionLost, undefined, true);
            }
        };

        config.onError = onConnectError;

        cpNfInner = common.startRealtime(config);
        metadataMgr = cpNfInner.metadataMgr;

        cpNfInner.onInfiniteSpinner(function () {
            setEditable(false);
            Cryptpad.confirm(Messages.realtime_unrecoverableError, function (yes) {
                if (!yes) { return; }
                common.gotoURL();
            });
        });

        //canvas.on('mouse:up', onLocal);

        Cryptpad.onLogout(function () { setEditable(false); });
    };

    var main = function () {
        var common;

        nThen(function (waitFor) {
            $(waitFor(function () {
                Cryptpad.addLoadingScreen();
            }));
            SFCommon.create(waitFor(function (c) { APP.common = common = c; }));
        }).nThen(function (/*waitFor*/) {
            Cryptpad.onError(function (info) {
                if (info && info.type === "store") {
                    onConnectError();
                }
            });
            andThen(common);
        });
    };
    main();
});
