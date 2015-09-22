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
        $('#abilityButton1').children().attr('src', parseAbilityToImage(characterData.skills[0]));
        $('#abilityButton1').data('data-tooltip', parseAbilityTooltip(characterData.skills[0], characterData.talents[0]));
        $('#abilityButton1').data('data-spellname', parseAbilityToName(characterData.skills[0]));
        $('#abilityButton2').children().attr('src', parseAbilityToImage(characterData.skills[1]));
        $('#abilityButton2').data('data-tooltip', parseAbilityTooltip(characterData.skills[1], characterData.talents[1]));
        $('#abilityButton2').data('data-spellname', parseAbilityToName(characterData.skills[1]));
        $('#abilityButton3').children().attr('src', parseAbilityToImage(characterData.skills[2]));
        $('#abilityButton3').data('data-tooltip', parseAbilityTooltip(characterData.skills[2], characterData.talents[2]));
        $('#abilityButton3').data('data-spellname', parseAbilityToName(characterData.skills[2]));
        $('#abilityButton4').children().attr('src', parseAbilityToImage(characterData.skills[3]));
        $('#abilityButton4').data('data-tooltip', parseAbilityTooltip(characterData.skills[3], characterData.talents[3]));
        $('#abilityButton4').data('data-spellname', parseAbilityToName(characterData.skills[3]));
        $('#passiveAbility').children().attr('src', parseAbilityToImage(characterData.skills[4]));
        $('#passiveAbility').data('data-tooltip', parseAbilityTooltip(characterData.skills[4], characterData.talents[4]));
        $('#passiveAbility').data('data-spellname', parseAbilityToName(characterData.skills[4]));
    }

    function parseAbilityToImage(ability) {
        switch (ability) {
            case 'TestSpell_1':
                return 'img/icons/ability/TestSpell_1.png';
            case 'TestSpell_2':
                return 'img/icons/ability/TestSpell_1.png';
            case 'TestSpell_3':
                return 'img/icons/ability/TestSpell_1.png';
            case 'TestSpell_4':
                return 'img/icons/ability/TestSpell_1.png';
            case 'TestPassive':
                return 'img/icons/ability/TestSpell_1.png';
        }
    }

    function parseAbilityTooltip(ability, talentPoints) {
        switch (ability) {
            case 'TestSpell_1':
                return dr2.helper.tooltips['TestSpell_1'].format(1*talentPoints);
            case 'TestSpell_2':
                return dr2.helper.tooltips['TestSpell_2'].format(1*talentPoints);
            case 'TestSpell_3':
                return dr2.helper.tooltips['TestSpell_3'].format(1*talentPoints);
            case 'TestSpell_4':
                return dr2.helper.tooltips['TestSpell_4'].format(1*talentPoints);
            case 'TestPassive':
                return dr2.helper.tooltips['TestPassive'].format(1*talentPoints);
        }
    }

    function parseAbilityToName(ability) {
        switch (ability) {
            case 'TestSpell_1':
                return 'Test Spell 1';
            case 'TestSpell_2':
                return 'Test Spell 2';
            case 'TestSpell_3':
                return 'Test Spell 3';
            case 'TestSpell_4':
                return 'Test Spell 4';
            case 'TestPassive':
                return 'Test Passive';
        }
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

    dr2 = {};
    dr2.helper = {};
    dr2.helper.tooltips = {
        'TestSpell_1': 'This is a Test Spell. It does {0} damage. Moo.',
        'TestSpell_2': 'This is a Test Spell. It does {0} damage. Moo.',
        'TestSpell_3': 'This is a Test Spell. It does {0} damage. Moo.',
        'TestSpell_4': 'This is a Test Spell. It does {0} damage. Moo.',
        'TestPassive': 'This is a Test Passive. I care about {0} percent.'
    };

    $('[id^=abilityButton]').on('mouseenter', function(event) {
        if (event.target.id == null || event.target.id == '') {

        } else {
            console.log(event.target.id);
            console.log($('#' + event.target.id).data('data-tooltip'));
            $('#tooltipData').html('<strong>' + $('#' + event.target.id).data('data-spellname') + ':</strong> ' + $('#' + event.target.id).data('data-tooltip'));
        }
    });

    $('#passiveAbility').on('mouseenter', function(event) {
        if (event.target.id == null || event.target.id == '') {

        } else {
            console.log(event.target.id);
            console.log($('#' + event.target.id).data('data-tooltip'));
            $('#tooltipData').html('<strong>' + $('#' + event.target.id).data('data-spellname') + ':</strong> ' + $('#' + event.target.id).data('data-tooltip'));
        }
    });


    /* Shims */

    if (!String.prototype.format) {
        String.prototype.format = function() {
            var args = arguments;
            return this.replace(/{(\d+)}/g, function(match, number) {
                return typeof args[number] != 'undefined'
                    ? args[number]
                    : match
                    ;
            });
        };
    }
})();