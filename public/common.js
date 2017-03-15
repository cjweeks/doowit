
Date.prototype.yyyymmdd = function() {
    var mm = this.getMonth() + 1;
    var dd = this.getDate();

    return [
        this.getFullYear(),
        (mm > 9 ? '' : '0') + mm,
        (dd > 9 ? '' : '0') + dd
    ].join('');
};

var entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
};
function escapeHtml(string) {
    return String(string).replace(/[&<>"'`=\/]/g, function (s) {
        return entityMap[s];
    });
}

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
        var data = '<span class="task-text">' + escapeHtml(tasks[i].text) +
            '<span class="text-muted date"> &ndash; ' + new Date(tasks[i].date).toDateString() +'</span></span>';

        var footer = '<div class="delete-task-btn-container">' +
            '<button type="button" class="close remove-task-btn" aria-label="Delete Task">' +
            '<span aria-hidden="true">&times;</span></button></div></li>';

        $('#tasks').prepend(header + data + footer);
    }
}