function startTime() {
    var today = new Date();
    document.getElementById('top-time').innerHTML = today.toLocaleTimeString('en-US');
    var t = setTimeout(startTime, 500);
}

function checkTime(i) {
    if (i < 10) {i = "0" + i};  // add zero in front of numbers < 10
    return i;
}
