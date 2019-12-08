const crypto = require('crypto');

module.exports = {
    throwError: (status, code, message) => {
        return JSON.stringify({
            status,
            code,
            message
        });
    },

    md5: (str) => {
        return crypto.createHash('md5').update(str).digest('hex');
    },

    checkField: (rawData, fields) => {
        let flag = true;
        fields.forEach(field => {
            if (rawData[field] == undefined || rawData[field] == null)
                flag = false;
        });
        return flag;
    }
};