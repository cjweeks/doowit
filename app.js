var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
var port = process.env.PORT || 8080;
var io = require('socket.io')(server);
var posts = [];

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

/**
 * A task is comprised of the following:
 * {
 *      taskId: integer,
 *      text: "task text here",
 *      date: "date when task was added",
 *      completed: boolean
 * }
 *
 * @type {Array}
 */
var tasks = [];

function alterCompleted(taskId, completed) {
    for (var i = 0; i < tasks.length; i++) {
        if (tasks[i].taskId == taskId) {
            tasks[i].completed = completed;
            return;
        }
    }
}

function addTask(taskText, taskDate) {
    var taskId = 1;
    if (tasks.length) {
        taskId = tasks[tasks.length - 1].taskId + 1;
    }
    tasks.push({
        taskId: taskId,
        text: taskText,
        date: taskDate,
        completed: false
    });
    console.log('Adding task ' + taskId + ' with description "' + taskText + '"');

}

function removeTask(taskId) {
    for (var i = 0; i < tasks.length; i++) {
        if (tasks[i].taskId == taskId) {
            // remove the matching task
            tasks.splice(i, 1);
            return;
        }
    }
}

function getDisplayTasks() {
    var maxTasks = 18;
    if (tasks.length <= maxTasks) {
        return tasks;
    }

    // find least recent
    var leastRecentTaskIndex = 0;
    for (var i = 0; i < tasks.length; i++) {
        if (!tasks[i].completed) {
            leastRecentTaskIndex = i;
            break;
        }
    }

    return tasks.slice(tasks.length - Math.max(maxTasks, leastRecentTaskIndex), tasks.length);
}

// handle the socket connection
io.on('connection', function (clientSocket) {
    // send an initial task list

    io.sockets.emit('server-update', getDisplayTasks());
    // send the array of posts to the client who requested it
    clientSocket.on('get-tasks', function() {
        clientSocket.emit('server-update', getDisplayTasks());
    });

    // when a task is added, update the array of tasks and broadcast an update to each client
    clientSocket.on('add-task', function (data) {
        addTask(data.text, data.date);
        io.sockets.emit('server-update', getDisplayTasks());
    });

    // when a task is added, update the array of tasks and broadcast an update to each client
    clientSocket.on('remove-task', function (taskId) {
        console.log('Removing ' + taskId);
        removeTask(taskId);
        io.sockets.emit('server-update', getDisplayTasks());
    });

    clientSocket.on('alter-completed', function (data) {
        alterCompleted(data.taskId, data.completed);
        io.sockets.emit('server-update', getDisplayTasks());
    });
});
