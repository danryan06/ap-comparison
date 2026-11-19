const fs = require('fs');
const https = require('https');
const { URL } = require('url');

const DEFAULT_MAX_BYTES = 10 * 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_MAX_REDIRECTS = 3;

function downloadImage(source, destination, options = {}) {
  const maxBytes = options.maxBytes || DEFAULT_MAX_BYTES;
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const userAgent = options.userAgent || 'AP-Comparison-GitHub-Actions';
  const temporary = `${destination}.download`;

  function cleanup() {
    try {
      fs.unlinkSync(temporary);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
  }

  function request(current, redirects) {
    return new Promise((resolve, reject) => {
      let parsed;
      try {
        parsed = new URL(current);
      } catch (err) {
        reject(new Error('Image URL is invalid.'));
        return;
      }
      if (parsed.protocol !== 'https:') {
        reject(new Error('Image URL must use HTTPS.'));
        return;
      }

      const req = https.get(parsed, { headers: { 'User-Agent': userAgent } }, response => {
        const status = response.statusCode || 0;
        if (status >= 300 && status < 400 && response.headers.location) {
          response.resume();
          if (redirects >= maxRedirects) {
            reject(new Error('Image download exceeded the redirect limit.'));
            return;
          }
          request(new URL(response.headers.location, parsed).href, redirects + 1).then(resolve, reject);
          return;
        }
        if (status !== 200) {
          response.resume();
          reject(new Error(`Image download failed with status ${status}.`));
          return;
        }

        const contentType = String(response.headers['content-type'] || '').split(';', 1)[0].trim().toLowerCase();
        if (!contentType.startsWith('image/')) {
          response.resume();
          reject(new Error(`Image download returned ${contentType || 'an unknown content type'}.`));
          return;
        }
        const declaredLength = Number(response.headers['content-length'] || 0);
        if (declaredLength > maxBytes) {
          response.resume();
          reject(new Error(`Image is larger than ${maxBytes} bytes.`));
          return;
        }

        cleanup();
        const file = fs.createWriteStream(temporary, { flags: 'wx' });
        let bytes = 0;
        let settled = false;

        function fail(err) {
          if (settled) return;
          settled = true;
          response.destroy();
          file.destroy();
          cleanup();
          reject(err);
        }

        response.on('data', chunk => {
          bytes += chunk.length;
          if (bytes > maxBytes) fail(new Error(`Image is larger than ${maxBytes} bytes.`));
        });
        response.on('error', fail);
        file.on('error', fail);
        file.on('finish', () => {
          if (settled) return;
          settled = true;
          file.close(err => {
            if (err) {
              cleanup();
              reject(err);
              return;
            }
            fs.renameSync(temporary, destination);
            resolve({ bytes, contentType });
          });
        });
        response.pipe(file);
      });

      req.setTimeout(timeoutMs, () => {
        req.destroy(new Error('Image download timed out.'));
      });
      req.on('error', err => {
        cleanup();
        reject(err);
      });
    });
  }

  cleanup();
  return request(source, 0);
}

module.exports = { downloadImage };
