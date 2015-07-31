//OVERALL GOALS
var isIE = /*@cc_on!@*/false || !!document.documentMode; // At least IE6

var chart;
var goalsOverall;
var deptsOverall;
var columns = [];
var success = 75,
    danger = 50;

var colorGreen = '#17a397',
    colorYellow= '#fec240',
    colorRed = '#f1635c';

var rawdataDept=[];
var rawByDept=[];
var rawByGoal=[];
var rawComments = [];
var rawdata=[];

var allPeriods = [{period:'2014Q4', description:'Year End Progress'}, {period:'2014Q2', description:'Mid Year Progress'}]
var currPeriod='2014Q4'; //for gauge
var currDept='all'; //for line
var currentComments = [];

/* Data Loading */
d3.csv("data/goals-overall.csv", function(goalDdata){
    goalsOverall=goalDdata;

    d3.csv("data/depts-overall.csv", function(deptsData){
        //Populate dropdown menu: Select Period
        deptsOverall=deptsData;

        //Populate Dropdown Menu
        var periodSelector = document.getElementById('select-period');
        allPeriods.forEach(function(d){
            var opt       = document.createElement('option');
            opt.value     = d.period;
            opt.innerHTML = d.description;
            periodSelector.appendChild(opt);
        })

        //Populate dropdown menu: Select Goal
        var goalSelector = document.getElementById('select-goal');
        for (var i=1; i<=12 ;i++)
        {
            var opt       = document.createElement('option');
            opt.value     = i;
            opt.innerHTML = "Goal " + i;
            goalSelector.appendChild(opt);
        }

        //Populate dropdown menu: Select Department
        var deptSelector = document.getElementById('select-dept');
        deptsOverall.forEach(function(d){
            var opt       = document.createElement('option');
            opt.value     = d.dept;
            opt.innerHTML = d.dept;
            deptSelector.appendChild(opt);
        })

            d3.csv("data/raw6.csv",function(raw6){
                console.log(raw6)
                rawByDept = d3.nest()
                    .key(function(f) { return f.dept; })
                    .key(function(f) { return f.Goal; })
                    .entries(raw6);

                rawByGoal = d3.nest()
                    .key(function(f) { return f.Goal; })
                    .key(function(f) { return f.dept; })
                    .entries(raw6);

//                nest6.sort(function (a, b) {
//                    return a.key -  b.key
//                });
                makeChart(currPeriod);
                updateLine('all');
                updateBar('DESA');

            })

            d3.csv("data/comments.csv",function(commentsData){
                rawComments = d3.nest()
                    .key(function(d) { return d.dept; })
                    .key(function(d) { return d.goal; })
//                    .key(function(d) { return d.comments; })
                    .entries(commentsData);


            })


    });
});

//Gauge
function makeChart(p){
    columns=[];
    goalsOverall.forEach(function(e){
        var tempArr=[];
        tempArr.push(e.id, e[p]);
        columns.push(tempArr)
    })

    var i = 1;
    columns.forEach(function(d){
        var chartname= "chart"+i;
        i++;
        chartname  = c3.generate({
            data: {
                columns: [
                    [ d[0], d[1]]
                ],
                type: 'gauge',
                onclick: function (d, i) { console.log("onclick", d, i); },
                onmouseover: function (d, i) { console.log("onmouseover", d, i); },
                onmouseout: function (d, i) { console.log("onmouseout", d, i); }
            },
            color: {
                pattern: ['#f1635c', '#fec240', '#17a397'], // the three color levels for the percentage values.
                threshold: {
                    values: [danger, success, 100]
                }
            },
            bindto: document.getElementById(d[0])
        });
    })

};

function newPeriod(p){
    currPeriod=p;
    updateGauge(currPeriod, currDept);
}


function updateGauge(p,d){
    columns = [];

    if(d=='all'){
        goalsOverall.forEach(function(e){
//            console.log(e)
            var tempArr=[];
            tempArr.push(e.id, e[p]);
            columns.push(tempArr)
        })
        buildGauges()
    }
    else {
        rawdataDept.forEach(function(r){
            //for the correct dept
            if(r.key == d){

                //for each goal
                r.values.forEach(function(g){

                    //for correct period
                    g.values.forEach(function(h){

                        if(h.key==p){

                            //for each percentage
                            h.values.forEach(function(i){
                                var tempArr= [];
                                tempArr.push("goal"+ g.key, i.key, g.key);
                                columns.push(tempArr);
                            })
                        }
                    })
                })
//                console.log(columns)
                buildGauges()
            }
        })
    }
    findMissingNumbers();
}

function findMissingNumbers(){
    var ref = [];
    var max = 12, i, j;

    //reset
    for (i =1; i <= max; i++) {
        ref.push(i);
    }

    for (i = 0; i < columns.length; i++) {
        for (j = 0; j < ref.length; j++) {
            if (columns[i][2] == ref[j]) {
                ref.splice(j, 1);
                break;
            }
        }
    }

    if (ref.length!=12){
        ref.forEach(function(d){
            var span = document.createElement("p");
            var node = document.createTextNode("Not Applicable");
                span.appendChild(node)
            var height= document.getElementById("goal1").offsetHeight + "px";
            document.getElementById("goal"+d).innerHTML='';
            document.getElementById("goal"+d).appendChild(span);
            document.getElementById("goal"+d).style.height = height;
        });
    }
}

function buildGauges(){
    columns.forEach(function(d){
    chart = c3.generate({
            data: {
                columns: [
                    [ d[0], d[1]]
                ],
                type: 'gauge',
                onclick: function (d, i) { console.log("onclick", d, i); },
                onmouseover: function (d, i) { console.log("onmouseover", d, i); },
                onmouseout: function (d, i) { console.log("onmouseout", d, i); }
            },
            color: {
                pattern: ['#f1635c', '#fec240', '#17a397'], // the three color levels for the percentage values.
                threshold: {
                    values: [danger, success, 100]
                }
            },
            bindto: document.getElementById(d[0])
        });
    })
}




//Line Chart
function updateLine(d){
    var columns = [];
    if(d=='all'){
        //line graph data for c3 viz
        console.log(deptsOverall)

        deptsOverall.forEach(function(d){
            var tempArr = [];
            tempArr.push(d.dept);
            tempArr.push(+d['2014Q2']);
            tempArr.push(+d['2014Q4']);
            columns.push(tempArr);
        })
    }else{
        rawByGoal.forEach(function(g){
            console.log(d + " : " + g.key)
            if(g.key == d){
//                console.log(g)
//                columns = [];
                g.values.forEach(function(t){
                    console.log(t)
                    columns.push([
                         t.key,
                        +t.values[0]['% at Mid'],
                        +t.values[0]['% at End']
                    ])
                })
            }
        })
    }
    console.log(columns)
    preChart(columns);
    function preChart(d){
        var colors = {};
        var metgoalsText =[],
            inprogressText = [],
            dangerzoneText = [];
        var metgoals = 0,
            inprogress = 0,
            dangerzone = 0;

        d.sort(function(a, b) {
            // Sort by count
            var dCount = b[2] -  a[2];
            if(dCount) return dCount;

            // If there is a tie, sort by year
            var dYear = b[1] -  a[1];
            return dYear;
        });

        d.forEach(function(e){
            //create 3 lists for boxes
            if(e[2] >= success){
                metgoalsText += "<li><a href='#'>"+ e[0] + "</a></li>";
                colors[e[0]]= "#17a397";
                metgoals++;
            }else if(e[2] <= danger){
                dangerzoneText += "<li><a href='#'>" + e[0]  + "</a></li>";
                colors[e[0]]= "#f1635c";
                dangerzone++;
            }else{
                inprogressText += "<li><a href='#'>" + e[0] + "</a></li>";
                colors[e[0]]= "#fec240";
                inprogress++;
            };
        })

        var xAxis = ['x', '2014-07-01', '2014-12-01'];
        d.unshift(xAxis);

        buildLineChart(d, colors);
    }
}
function buildLineChart(d,colors){
    c3.generate({
        size:{height:650},
        data: {
            x: 'x',
            columns: d,
            colors:
                colors
        },
        type:'line',
        axis: {
            x: {
                type: 'timeseries',
                tick: {
                    format: '%Y-%m-%d'
                }
            },
            y:{
                max:100,
                min:0,
                padding:{top: 0, bottom: 0}
            }
        },
        tooltip: {
            grouped: false
        },
        regions: [
            {axis: 'y', start:success, end:100, class: 'target-region'},
            {axis: 'y', start:0, end:danger, class: 'bad-region'}
        ],
        legend:{
            position:'right'
        }, bindto: document.getElementById("linechart")
    });
}


//Dept data
function updateBar(d){
    var columns = [];
    var categories = [];
    var unmetGoalsArr = [];
    var tempComments = [];

    //Bar values
    rawByDept.forEach(function(g,i){
        if(g.key == d){
            columns.push(g.key)
            g.values.forEach(function(t){
                columns.push(+t.values[0]['% at End'])
                //Other data required for chart
                categories.push("Goal " + t.key)

                //Get list of unmet goals
                if(t.values[0]['% at End'] < danger){
                    unmetGoalsArr.push(t.key);
                }

            })
        }
    })


    function buildGoalsNotMetBox(){
        //Hide the box if there are no unmet goals
        if(unmetGoalsArr.length==0){
            document.getElementById("goalsNotMet").style.visibility='hidden';
            //document.getElementById("bottom-goals").innerHTML+= currentDept + ' met and\/ or partially met all goals.<br>'
        } else{
            document.getElementById("goalsNotMet").style.visibility='visible';
            document.getElementById("comments").innerHTML= "";
            document.getElementById("bottom-goals").innerHTML="";
            unmetGoalsArr.forEach(function(d){
                document.getElementById("bottom-goals").innerHTML+= 'Goal ' + d + '<br>'
            })
        }
    }

    function buildCommentsBox(){
        //Comments data
        rawComments.forEach(function(c){
            if(c.key == d){
                tempComments= c.values;
                console.log(tempComments)
            }
        })

        currentComments=[];
        //Select out the comments for unmet goals
        unmetGoalsArr.forEach(function(d){
            tempComments.forEach(function(e){
                var tempArr = [];
                if(e.key == d){
                    tempArr = e.values
                }
                tempArr.forEach(function(f){
                    currentComments.push({comments:f.comments, goal: f.goal})
                })
            })
        })
        document.getElementById("comments").innerHTML = '';
        if(currentComments.length>0){
            currentComments.forEach(function(d){
                document.getElementById("comments").innerHTML+= '<li>Regarding Goal ' + d.goal + ': ' + d.comments +'</li>'
            })
        } else{
            document.getElementById("comments").innerHTML+= '<li>No comments were recorded.</li>'
        }
    }
//
    buildGoalsNotMetBox();
    buildCommentsBox()
    buildBarChart(columns,categories)

}

function buildBarChart(columns, categories){
    var chart = c3.generate({
        data: {
            columns: [
                columns
            ],
            type: 'bar',
            color: function (color, d) {
                if(d.value >= success){
                    return colorGreen;
                } else if (d.value >= danger && d.value <success){
                    return colorYellow;
                }else if (d.value < danger){
                    return colorRed;
                }
            },
            labels: {
                format: function (v, id, i, j) {
                    return v.toFixed(2)+'%'
                }
            }
        },
        bar: {
            width: {
                ratio:.8 // this makes bar width 50% of length between ticks
            }
        },
        axis:{
            rotated:true,
            x: {
                type: 'category',
                categories: categories
            },
            y: {
                max: 109,
                min: 0,
                label:{
                    text: 'Percentage',
                    position: 'outer-right'
                },
                padding:{top: 0, bottom: 0}
            }
        },
        tooltip:{
            show:false
        },
        legend:{
            show:false
        },
        regions: [
            {axis: 'y', start:success, end:100, class: 'target-region'},
            {axis: 'y', start:0, end:danger, class: 'bad-region'}
        ],
        bindto: document.getElementById("deptoverview")
    });
}

//Scrolling Effects
$(function() {
    // Init Controller
    var scrollMagicController = new ScrollMagic({
        globalSceneOptions: {
            reverse: true
        }
    });

    //Animation for 29 Offices
    var tween2 = TweenMax.staggerFromTo('.animation2', 0.4,
        {
            'font-size':'2em',
            'padding':'0 0.1em',
            'margin-bottom':'0.3em',
            color:'#eee'
        },
        {
            'font-size':'2.5em',
            color:'#F79321',
            'padding':'0 0.1em',
            'margin-bottom':'0.3em'
        },
        0.03 /* Stagger duration */
    );

    var scene2 = new ScrollScene({
        triggerElement: '#scn-departments',
        offset: 0  /* offset the trigger 0px below #scene's top */
    })
        .setTween(tween2)
        .addTo(scrollMagicController);


    //Animation for 2014 Goals
    var tween = TweenMax.staggerFrom('.animation', 0.5,
        {
            'opacity':0.2,
            scale:0
        },
        0.1 /* Stagger duration */
    );

    var scene = new ScrollScene({
        triggerElement: '#goals',
        offset: 10
    })
        .setTween(tween)
        .addTo(scrollMagicController);

    //Animation for 2015 Goals
    var tween2015 = TweenMax.staggerFrom('.compgoal', 0.5,
        {
            'opacity':0.2,
            scale:0
        },
        0.1 /* Stagger duration */
    );

    var scene2015 = new ScrollScene({
        triggerElement: '#goals2015',
        offset: 10
    })
        .setTween(tween2015)
        .addTo(scrollMagicController);


    // change behaviour of controller to animate scroll instead of jump
    scrollMagicController.scrollTo(function (newpos) {
        TweenMax.to(window, 0.5, {scrollTo: {y: newpos}});
    });

    //  bind scroll to anchor links
    $(document).on("click", "a[href^=#]", function (e) {
        var id = $(this).attr("href");
        console.log(id)
        if ($(id).length > 0) {
            e.preventDefault();

            // trigger scroll
            scrollMagicController.scrollTo(id);

            // if supported by the browser we can even update the URL.
            if (window.history && window.history.pushState) {
                history.pushState("", document.title, id);
            }
        }
    });

});