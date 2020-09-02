$(document).ready(function() {
    $('#files').bind('change', handleDialog);
    if(localStorage.getItem('schedule')) {
        start_schedules();
    }
});

Date.prototype.workingDaysFrom=function(fromDate){
    // ensure that the argument is a valid and past date
    if(!fromDate||isNaN(fromDate)||this<fromDate){return -1;}
    
    // clone date to avoid messing up original date and time
    var frD=new Date(fromDate.getTime()),
        toD=new Date(this.getTime()),
        numOfWorkingDays=1;
    
    // reset time portion
    frD.setHours(0,0,0,0);
    toD.setHours(0,0,0,0);
    
    while(frD<toD){
     frD.setDate(frD.getDate()+1);
     var day=frD.getDay();
     if(day!=0&&day!=6){numOfWorkingDays++;}
    }
    return numOfWorkingDays - 1;
   };

function start_schedules() {
    var template = `
    <div class="schedule">
        <div class="name"></div>
        <div class="middle-info">
            <div class="middle-top">Currently in</div>
            <div class="middle-middle"></div>
            <div class="middle-bottom"></div>
        </div>
        <div class="bottom-info"></div>
    </div>

    `
    var today = new Date();

    if (localStorage.getItem("start_day")) {
        var start_day = new Date(localStorage.getItem("start_day"));
        console.log(start_day, today);
        localStorage.setItem("day_count", today.workingDaysFrom(start_day).toString());
    }

    var flex_box = document.getElementById("main_box");
    var data = JSON.parse(localStorage.getItem("schedule"));
    console.log(data);
    flex_box.innerHTML = "";
    for (var i = 0; i < data.length; i++) {
        flex_box.innerHTML += template;
    }

    var names = document.getElementsByClassName("name");

    for (var i = 0; i < names.length; i++) {
        names[i].innerHTML = data[i][0];
    }

    startTime();
}

function startTime() {
    var today = new Date();
    var today_milliseconds = toSecondsFromDate(today);

    var middles = document.getElementsByClassName("middle-middle");
    var bottoms = document.getElementsByClassName("middle-bottom");
    var nexts = document.getElementsByClassName("bottom-info");
    var data = JSON.parse(localStorage.getItem("schedule"));

    for (var i = 0; i < data.length; i++) { 
        var day = parseInt(localStorage.getItem("day_count")) % data[i][1].length;
        for (var j = 0; j < data[i][1][day].length; j++) {
            var time_period_milliseconds = toSecondsFromString(data[i][1][day][j][0]);
                    
            if (today_milliseconds > time_period_milliseconds) {
                // Set block name
                if (j == 0) {
                    var yesterday = Math.abs(parseInt(localStorage.getItem("day_count")) - 1) % data[i][1].length;

                    middles[i].innerHTML = data[i][1][yesterday][j][1];
                } else {
                    middles[i].innerHTML = data[i][1][day][j][1];
                }

                // Set time left and next period
                if (j == data[i][1][day].length - 1) {
                    var tomorrow = Math.abs(parseInt(localStorage.getItem("day_count")) + 1) % data[i][1].length;
                    
                    var next_period = [toSecondsFromString(data[i][1][tomorrow][0][0]), data[i][1][tomorrow][0][1]];

                    var difference = Math.abs(today_milliseconds - (next_period[0] + 86400000));
                } else {
                    var next_period = [toSecondsFromString(data[i][1][day][j + 1][0]), data[i][1][day][j + 1][1]];

                    var difference = Math.abs(today_milliseconds - next_period[0]);
                }

                bottoms[i].innerHTML = getYoutubeLikeToDisplay(difference) + " left";
                nexts[i].innerHTML = "Next is:<br>" + next_period[1];

            }
        }
    }

    document.getElementById('top-time').innerHTML = today.toLocaleTimeString('en-US');

    var t = setTimeout(startTime, 500);
}

function handleDialog(event) {
    var files = event.target.files;
    var file = files[0];

    var reader = new FileReader();
    reader.readAsText(file);

    reader.onload = function(event){
        var csv = event.target.result;
        var data = $.csv.toArrays(csv);

        var current_name = "";
        var is_name = true;
        var split_data = [];
        var temp_data = [];

        localStorage.setItem("start_day", new Date(data[0]));
        localStorage.setItem("day_count", "0");

        for (var i = 1; i < data.length; i++) {
            is_name = true;
            
            for (var j = 1; j < data[i].length; j++) {
                if (data[i][j] != "") {
                    is_name = false;
                }
            }

            if (is_name == true) {
                current_name = data[i][0];
                split_data.push([current_name]);
                var row_length = 0;
                
                if (split_data.length > 1) {
                    split_data[split_data.length - 2].push(temp_data);
                    temp_data = [];
                }
                
                for (var k = 0; k < data[i + 1].length; k++) {
                    if (data[i + 1][k] != "") {
                        row_length++;
                    }
                }
                console.log(row_length);
                for (var k = 0; k < row_length/2; k++) {
                    //Create days
                    temp_data.push([]);
                }
                
            } else {
                for (var k = 0; k < row_length; k = k + 2) {
                    if (data[i][k] != "") {
                        temp_data[k/2].push([data[i][k], data[i][k + 1]]);  
                    }
                }
                
            }
        }

        split_data[split_data.length - 1].push(temp_data);

        localStorage.setItem('schedule', JSON.stringify(split_data, null, 2));

        start_schedules();
    }
}

function workingDaysBetweenDates(startDate, endDate) {
    startDate = new Date(startDate);
    endDate = new Date(endDate);
    // Validate input
    if (endDate < startDate)
        return 0;
    
    // Calculate days between dates
    var millisecondsPerDay = 86400 * 1000; // Day in milliseconds
    startDate.setHours(0,0,0,1);  // Start just after midnight
    endDate.setHours(23,59,59,999);  // End just before midnight
    var diff = endDate - startDate;  // Milliseconds between datetime objects    
    var days = Math.ceil(diff / millisecondsPerDay);
    
    // Subtract two weekend days for every week in between
    var weeks = Math.floor(days / 7);
    days = days - (weeks * 2);

    // Handle special cases
    var startDay = startDate.getDay();
    var endDay = endDate.getDay();
    
    // Remove weekend not previously removed.   
    if (startDay - endDay > 0){
        days = days - 2;  
    }     
            
    
    // Remove start day if span starts on Sunday but ends before Saturday
    if (startDay == 0 && endDay != 6) {
        days = days - 1;
    }
        
            
    // Remove end day if span ends on Saturday but starts after Sunday
    if (endDay == 6 && startDay != 0) {
        days = days - 1;
    }

    return days - 1;
}


function getYoutubeLikeToDisplay(millisec) {
    var seconds = (millisec / 1000).toFixed(0);
    var minutes = Math.floor(seconds / 60);
    var hours = "";
    if (minutes > 59) {
        hours = Math.floor(minutes / 60);
        hours = (hours >= 10) ? hours : "0" + hours;
        minutes = minutes - (hours * 60);
        minutes = (minutes >= 10) ? minutes : "0" + minutes;
    }

    seconds = Math.floor(seconds % 60);
    seconds = (seconds >= 10) ? seconds : "0" + seconds;
    if (hours != "") {
        return hours + ":" + minutes + ":" + seconds;
    }
    return minutes + ":" + seconds;
}

function toSecondsFromDate(date) {
    var date = new Date(date);
    return (date.getHours() * 3600000) + (date.getMinutes() * 60000) + (date.getSeconds() * 1000);
}

function toSecondsFromString(string) {
    var h = parseInt(string.slice(0, 2));
    var m = parseInt(string.slice(3, 5));
    var s = parseInt(string.slice(6, 8));
    var ampm = string.slice(9, 11);

    if (h == 12) {
        h = 0;
    } 

    var out = (h * 3600000) + (m * 60000) + (s * 1000);

    if (ampm == "PM") {
        out += 12 * 3600000;
    }

    return out;
}