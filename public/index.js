



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
        $('#task-description').focus();
    });

    $('#add-task-submit-btn').click(function (event) {

        // prevent form submission
        event.preventDefault();

        socket.emit('add-task', {
            text: document.getElementById('task-description').value,
            date: new Date().yyyymmdd()
        });
        document.getElementById('task-description').value = '';
        if (!$('#keep-modal-open').checked) {
            $('#add-task-modal').modal('hide');
        }
    });

    var tasks = $('#tasks');

    // add listener for removing a task
    tasks.on('click', '.remove-task-btn', function(event) {
        var taskIdString = $(this).closest('li').attr('id');
        var taskId = parseInt(taskIdString);
        if (taskId) {
            socket.emit('remove-task', taskId);
        }
    });

    // add listener for adding a task
    tasks.on('click', '.check-label', function(event) {
        var state = $(this).closest('label').hasClass('active');
        var taskIdString = $(this).closest('li').attr('id');
        var taskId = parseInt(taskIdString);
        if (taskId) {
            socket.emit('alter-completed', {
                taskId: taskId,
                completed: !state
            });
        }
    });

    $('#add-task-btn').click(function (event) {
        $('#add-task-modal').modal('show');
    });

    $(document).keydown(function (event) {
        var showModalKey = 78; // 'n' key
        if (event.shiftKey && event.which == showModalKey) {
            $('#add-task-modal').modal('show');
        }
    });


    // request initial set of tasks
    socket.emit('get-display-tasks');
});