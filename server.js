const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const port = 3000;
const staticDir = __dirname;

// MIME type mapping
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
};

function serveFile(res, filePath) {
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('File not found', 'utf-8');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`, 'utf-8');
            }
        } else {
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Cache-Control': 'no-cache'
            });
            res.end(content, 'utf-8');
        }
    });
}

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url);
    let pathName = parsedUrl.pathname;

    // Default to index.html for root path
    if (pathName === '/') {
        pathName = '/index.html';
    }

    // Construct file path
    let filePath = path.join(staticDir, pathName);

    // Security check - ensure we're not serving files outside the static directory
    if (!filePath.startsWith(staticDir)) {
        res.writeHead(403, { 'Content-Type': 'text/html' });
        res.end('Forbidden', 'utf-8');
        return;
    }

    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('File not found', 'utf-8');
            return;
        }

        // Check if it's a directory
        fs.stat(filePath, (err, stats) => {
            if (err) {
                res.writeHead(500);
                res.end('Server Error', 'utf-8');
                return;
            }

            if (stats.isDirectory()) {
                // Try to serve index.html from directory
                const indexPath = path.join(filePath, 'index.html');
                fs.access(indexPath, fs.constants.F_OK, (err) => {
                    if (!err) {
                        serveFile(res, indexPath);
                    } else {
                        res.writeHead(404, { 'Content-Type': 'text/html' });
                        res.end('Directory listing not allowed', 'utf-8');
                    }
                });
            } else {
                serveFile(res, filePath);
            }
        });
    });
});

server.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Korean Road Management System running at http://0.0.0.0:${port}/`);
    console.log(`📁 Serving static files from: ${staticDir}`);
    console.log(`⏰ Started at: ${new Date().toLocaleString('ko-KR')}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT. Shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed successfully');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM. Shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed successfully');
        process.exit(0);
    });
});