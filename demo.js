var
    spawn = require('child_process').spawn,
    python  = spawn('python');

python.stdin.write('print ("a")');
python.stdin.end();

python.stdout.on('data', function (data) {
        console.log(data.toString());
});
