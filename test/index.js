import http from 'http';
import assert from 'assert';

import '../src/index.js';

const BASE_URL = 'http://127.0.0.1:' + process.env.PORT;

describe('Paint Server', () => {
  it('should return 200', done => {
    http.get(BASE_URL, res => {
      assert.equal(200, res.statusCode);
      done();
    });
  });
});
