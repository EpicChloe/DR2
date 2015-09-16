(function(){

    var socket = io.connect();

    $('#loginButton').on('click', function(event) {
        event.preventDefault();
        var email = $('#inputEmail').val(),
            pass = $('#inputPassword').val(),
            reg = $('#register').is(':checked');

        console.log(email + ' ' + pass + ' ' + reg);

        socket.emit('loginAttempt', [email, pass, reg]);
    });

    socket.on('loginFailed', function(){
        console.log('Login Failed');
        $('.alertBox').text('Login Failed. Please check your email or password.');
        $('.alertBox').show();
    });

    socket.on('registrationFail', function(){
        console.log('Login Failed');
        $('.alertBox').text('Registration Failed. That Email address is already in use.');
        $('.alertBox').show();
    });

    socket.on('loginSuccess', function(data) {
        document.cookie = data;
        window.location.href = 'client.html';
    });

})();