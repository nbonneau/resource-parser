const path = require('path');
const dotenv = require('dotenv');
const extend = require('extend');
const objectPath = require('object-path');

const ResourceParser = function () {
    return this;
}

/**
 * Parser
 * 
 * @param {object} obj 
 * @param {object} refs 
 */
ResourceParser.parse = function parse() {

    let refs = arguments[2] || arguments[1];
    let dirpath = typeof arguments[1] === 'string' ? arguments[1] : null;

    if (!dirpath) {
        dirpath = typeof arguments[0] === 'object' && (Array.isArray(arguments[0].imports) || !arguments[0].imports || !arguments[0].imports.length)
            ? arguments[1]
            : path.dirname(arguments[0]);
    }
    
    let data = typeof arguments[0] === 'object' ? arguments[0] : require(path.isAbsolute(arguments[0]) ? arguments[0] : path.join(dirpath, arguments[0].replace(dirpath, '')));

    if (typeof refs !== 'object') {
        refs = {};
    }

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
ResourceParser.parseObject = function parseObject(data, refs = {}, target = {}) {
    return Object.keys(data).reduce((acc, key) => {
        if (Array.isArray(data[key])) {
            acc[key] = ResourceParser.parseObject(data[key], refs, []);
        } else if (typeof data[key] === 'object') {
            acc[key] = ResourceParser.parseObject(data[key], refs);
        } else if (typeof data[key] === 'string') {
            acc[key] = ResourceParser.parseValue(data[key], refs);
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
ResourceParser.parseValue = function parseValue(val, refs) {

    let find = true;

    while (ResourceParser.containReferences(val) && find) {
        ResourceParser.getReferences(val).forEach(match => {
            const key = match.replace('{', '').replace('}', '');
            const tmp = objectPath(refs);
            if (tmp.has(key)) {
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
        });
    }
    return val;
}

ResourceParser.containReferences = function containReferences(value) {
    return ResourceParser.getReferences(value).length > 0;
}

ResourceParser.getReferences = function getReferences(value) {
    return typeof value === 'string' ? value.match(new RegExp(/{\w+(\.\w+)*}/g)) || [] : [];
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