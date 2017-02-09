var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
var port = process.env.PORT || 8080;
var io = require('socket.io')(server);
var MIN_DISPLAY_TASKS = 18;
var mysql = require('mysql');

var pool = mysql.createPool({
    connectionLimit: 50,
    host: 'localhost',
    user: 'root',
    password: 'testpassword',
    database: 'doowit',
    debug: false
});

function databaseOperation(clientSocket, queryString, args, callback) {
    callback = callback || function () {};
    pool.getConnection(function(error, connection){
        if (error) {
            throw error;
        }
        connection.query(queryString, args, function(error, response){
            connection.release();
            callback(clientSocket, error, response);
        });

        connection.on('error', function(error) {
            throw error;
        });
    });
}

function sendTasks(clientSocket, error) {
    if (error) {
        throw error;
    }
    databaseOperation(
        clientSocket,
        'select count(*) as numTasks from ' +
        '(select * from tasks where taskId >=' +
        '(select min(taskId) from tasks where completed = 0)) as T',
        '',
        function (clientSocket, error, result) {
            if (error) {
                throw error;
            }
            var numTasks = Math.max(result[0].numTasks, MIN_DISPLAY_TASKS);
            databaseOperation(
                clientSocket,
                'select * from (select * from tasks order by taskId desc limit ?) limited order by taskId',
                [numTasks],
                function (clientSocket, error, tasks) {
                    if (error) {
                        throw error;
                    }
                    clientSocket.emit('server-update', tasks);
                }
            );
        }
    );
}

function addTask(clientSocket, taskText, taskDate) {
    var task = {
        text: taskText,
        date: taskDate,
        completed: false
    };
    databaseOperation(clientSocket, 'insert into tasks set ?', task, sendTasks);
}

function alterCompleted(clientSocket, taskId, completed) {
    completed = completed ? 1 : 0;
    databaseOperation(clientSocket, 'update tasks set completed = ? where taskId = ?', [completed, taskId], sendTasks);
}

function removeTask(clientSocket, taskId) {
    databaseOperation(clientSocket, 'delete from tasks where taskId = ?', taskId, sendTasks);
}

// handle express logic
// send index on request for '/'
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

// send public files on request
app.use('/public', express.static(__dirname + '/public'));

// start the server
server.listen(port, function () {
    console.log('Started server on ' + port);
});

// handle the socket connection
io.on('connection', function (clientSocket) {
    // send an initial task list

    sendTasks(clientSocket);
    // send the array of posts to the client who requested it
    clientSocket.on('get-tasks', function() {
        sendTasks(clientSocket);
    });

    // when a task is added, update the array of tasks and broadcast an update to each client
    clientSocket.on('add-task', function (data) {
        addTask(clientSocket, data.text, data.date);

    });

    // when a task is added, update the array of tasks and broadcast an update to each client
    clientSocket.on('remove-task', function (taskId) {
        removeTask(clientSocket, taskId);
    });

    clientSocket.on('alter-completed', function (data) {
        alterCompleted(clientSocket, data.taskId, data.completed);
    });
});
