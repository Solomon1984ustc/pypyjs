var vm = new pypyjs({
  stdout: (function() {
    var buffer = [];
    return function(data) {
      for (var i = 0; i < data.length; i++) {
        var x = data.charAt(i);
        if (x !== "\n") {
          buffer.push(x);
        } else {
          $('#out').text($('#out').text() + buffer.join(""));
          buffer.splice(undefined, buffer.length);
        }
      }
    }
  })()
});
$('#test').prop('disabled', true);

vm.ready(function(){
  $('#test').prop('disabled', false);
});

$(function() {
  $('#test').click(function() {
    vm.inJsModules = {
      "modules/hw0pr6.py": $('#code').val()
    }

    var code = [
      "import hw0pr6tests",
      "import unittest",
      "unittest.main(buffer=false)"
    ].join("\r\n");

    vm.exec(code);
  });
});
