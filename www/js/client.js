(function(){

    var socket = io();

    socket.on('connect', function() {
        console.log('Fetching Character Data');
        socket.emit('fetchData', document.cookie);
    });

    socket.on('createCharacter', function() {
        $('#characterCreation').modal('toggle');
    });

    $('#chatInput').submit(function(){
        socket.emit('chat message', $('#chatMessage').val());
        $('#chatMessage').val('');
        return false;
    });

    socket.on('chat message', function(msg){
        $('#chatMessages').append($('<li>').text(msg));
        var objDiv = document.getElementById("chatMessages");
        objDiv.scrollTop = objDiv.scrollHeight;
    });

})();