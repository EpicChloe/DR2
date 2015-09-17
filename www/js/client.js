(function(){

    var socket = io(),
        characterData;

    socket.on('connect', function() {
        console.log('Fetching Character Data');
        socket.emit('fetchData', document.cookie);
    });

    socket.on('invalidAccessToken', function() {
        window.location.href = 'client.html?q=IAK';
    });

    socket.on('createCharacter', function() {
        $('#characterCreation').modal('toggle');
    });

    socket.on('pushCharacterData', function(data) {
        characterData = data;
        characterData.inventory = JSON.parse(characterData.inventory);
        characterData.equipment = JSON.parse(characterData.equipment);
        characterData.skills = JSON.parse(characterData.skills);
        characterData.talents = JSON.parse(characterData.talents);
        console.log(characterData);
        updateCharacterInformation();
    });

    socket.on('characterNameTaken', function() {
        console.log('Error: Character Name Taken');
        $('.alertBox').text('Character Creation Failed! Character Name is taken!');
        $('.alertBox').show();
    });

    socket.on('characterCreationSuccess',function() {
        socket.emit('fetchData', document.cookie);
    });

    $('#createCharacter').on('click', function(event) {
        event.preventDefault();
        var data = {
            characterName: $('#CCcharacterName').val(),
            race: $('#CCrace').val(),
            class: $('#CCclass').val(),
            UUID: document.cookie
        };
        socket.emit('creatingCharacter', data);
        console.log('Sending Character Data to Server for creation...');
    });

    /* Chat */

    $('#chatInput').submit(function(){
        socket.emit('chat message', [$('#chatMessage').val(), characterData.class, characterData.name]);
        $('#chatMessage').val('');
        return false;
    });

    socket.on('chat message', function(msg){
        $('#chatMessages').append($('<li>').text(msg));
        var objDiv = document.getElementById("chatMessages");
        objDiv.scrollTop = objDiv.scrollHeight;
    });

    socket.on('updateChatList', function(data) {
        $('#onlineCharacterList').html(data.join('<br>'));
    });

    /* Display */

    function updateCharacterInformation() {
        $('#infoCharacterName').html(characterData.name);
        $('#infoCharacterLevel').html(characterData.level);
        $('#infoCharacterClass').html(parseClass(characterData.class));
        $('#infoCharacterGold').html(characterData.inventory.gold);
        $('#classIcon').attr("src", "img/icons/class/"+characterData.class+'.png');
    }

    function parseClass(cls) {
        switch (cls) {
            case 'brawler':
                return 'Brawler';
            case 'paladin':
                return 'Paladin';
            case 'fireMage':
                return 'Fire Mage';
            case 'archer':
                return 'Archer';
        }
    }

})();