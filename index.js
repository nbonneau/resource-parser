const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const extend = require('extend');
const objectPath = require('object-path');

const ResourceParser = function () {

    /**
     * Parser
     * 
     * @param {object} obj 
     * @param {object} refs 
     * @param {boolean} parseRefs 
     */
    this.parse = function parse(obj, refs, parseRefs = true) {

        const envs = this.extendEnvs(refs);
        const data = this.parseFile(obj);
        let parsed = this.parseData(data, envs);

        parsed = this.parseData(parsed, parsed);

        if (typeof obj === 'string') {
            parsed = extend(true, parsed, this.extendImports(parsed.imports || [], path.dirname(obj), refs));
            delete parsed.imports;
        }

        if (parseRefs) {
            parsed = this.parseData(parsed, parsed);
        }

        return parsed;
    }

    /**
     * Extend/parse file to import
     * 
     * @param {Array<string>} imports 
     * @param {string} dirpath 
     * @param {object} refs 
     * @return {object}
     */
    this.extendImports = function extendImports(imports, dirpath, refs) {
        return imports.reduce((acc, i) => {
            acc = extend(true, {}, this.parse(path.join(dirpath, i), refs, false));
            return acc;
        }, {});
    }

    /**
     * Extend env from refs, dotenv and process envs
     * 
     * @param {object} refs 
     */
    this.extendEnvs = function extendEnvs(refs) {
        return extend(true, {}, refs, process.env, dotenv.config());
    }

    /**
     * Parse data insing refs
     * 
     * @param {object} data 
     * @param {object} refs 
     * @return {object} parser data
     */
    this.parseData = function parseData(data, refs = {}, target = {}) {
        return Object.keys(data).reduce((acc, key) => {
            if (Array.isArray(data[key])) {
                acc[key] = this.parseData(data[key], refs, []);
            } else if (typeof data[key] === 'object') {
                acc[key] = this.parseData(data[key], refs);
            } else if (typeof data[key] === 'string') {
                acc[key] = this.replaceRefs(data[key], refs);
            } else {
                acc[key] = data[key];
            }
            return acc;
        }, target);
    }

    /**
     * Parse json file from filepath
     * 
     * @param {string|object} filepath
     * @return {object} json data 
     */
    this.parseFile = function parseFile(filepath) {
        return typeof filepath === 'object' ? filepath : JSON.parse(fs.readFileSync(filepath));
    }

    /**
     * Replace all env value inside a string
     * 
     * @param {string} val The string value to parse
     * @param {Object} refs The environment object
     */
    this.replaceRefs = function replaceRefs(val, refs) {
        (val.match(new RegExp(/{\w+(\.\w+)*}/g)) || []).forEach(match => {
            const key = match.replace('{', '').replace('}', '');
            const tmp = objectPath(refs);
            if (tmp.has(key)) {
                const r = tmp.get(key);
                if (val === match) {
                    val = r;
                } else {
                    val = val.replace(match, tmp.get(key));
                }
            }
        });
        return val;
    }

    return this;
}

exports = module.exports = function (obj, refs) {
    return new ResourceParser().parse(obj, refs || {});
};

exports.ResourceParser = ResourceParser;