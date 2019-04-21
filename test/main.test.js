const expect = require('chai').expect;

const ResourceParser = require('../index');

describe('resource-parser', function() {
    it('should get references', function() {
        expect(ResourceParser.containReferences('{ref0}/{obj.ref1}/ok')).to.equals(true);
        expect(ResourceParser.containReferences('{["a", "dot.dot"]}')).to.equals(true);
        expect(ResourceParser.containReferences('{["a", "dot.dot"]}:value')).to.equals(true);
        expect(ResourceParser.containReferences('{ref0.ref1}')).to.equals(true);
        expect(ResourceParser.containReferences('{ref}')).to.equals(true);
        expect(ResourceParser.containReferences('value')).to.equals(false);
        expect(ResourceParser.containReferences(true)).to.equals(false);
        expect(ResourceParser.containReferences('')).to.equals(false);
        expect(ResourceParser.containReferences(null)).to.equals(false);
        expect(ResourceParser.containReferences()).to.equals(false);
        expect(ResourceParser.containReferences({})).to.equals(false);
        expect(ResourceParser.containReferences([])).to.equals(false);
        expect(ResourceParser.containReferences(10)).to.equals(false);
    });
    it('should containe references', function() {
        expect(ResourceParser.getReferences('{ref0}/{obj.ref1}/ok')).to.deep.equals(['{ref0}', '{obj.ref1}']);
        expect(ResourceParser.getReferences('{ref0}')).to.deep.equals(['{ref0}']);
        expect(ResourceParser.getReferences('{ref0.ref1}')).to.deep.equals(['{ref0.ref1}']);
        expect(ResourceParser.getReferences('value')).to.deep.equals([]);
        expect(ResourceParser.getReferences(true)).to.deep.equals([]);
        expect(ResourceParser.getReferences('')).to.deep.equals([]);
        expect(ResourceParser.getReferences(null)).to.deep.equals([]);
        expect(ResourceParser.getReferences()).to.deep.equals([]);
        expect(ResourceParser.getReferences({})).to.deep.equals([]);
        expect(ResourceParser.getReferences([])).to.deep.equals([]);
        expect(ResourceParser.getReferences(10)).to.deep.equals([]);
        expect(ResourceParser.getReferences('{["a", "dot.dot"]}')).to.deep.equals(['{["a", "dot.dot"]}']);
        expect(ResourceParser.getReferences('{["a", "dot.dot"]}:value')).to.deep.equals(['{["a", "dot.dot"]}']);
    });
    it('should parse string', function() {
        expect(ResourceParser.parseString('{ref0}/{obj.ref1}/ok', {
            ref0: 'test0',
            obj: {
                ref1: 'test1'
            }
        })).to.equals('test0/test1/ok');
        expect(ResourceParser.parseString('{ref0}', {
            ref0: 'test0'
        })).to.equals('test0');
        expect(ResourceParser.parseString('{ref0.ref1}', {
            ref0: {ref1: 'test0'}
        })).to.equals('test0');
        expect(ResourceParser.parseString('value', {
            ref0: {ref1: 'test0'}
        })).to.equals('value');
        expect(ResourceParser.parseString('{ref0}/value', {
            ref0: 'test0'
        })).to.equals('test0/value');
        expect(ResourceParser.parseString('{["a", "dot.dot"]}', {
            a: {
                "dot.dot": "value"
            }
        })).to.equals('value');
        expect(ResourceParser.parseString('{["a", "dot.dot"]}:value', {
            a: {
                "dot.dot": "value"
            }
        })).to.equals('value:value');
    });
    it('should parse object', function() {

        const data = ResourceParser.parseObject({
            key: '{ref0}',
            obj: {
                key: '{ref0}/{obj.ref1}/ok'
            }
        }, {
            ref0: 'test0',
            obj: {
                ref1: 'test1'
            }
        });

        expect(data.key).to.equals('test0');
        expect(data.obj.key).to.equals('test0/test1/ok');
    });
    it('should parse config from object', function() {

        const data = ResourceParser.parse({
            key: '{HOME}',
            key0: '{key}/public',
            ref1: '{ref2}',
            ref2: '{ref3}',
            ref3: '{ref1}'
        });

        expect(data.key).to.equals(process.env.HOME);
        expect(data.key0).to.equals(data.key + '/public');
    });
    it('should parse config from relative filepath (without dirname argument)', function() {

        const data = ResourceParser.parse('test/config.json');

        expect(data).to.have.property('paramRef');
        expect(data.config.ref).is.not.string;
        expect(data.config.ref).to.have.property('handler')
        expect(data.config.ref.handler).to.have.property('key');
        expect(data.config.ref.handler.key).to.equals('value');
        expect(data.ref).to.equals('key');
        expect(data.paramRef).to.equals(true);
    });
    it('should parse config from relative filepath', function() {

        const data = ResourceParser.parse('config.json', __dirname);

        expect(data).to.have.property('paramRef');
        expect(data.config.ref).is.not.string;
        expect(data.config.ref).to.have.property('handler')
        expect(data.config.ref.handler).to.have.property('key');
        expect(data.config.ref.handler.key).to.equals('value');
        expect(data.ref).to.equals('key');
        expect(data.paramRef).to.equals(true);
    });
    it('should parse config from absolute filepath', function() {

        const data = ResourceParser.parse(__dirname + '/config.json');

        expect(data).to.have.property('paramRef');
        expect(data.config.ref).is.not.string;
        expect(data.config.ref).to.have.property('handler')
        expect(data.config.ref.handler).to.have.property('key');
        expect(data.config.ref.handler.key).to.equals('value');
        expect(data.ref).to.equals('key');
        expect(data.paramRef).to.equals(true);
    });
    it('should parse config from object with imports', function() {

        const data = ResourceParser.parse({
            key: '{HOME}',
            imports: [
                'config.json'
            ]
        }, __dirname);

        expect(data).to.have.property('paramRef');
        expect(data.config.ref).is.not.string;
        expect(data.config.ref).to.have.property('handler')
        expect(data.config.ref.handler).to.have.property('key');
        expect(data.config.ref.handler.key).to.equals('value');
        expect(data.ref).to.equals('key');
        expect(data.paramRef).to.equals(true);
        expect(data.key).to.equals(process.env.HOME);
    });
});