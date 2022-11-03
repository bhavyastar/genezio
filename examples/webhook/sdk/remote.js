/**
 * This is an auto generated code. This code should not be modified since the file can be overwriten 
 * if new genezio commands are executed.
 */

import https from 'https';
import http from 'http';

async function makeRequest(request, url, port) {

    const data = JSON.stringify(request);
    const hostUrl = new URL(url);

    const options = {
        hostname: hostUrl.hostname,
        method: 'POST',
        port,
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length,
        },
    };
    const client = port === 443 ? https : http;

    return new Promise((resolve, reject) => {
        const req = client.request(options, res => {
            let body = '';

            res.on('data', d => {
                body += d
            });
            res.on('end', async function() {
                const response = JSON.parse(body);
                resolve(response);
            });

        });

        req.on('error', error => {
            reject(error);
        });

        req.write(data);
        req.end();
    });
}

/**
 * The class through which all request to the Genezio backend will be passed.
 */
export class Remote {
    url = undefined
    port = 443

    constructor(url, port) {
        this.url = url
        this.port = port
    }

    async call(method, ...args) {
        const requestContent = {"jsonrpc": "2.0", "method": method, "params": args, "id": 3};
        const response = await makeRequest(requestContent, this.url, this.port);

        if (response.error) {
            return response.error.message;
        }

        return response.result;
    }
}