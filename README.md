# Resource-parser

Parse a JSON resource file using `.env` file and `process.env` data.
Once resource parsed with env values, resource is parsed using itself, so you can make references to other object keys.

## Install

```bash
npm i --save resource-parser
```

## Load resource

When resource loaded, it will be parser from `.env` and `process.env` data

```js
const resourceParser = require('resource-parser');

const config = resourceParser('./config.json');
```

__config.json__

```json
{
    "database": {
        "name": "{DB_NAME}"
    },
    "homeDir": "{HOME}/app",
    "publicDir": "{homeDir}/public"
}
```

## Load resource with import resources

```js
const resourceParser = require('resource-parser');

const config = resourceParser('./config.json');
```

__config.json__

```json
{
    "imports": [
        "parameters.json"
    ],
    "database": {
        "name": "{DB_NAME}"
    },
    "publicDir": "{parameters.homeDir}/public"
}
```

__parameters.json__

```json
{
    "imports": [
        
    ],
    "database": {
        "host": "{DB_HOST}"
    },
    "parameters": {
        "homeDir": "{HOME}/app"
    }
}
```