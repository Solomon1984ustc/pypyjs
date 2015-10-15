//
// A very minimal testsuite for the PyPy.js shell code.
// We should do something a lot nicer than this...
//
if (typeof pypyjs === 'undefined') {
  if (typeof require !== 'undefined') {
    pypyjs = require('../pypyjs.js');
  } else if (typeof loadRelativeToScript !== 'undefined') {
    loadRelativeToScript('../pypyjs.js');
  } else if (typeof load !== 'undefined') {
    load('pypyjs.js');
  }
}

let log;
if (typeof console !== 'undefined') {
  log = console.log.bind(console);
} else {
  log = print;
}
const toByteArray = function toByteArray(str) {
  const byteArray = [];
  for (let i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) <= 0x7F) {
      byteArray.push(str.charCodeAt(i));
    } else {
      const h = encodeURIComponent(str.charAt(i)).substr(1).split('%');
      for (let j = 0; j < h.length; j++) {
        byteArray.push(parseInt(h[j], 16));
      }
    }
  }

  return byteArray;
};

let stdinBuffer = [];

const vm = new pypyjs({
  stdin: function stdin() {
    if (stdinBuffer.length > 0) {
      return stdinBuffer.pop();
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        const input = toByteArray('test\n');
        input.push(null);
        input.reverse();
        stdinBuffer = input;
        resolve(stdinBuffer.pop());
      }, 1000);
    });
  }
});

let gp; // eslint-disable-line no-unused-vars

const pypyjsTestResult = vm.ready() // eslint-disable-line no-unused-vars

// First, check that python-level errors will actually fail the tests.
.then(() => vm.exec('raise ValueError(42)'))
.then(() => { throw new Error('Python exception did not trigger js Error'); },
(err) => {
  if (!err instanceof pypyjs.Error) {
    throw new Error('Python exception didn\'t trigger vm.Error instance');
  }
  if (err.name !== 'ValueError' || err.message !== '42') {
    throw new Error('Python exception didn\'t trigger correct error info');
  }
})

// Check that the basic set-exec-get cycle works correctly.
.then(() => vm.set('x', 7))
.then(() => vm.exec('x = x * 2'))
.then(() => vm.get('x'))
.then((x) => {
  if (x !== 14) {
    throw new Error('set-exec-get cycle failed');
  }
})

// Check that eval() works correctly.
.then(() => vm.eval('x + 1'))
.then((x) => {
  if (x !== 15) {
    throw new Error('eval failed');
  }
})
.then(() => vm.exec('from time import sleep; sleep(1)'))
.then(() => {
  const test = [
    'from time import sleep',
    'def Test():',
    '    sleep(1)',
    '',
    'Test()',
    'class Test2:',
    '    def __init__(self):',
    '        sleep(1)',
    '    def sleepy(self):',
    '        sleep(1)',
    '',
    'a = Test2()',
    'a.sleepy()',
    '',
    'usleep = lambda x: sleep(x/1000000.0)',
    'usleep(100) #sleep during 100μs',
    '',
  ].join('\r\n');

  return vm.exec(test);
}).then(() => {
  const test = [
    'from time import sleep',
    '',
    'def sleep_decorator(function):',
    '',
    '    def wrapper(*args, **kwargs):',
    '        sleep(2)',
    '        return function(*args, **kwargs)',
    '    return wrapper',
    '',
    '@sleep_decorator',
    'def print_number(num):',
    '    return num',
    '',
    'print print_number(222)',
    '',
    'for x in range(1,6):',
    '    print print_number(x)',
    '',
  ].join('\r\n');

  return vm.exec(test);
})
.then(() => {
  gp = () => {
    return new Promise((resolve) => {
      setTimeout(() => resolve('test'), 1000);
    });
  };

  const test = [
    'import js',
    'from time import time',
    '',
    'print time()',
    'get_promise = js.eval(\'gp\')',
    'promise = get_promise()',
    'res = js.await(promise)',
    'print time()',
    'print res',
    'assert res == \'test\'',
  ].join('\r\n');

  return vm.exec(test);
})
.then(() => {
  gp = () => {
    return new Promise((resolve, reject) => {
      setTimeout(() => reject(new Error('test!')), 1000);
    });
  };

  const test = [
    'import js',
    'from time import time',
    '',
    'print time()',
    'get_promise = js.eval(\'gp\')',
    'promise = get_promise()',
    'res = js.await(promise)',
    'print time()',
  ].join('\r\n');

  return vm.exec(test);
}).then(() => {
  throw new Error('Python exception did not trigger js Error');
},
(err) => {
  if (!err instanceof pypyjs.Error) {
    throw new Error('Python exception didn\'t trigger vm.Error instance');
  }

  if (err.name !== 'Error' || err.message !== 'Error: test!') {
    console.log(err);
    throw new Error('Python exception didn\'t trigger correct error info');
  }
})
// Check that we can read non-existent names and get 'undefined'
.then(() => vm.get('nonExistentName'))
.then((x) => {
  if (typeof x !== 'undefined') {
    throw new Error('name should have been undefined');
  }
})
// - for globals()
.then(() => vm.get('nonExistentName', true))
.then((x) => {
  if (typeof x !== 'undefined') {
    throw new Error('name should have been undefined');
  }
})

// Check that get() propagates errors other than involved in getting the variable.
.then(() => vm.get('__name__ + 5'))
.then(() => null, (exc) => {
  if (typeof exc === 'undefined') {
    throw new Error('expected to receive an exception');
  } else if (exc.name !== 'TypeError') {
    throw new Error('expected to receive a TypeError');
  }
})

// Check that we execute in correctly-__name__'d python scope.
.then(() => vm.exec('assert __name__ == \'__main__\', __name__'))

// Check that sys.platform tells us something sensible.
.then(() => vm.exec('import sys; assert sys.platform == \'js\''))

// Check that multi-line exec will work correctly.
.then(() => vm.exec('x = 2\ny = x * 3'))
.then(() => vm.get('y'))
.then((y) => {
  if (y !== 6) {
    throw new Error('multi-line exec didn\'t work');
  }
})

// Check that multi-import statements will work correctly.
.then(() => vm.exec('import os\nimport time\nimport sys\nx=time.time()'))

// Check that multi-import statements will work correctly.
.then(() => vm.exec('import os\nimport time\nimport sys\nx=time.time()'))
.then(() => vm.get('x'))
.then((x) => {
  if (!x) {
    throw new Error('multi-line import didn\'t work');
  }
})
// add module from js that imports modules
.then(() => {
  return vm.addFileWithContent(`
import time
import sys
import os
assert time.time() > 0`, 'testmodule.py').then(() => vm.exec('import testmodule', { file: 'main.py' }));
})
.then(() => {
  return vm.addFile('tests/test_module.py', 'test_module.py').then(() => vm.exec('import test_module', { file: 'main.py' } ));
})
.then(() => {
  return vm.addFile('tests/test_module.py')
      .then(() => vm.addFileWithContent('#dud', 'tests/__init__.py'))
      .then(() => vm.exec('import tests', { file: 'main.py' } ));
})
.then(() => {
  const test = [
    'a = raw_input()',
    'print a',
    'assert a == \'test\'',
  ].join('\r\n');
  return vm.exec(test);
})
// Check that you can create additional VMs using `new`
.then(() => {
  const vm2 = new pypyjs();
  return vm2.exec('x = 17')
        .then(() => vm2.get('x'))
        .then((x) => {
          if (x !== 17) {
            throw new Error('newly-created VM didn\'t work right');
          }
        })
        .then(() => vm2.get('y'))
        .then((y) => {
          if (typeof y !== 'undefined') {
            throw new Error('name should have been undefined in new VM');
          }
        })
        .then(() => vm2.reInit())
        .then(() => vm2.get('x'))
        .then((x) => {
          if (typeof x !== 'undefined') {
            throw new Error('name should have been undefined in new VM');
          }
        });
})

// Report success or failure at the end of the chain.
.then(() => {
  log('TESTS PASSED!');
},
(err) => {
  log('TESTS FAILED!');
  log(err);
  throw err;
});
