var vm = new pypyjs({
  stdout: (function() {
    var buffer = [];
    return function(data) {
      for (var i = 0; i < data.length; i++) {
        var x = data.charAt(i);
        if (x !== "\n") {
          buffer.push(x);
        } else {
          $('#out').text($('#out').text() + buffer.join("") + "\n");
          buffer.splice(undefined, buffer.length);
        }
      }
    }
  })(),
  stderr: (function() {
    var buffer = [];
    return function(data) {
      for (var i = 0; i < data.length; i++) {
        var x = data.charAt(i);
        if (x !== "\n") {
          buffer.push(x);
        } else {
          $('#out').text($('#out').text() + buffer.join("") + "\n");
          buffer.splice(undefined, buffer.length);
        }
      }
    }
  })(),
  stdin: (function () {
    var buffer = [];
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

    return function () {
      if (buffer.length) {
        return buffer.pop();
      } else {
        return new Promise(function(resolve) {
      	  var inp = window.prompt('>');
          buffer = toByteArray(inp + '\n');
      	  buffer.push(null);
      	  buffer.reverse();
      	  resolve(buffer.pop());
      	});
      }
    }
  })()
});

$('#test').prop('disabled', true);

vm.ready().then(function(){
  console.log('ready!');
  $('#test').prop('disabled', false);
});

window.first = true;
$(function() {
  $('#run').click(function() {
    vm.ready().then(function() {
      return vm.addModule("hw0pr6", $('#code').val());
    }).then(function() {

      var code = [
        "import js",
        "import hw0pr6",
        "if js.eval('window.first'):",
        "    js.eval('window.first = false')",
        "else:",
        "    reload(hw0pr6)"
      ].join("\r\n");

      return vm.exec(code);
    });
  });

  $('#test').click(function() {
    vm.ready().then(function() {
      return vm.addModule("hw0pr6", $('#code').val());
    }).then(function() {

      var code = [
        "from hw0pr6tests import RPS",
        "import unittest",
        "suite = unittest.TestLoader().loadTestsFromTestCase(RPS)",
        "unittest.TextTestRunner(verbosity=2).run(suite)"
      ].join("\r\n");

      return vm.exec(code);
    });
  });
});
