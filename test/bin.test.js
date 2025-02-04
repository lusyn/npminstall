'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const readJSON = require('../lib/utils').readJSON;
const npminstall = require('./npminstall');
const helper = require('./helper');

describe('test/bin.test.js', () => {
  const root = helper.fixtures('bin');
  const cleanup = helper.cleanup(root);

  beforeEach(cleanup);
  afterEach(cleanup);

  it('should create bins after install', async () => {
    await npminstall({
      root,
    });
    const pkg = await readJSON(path.join(root, 'node_modules', 'yo', 'package.json'));
    assert.equal(pkg.name, 'yo');
    assert.equal(pkg.version, '1.6.0');
    assert(fs.existsSync(path.join(root, 'node_modules', '.bin', 'yo')));
  });

  it('should create bin folders for scoped pkg', async () => {
    await npminstall({
      root,
      pkgs: [
        { name: '@bigfunger/decompress-zip' },
      ],
    });
    const pkg = await readJSON(path.join(root, 'node_modules', '@bigfunger/decompress-zip', 'package.json'));
    assert(pkg.name === '@bigfunger/decompress-zip');
    assert(fs.existsSync(path.join(root, 'node_modules', '.bin', 'decompress-zip')));
  });

  it('fix windows hashbang', async () => {
    const pkgs = [
      { version: '../windows-shebang', type: 'local' },
      { version: '0.13.0', name: 'jscodeshift' },
    ];
    await npminstall({
      root,
      pkgs,
    });
    const pkg = await readJSON(path.join(root, 'node_modules', 'windows-shebang', 'package.json'));
    assert.equal(pkg.name, 'windows-shebang');
    assert.equal(pkg.version, '1.0.0');
    // chmod `755` cannot work in win32 😂 always return `666`
    if (process.platform !== 'win32') {
      assert.equal(
        fs.readFileSync(path.join(root, 'node_modules/.bin/crlf'), 'utf-8'),
        '#!/usr/bin/env node\nconsole.log(\'crlf\');\r\n'
      );
      assert.equal(
        fs.readFileSync(path.join(root, 'node_modules/.bin/lf'), 'utf-8'),
        '#!/usr/bin/env node\nconsole.log(\'lf\');\n'
      );
      // make sense for `jscodeshift`
      assert(
        fs.readFileSync(path.join(root, 'node_modules/.bin/jscodeshift'), 'utf-8').startsWith(
          '#!/usr/bin/env node\n'
        )
      );

      assert.equal(
        fs.statSync(path.join(root, 'node_modules/.bin/crlf')).mode.toString(8),
        '100755'
      );
      assert.equal(
        fs.statSync(path.join(root, 'node_modules/.bin/lf')).mode.toString(8),
        '100755'
      );
      assert.equal(
        fs.statSync(path.join(root, 'node_modules/.bin/jscodeshift')).mode.toString(8),
        '100755'
      );
    } else {
      assert(
        fs.readFileSync(path.join(root, 'node_modules/windows-shebang/bin/crlf.js'), 'utf-8').startsWith(
          '#!/usr/bin/env node\n'
        )
      );
      assert(
        fs.readFileSync(path.join(root, 'node_modules/windows-shebang/bin/lf.js'), 'utf-8').startsWith(
          '#!/usr/bin/env node\n'
        )
      );
      // make sense for `jscodeshift`
      assert(
        fs.readFileSync(path.join(root, 'node_modules/jscodeshift/bin/jscodeshift.js'), 'utf-8').startsWith(
          '#!/usr/bin/env node\n'
        )
      );
    }
  });
});
