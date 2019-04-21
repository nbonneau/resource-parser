const path = require('path');
const dotenv = require('dotenv');
const extend = require('extend');
const objectPath = require('object-path');

exports = module.exports = function (obj, refs) {
    return exports.parse(obj || path.join(process.cwd(), 'config.json'), refs);
};

/**
 * Express middleware
 */
exports.middleware = function resourceParserMiddleware() {

    const data = exports.parse.apply(exports, arguments);

    return function (req, res, next) {
        req.config = JSON.parse(JSON.stringify(data));
        next();
    };
}

/**
 * Parser
 * 
 * @param {object} obj 
 * @param {object} refs 
 */
exports.parse = function parse() {

    let dirpath = null;
    let filename = null;
    let refs = arguments[2] || arguments[1];

    if (typeof refs !== 'object') {
        refs = {};
    }

    if (typeof arguments[0] === 'string') {

        filename = path.basename(arguments[0]);

        if (typeof arguments[1] === 'string') {
            dirpath = path.join(arguments[1], path.dirname(arguments[0]));
        } else if (path.isAbsolute(arguments[0])) {
            dirpath = path.dirname(arguments[0]);
        } else if (path.dirname(arguments[0]) === '.') {
            dirpath = process.cwd();
        } else {
            dirpath = path.join(process.cwd(), path.dirname(arguments[0]));
        }
    } else if (typeof arguments[0] === 'object') {
        if (typeof arguments[1] === 'string') {
            dirpath = arguments[1];
        }
    } else {
        throw new TypeError('first argument must be an object or a string');
    }

    let data = typeof arguments[0] === 'object' ? arguments[0] : require(path.join(dirpath, filename));

    data = extendImports(data, dirpath);

    const parsed = exports.parseObject(data, extendEnvs(refs));

    return exports.parseObject(parsed, parsed);
}

/**
 * Parse data insing refs
 * 
 * @param {object} data 
 * @param {object} refs 
 * @return {object} parser data
 */
exports.parseObject = function parseObject(data, refs, isArray) {

    if (!refs) {
        throw new Error('missing references object argument');
    }

    return Object.keys(data).reduce((acc, key) => {
        if (Array.isArray(data[key])) {
            acc[key] = exports.parseObject(data[key], refs, true);
        } else if (typeof data[key] === 'object') {
            acc[key] = exports.parseObject(data[key], refs);
        } else if (typeof data[key] === 'string') {
            acc[key] = exports.parseString(data[key], refs);
        } else {
            acc[key] = data[key];
        }
        return acc;
    }, isArray ? [] : {});
}

/**
 * Replace all env value inside a string
 * 
 * @param {string} val The string value to parse
 * @param {Object} refs The environment object
 */
exports.parseString = function parseString(val, refs) {

    let find = true;

    if (!refs) {
        throw new Error('missing references object argument');
    }

    const save = [];

    while (exports.containReferences(val) && find) {
        exports.getReferences(val).forEach(match => {

            if (save.indexOf(match) === -1) {

                save.push(match);

                let key = match.replace('{', '').replace('}', '');

                if (new RegExp(/^\[.+(\..+)*\]$/g).test(key)) {
                    key = JSON.parse(key);
                }

                const tmp = objectPath(refs);

                if (tmp.has(key) && tmp.get(key) !== val) {
                    const r = tmp.get(key);
                    if (val === match) {
                        val = r;
                    } else {
                        val = val.replace(match, tmp.get(key));
                    }

                    if (Array.isArray(val)) {
                        val = exports.parseObject(val, refs, []);
                    } else if (typeof val === 'object') {
                        val = exports.parseObject(val, refs);
                    }

                    find = true;
                } else if (new RegExp(/\|\|/g).test(key)) {

                    const r = key.split('||').map(s => s.trim());
                    while(r.length > 1 && !tmp.has(r[0])) {
                        r.shift();
                    }

                    val = tmp.get(r[0], r[0]);
                } else {
                    find = false;
                }
            } else {
                find = false;
            }
        });
    }
    return val;
}

/**
 * @params {string} value
 */
exports.containReferences = function containReferences(value) {
    return exports.getReferences(value).length > 0;
}

/**
 * @params {string} value
 */
exports.getReferences = function getReferences(value) {
    return typeof value === 'string' ? value.match(new RegExp(/{[a-zA-Z0-9\|,"\[\]\s\\\-_]+(\.[a-zA-Z0-9\|,"\[\]\s\\\-_]+)*}/g)) || [] : [];
}

/**
 * Extend/parse file to import
 * 
 * @param {Array<string>} imports 
 * @param {string} dirpath 
 * @param {object} refs 
 * @return {object}
 */
function extendImports(data, dirname) {

    const merge = function (imports, dirname) {
        return imports.reduce((acc, file) => {

            let tmp = require(path.join(dirname, file));

            tmp = extend(true, tmp, merge(tmp.imports || [], dirname));
            delete tmp.imports;

            acc = extend(true, acc, tmp);

            return acc;
        }, {});
    }

    data = extend(true, data, merge(data.imports || [], dirname));
    delete data.imports;

    return data;
}

/**
 * Extend env from refs, dotenv and process envs
 * 
 * @param {object} refs 
 */
function extendEnvs(refs = {}) {
    return extend(true, {}, refs, process.env, dotenv.config());
}