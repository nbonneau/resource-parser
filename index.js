const path = require('path');
const dotenv = require('dotenv');
const extend = require('extend');
const objectPath = require('object-path');

const ResourceParser = function () {
    return this;
}

ResourceParser.middleware = function resourceParserMiddleware() {

    const data = ResourceParser.parse.apply(ResourceParser, arguments);

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
ResourceParser.parse = function parse() {

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

    data = ResourceParser.extendImports(data, dirpath);

    const parsed = ResourceParser.parseObject(data, ResourceParser.extendEnvs(refs));

    return ResourceParser.parseObject(parsed, parsed);
}

/**
 * Parse data insing refs
 * 
 * @param {object} data 
 * @param {object} refs 
 * @return {object} parser data
 */
ResourceParser.parseObject = function parseObject(data, refs, target = {}) {

    if (!refs) {
        throw new Error('missing references object argument');
    }

    return Object.keys(data).reduce((acc, key) => {
        if (Array.isArray(data[key])) {
            acc[key] = ResourceParser.parseObject(data[key], refs, []);
        } else if (typeof data[key] === 'object') {
            acc[key] = ResourceParser.parseObject(data[key], refs);
        } else if (typeof data[key] === 'string') {
            acc[key] = ResourceParser.parseString(data[key], refs);
        } else {
            acc[key] = data[key];
        }
        return acc;
    }, target);
}

/**
 * Replace all env value inside a string
 * 
 * @param {string} val The string value to parse
 * @param {Object} refs The environment object
 */
ResourceParser.parseString = function parseString(val, refs) {

    let find = true;

    if (!refs) {
        throw new Error('missing references object argument');
    }

    const save = [];

    while (ResourceParser.containReferences(val) && find) {
        ResourceParser.getReferences(val).forEach(match => {

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
                        val = ResourceParser.parseObject(val, refs, []);
                    } else if (typeof val === 'object') {
                        val = ResourceParser.parseObject(val, refs);
                    }

                    find = true;
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

ResourceParser.containReferences = function containReferences(value) {
    return ResourceParser.getReferences(value).length > 0;
}

ResourceParser.getReferences = function getReferences(value) {
    return typeof value === 'string' ? value.match(new RegExp(/{[a-zA-Z0-9,"\[\]\s\\\-_]+(\.[a-zA-Z0-9,"\[\]\s\\\-_]+)*}/g)) || [] : [];
}

/**
 * Extend/parse file to import
 * 
 * @param {Array<string>} imports 
 * @param {string} dirpath 
 * @param {object} refs 
 * @return {object}
 */
ResourceParser.extendImports = function extendImports(data, dirname) {

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
ResourceParser.extendEnvs = function extendEnvs(refs = {}) {
    return extend(true, {}, refs, process.env, dotenv.config());
}

exports = module.exports = function (obj, refs) {
    return ResourceParser.parse(obj || path.join(process.cwd(), 'config.json'), refs);
};

exports.ResourceParser = ResourceParser;