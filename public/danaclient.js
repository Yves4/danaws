// Global (sorry) queueu van vraag/antwoord pairs
qa = [];

function showqalist( qa )
{
    console.log(JSON.stringify(qa));
    while( qa.length > 8 ) qa.shift();
    $("#msgs").empty();
    for( i = 0; i < qa.length; i++ )
    {
        // <br> blijkt nodig anders lopen vraag en antwoordregels over elkaar heen
        $("#msgs").append( "<li class=\"msg " + qa[i][0] + "\">" + qa[i][1] + "</li><p/>\n");
    }
}

function addqalist( qa, type, msg )
{
    qa.push([type,msg]);
}

$(document).ready(function(){

    var socket = io();

    // Trigger welcome!
    socket.emit('msg', {message: 'hi'});

    $("#message").focus();

    $("#commandtext").submit( function( event ) {
        event.preventDefault();

        var msg = $("#message").val();
        if(msg)
        {
            socket.emit('msg', {message: msg});

            addqalist(qa,"question",msg);
            showqalist(qa);
            $("#message").val("");
        }
    });

    socket.on('msg', function(data){
        addqalist(qa,"answer",data.message);
        showqalist(qa);
    });
});
