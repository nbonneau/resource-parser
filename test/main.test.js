const expect = require('chai').expect;

const ResourceParser = require('../index').ResourceParser;

describe('resource-parser', function() {
    it('should parse config from object', function() {

        const data = ResourceParser.parse({
            "key": '{HOME}'
        });

        expect(data.key).to.equal(process.env.HOME);
    });
    it('should parse config from relative filepath', function() {

        const data = ResourceParser.parse('./test/config.json');

        expect(data).to.have.property('paramRef');
        expect(data.config.ref).is.not.string;
        expect(data.config.ref).to.have.property('handler')
        expect(data.config.ref.handler).to.have.property('key');
        expect(data.config.ref.handler.key).to.equal('value');
        expect(data.paramRef).to.equal(true);
    });
    it('should parse config from relative filepath', function() {

        const data = ResourceParser.parse('config.json', __dirname);

        expect(data).to.have.property('paramRef');
        expect(data.config.ref).is.not.string;
        expect(data.config.ref).to.have.property('handler')
        expect(data.config.ref.handler).to.have.property('key');
        expect(data.config.ref.handler.key).to.equal('value');
        expect(data.paramRef).to.equal(true);
    });
    it('should parse config from absolute filepath', function() {

        const data = ResourceParser.parse(__dirname + '/config.json');

        expect(data).to.have.property('paramRef');
        expect(data.config.ref).is.not.string;
        expect(data.config.ref).to.have.property('handler')
        expect(data.config.ref.handler).to.have.property('key');
        expect(data.config.ref.handler.key).to.equal('value');
        expect(data.paramRef).to.equal(true);
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
        expect(data.config.ref.handler.key).to.equal('value');
        expect(data.paramRef).to.equal(true);
        expect(data.key).to.equal(process.env.HOME);
    });
});