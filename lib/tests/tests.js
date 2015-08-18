//
// A very minimal testsuite for the PyPy.js shell code.
// We should do something a lot nicer than this...
//

if (typeof vm === 'undefined') {
  if (typeof require !== 'undefined') {
    pypyjs = require('../pypyjs.js');
  } else if (typeof loadRelativeToScript !== 'undefined') {
    loadRelativeToScript('../pypyjs.js');
  } else if (typeof load !== 'undefined') {
    load('pypyjs.js');
  }
}

var log;
if (typeof console !== 'undefined') {
  log = console.log.bind(console);
} else {
  log = print;
}

var toByteArray = function(str) {
  var byteArray = [];
  for (var i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) <= 0x7F) {
      byteArray.push(str.charCodeAt(i));
    } else {
      var h = encodeURIComponent(str.charAt(i)).substr(1).split('%');
      for (var j = 0; j < h.length; j++) {
        byteArray.push(parseInt(h[j], 16));
      }
    }
  }
  return byteArray;
};

var stdinBuffer = [];

var vm = new pypyjs({
  stdin: function() {
    if (stdinBuffer.length > 0) {
      return stdinBuffer.pop();
    }

    return new Promise(function(resolve) {
      setTimeout(function() {
        var input = toByteArray('test\n');
        input.push(null);
        input.reverse();
        stdinBuffer = input;
        resolve(stdinBuffer.pop());
      }, 1000);
    });
  }
});

var pypyjsTestResult = vm.ready()

// First, check that python-level errors will actually fail the tests.
.then(function() {
  return vm.exec("raise ValueError(42)");
})
.then(function() {
  throw new Error("Python exception did not trigger js Error");
}, function(err) {
  if (! err instanceof pypyjs.Error) {
    throw new Error("Python exception didn't trigger vm.Error instance");
  }

  if (err.name !== 'ValueError' || err.message !== '42') {
    throw new Error("Python exception didn't trigger correct error info");
  }
})

// Check that the basic set-exec-get cycle works correctly.
.then(function() {
  return vm.set("x", 7);
})
.then(function() {
  return vm.exec("x = x * 2");
})
.then(function() {
  return vm.get("x");
})
.then(function(x) {
  if (x !== 14) {
    throw new Error('set-exec-get cycle failed');
  }
})

// Check that eval() works correctly.
.then(function() {
  return vm.eval("x + 1");
})
.then(function(x) {
  if (x !== 15) {
    throw new Error('eval failed');
  }
})
.then(function() {
  return vm.exec('from time import sleep; sleep(1)');
}).then(function() {
  var test = [
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
}).then(function() {
  var test = [
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
.then(function() {
  gp = function() {
    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        resolve('test');
      }, 1000);
    });
  };

  var test = [
    'import js',
    'from time import time',
    '',
    'print time()',
    "get_promise = js.eval('gp')",
    'promise = get_promise()',
    'res = js.await(promise)',
    'print time()',
    'print res',
    "assert res == 'test'",
  ].join('\r\n');

  return vm.exec(test);
})
.then(function() {
  gp = function() {
    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        reject(new Error('test!'));
      }, 1000);
    });
  };

  var test = [
    'import js',
    'from time import time',
    '',
    'print time()',
    "get_promise = js.eval('gp')",
    'promise = get_promise()',
    'res = js.await(promise)',
    'print time()',
  ].join('\r\n');

  return vm.exec(test);
}).then(function() {
  throw new Error('Python exception did not trigger js Error');
},

function(err) {
  if (!err instanceof pypyjs.Error) {
    throw new Error("Python exception didn't trigger vm.Error instance");
  }

  if (err.name !== 'Error' || err.message !== 'Error: test!') {
    console.log(err);
    throw new Error("Python exception didn't trigger correct error info");
  }
})

// Check that we can read non-existent names and get 'undefined'
.then(function() {
  return vm.get("nonExistentName")
})
.then(function(x) {
  if (typeof x !== 'undefined') {
    throw new Error('name should have been undefined');
  }
})

// Check that we execute in correctly-__name__'d python scope.
.then(function() {
  return vm.exec("assert __name__ == '__main__', __name__")
})

// Check that sys.platform tells us something sensible.
.then(function() {
  return vm.exec("import sys; assert sys.platform == 'js'");
})

// Check that multi-line exec will work correctly.
.then(function() {
  return vm.exec("x = 2\ny = x * 3");
})
.then(function() {
  return vm.get("y")
})
.then(function(y) {
  if (y !== 6) {
    throw new Error("multi-line exec didn't work");
  }
})
.then(function() {
  var test = [
    'a = raw_input()',
    'print a',
    "assert a == 'test'",
  ].join('\r\n');
  return vm.exec(test);
})

// Check that multi-import statements will work correctly.
.then(function() {
  return vm.exec("import os\nimport time\nimport sys\nx=time.time()");
})
.then(function() {
  return vm.exec("import unittest");
})
.then(function() {
  return vm.get("x")
})
.then(function(x) {
  if (!x) {
    throw new Error("multi-line import didn't work");
  }
})

// Check that you can create additional VMs using `new`
.then(function() {
  var vm2 = new pypyjs()
  return vm2.exec("x = 17").then(function() {
    return vm2.get("x")
  }).then(function(x) {
    if (x !== 17) {
      throw new Error("newly-created VM didn't work right")
    }
  }).then(function() {
    return vm2.get("y")
  }).then(function(y) {
    if (typeof y !== "undefined") {
      throw new Error("name should have been undefined in new VM");
    }
  })
})

// Report success or failure at the end of the chain.
.then(function(res) {
  log('TESTS PASSED!');
},

function(err) {
  log('TESTS FAILED!');
  log(err);
  throw err;
});
