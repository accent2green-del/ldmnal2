const validateData = require('./utils/validation');

function parseProcessData(jsonData) {
    const data = JSON.parse(jsonData);
    if (!validateData(data)) {
        throw new Error('Invalid data format');
    }
    // Processing logic here
    return data;
}

module.exports = parseProcessData;