


Date.prototype.yyyymmdd = function() {
    var mm = this.getMonth() + 1;
    var dd = this.getDate();

    return [
        this.getFullYear(),
        (mm > 9 ? '' : '0') + mm,
        (dd > 9 ? '' : '0') + dd
    ].join('');
};

function renderTasks(tasks) {
    console.log(tasks);
    if (!tasks.length) {
        return;
    }
    var textHighlightClass = '';
    if (tasks[0].completed) {
        textHighlightClass = 'list-group-item-success'
    }
    var checkboxHighlightClass = '';
    if (tasks[0].completed) {
        checkboxHighlightClass = 'list-group-item-success'
    }

    var notCompletedReached = false;

    for (var i = 0; i < tasks.length; i++) {
        var checkboxStatus = '';
        if (tasks[i].completed) {
            checkboxStatus = 'active';
        }
        checkboxHighlightClass = '';
        if (notCompletedReached && tasks[i].completed) {
            checkboxHighlightClass = 'list-group-item-success';
        } else if (!notCompletedReached && !tasks[i].completed) {
            textHighlightClass = '';
            checkboxHighlightClass = 'list-group-item-danger';
            notCompletedReached = true;
        }
        var header = '<li class="list-group-item no-padding ' +
            textHighlightClass +'" id="' + tasks[i].taskId + '"> \<' +
            'div class="btn-group ' + checkboxHighlightClass + '" data-toggle="buttons">' +
            '<label class="btn list-btn check-label ' + checkboxStatus + '">' +
            '<input type="checkbox" autocomplete="off" class="task-checkbox">' +
            '<span class="glyphicon glyphicon-ok"></span></label></div>';
        var data = '<span class="task-text">' + tasks[i].text +
            '<span class="text-muted date"> &ndash; ' + new Date(tasks[i].date).toDateString() +'</span></span>';

        var footer = '<div class="delete-task-btn-container">' +
            '<button type="button" class="close remove-task-btn" aria-label="Delete Task">' +
            '<span aria-hidden="true">&times;</span>' +
            '</button>' +
            '</div>' +
            '</li>';

        $('#tasks').prepend(header + data + footer);
    }
}

$(document).ready(function () {

    // connect to the server through socket.io
    var socket = io();

    socket.on('server-update', function (data) {
        // clear the list of posts before rewriting
        $('#tasks').empty();
        // iterate through the list of posts, rendering each post
        renderTasks(data);
    });

    $('#add-task-modal').on('shown.bs.modal', function() {
        console.log('focusing...');
        $('#task-description').focus();
    });

    $('#add-task-submit-btn').click(function (event) {

        // prevent form submission
        event.preventDefault();

        socket.emit('add-task', {
            text: document.getElementById('task-description').value,
            date: new Date().yyyymmdd()
        })
    });

    // send post request for new song
    $('#tasks').on('click', '.remove-task-btn', function(event) {
        console.log('got click');
        var taskIdString = $(this).closest('li').attr('id');
        var taskId = parseInt(taskIdString);
        console.log(taskId);
        if (taskId) {
            socket.emit('remove-task', taskId);
        }
    });

    // send post request for new song
    $('#tasks').on('click', '.check-label', function(event) {

        var state = $(this).closest('label').hasClass('active');
        console.log('got click for check; state is ' + state);

        var taskIdString = $(this).closest('li').attr('id');
        var taskId = parseInt(taskIdString);
        console.log(taskId);
        if (taskId) {
            socket.emit('alter-completed', {
                taskId: taskId,
                completed: !state
            });
        }
    });
});