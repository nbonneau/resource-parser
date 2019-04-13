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
        "name": "{DB_NAME}" // Replace {DB_NAME} by value of "DB_NAME" env
    },
    "homeDir": "{HOME}/app", // Replace {HOME} by value of "HOME" env 
    "publicDir": "{homeDir}/public" // Replace {homeDir} by value of "homeDir" key
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
        "parameters.json" // Will merge parsed content of parameter.json file
    ],
    "database": {   // Key "host" will be added from parameters.json
        "name": "{DB_NAME}" // Replace {DB_NAME} by value of "DB_NAME" env
    },
    "publicDir": "{parameters.homeDir}/public" // Replace {parameters.homeDir} by value of "parameters.homeDir" key
}
```

__parameters.json__

```json
{
    "database": {
        "host": "{DB_HOST}"
    },
    "parameters": {
        "imports": [
            // Import other config files
        ],
        "homeDir": "{HOME}/app" // Replace {HOME} by value of "HOME" env 
    }
}
```