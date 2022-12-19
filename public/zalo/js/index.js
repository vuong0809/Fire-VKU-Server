const temp = document.getElementById('temp');
const humi = document.getElementById('humi');
const mois = document.getElementById('mois');
const smoke = document.getElementById('smoke');
const results = document.getElementById('results');

const socket = io();

var gaugeOptions = {
    chart: {
        type: 'solidgauge'
    },
    title: null,
    pane: {
        center: ['50%', '80%'],
        size: '110%',
        startAngle: -90,
        endAngle: 90,
        background: {
            backgroundColor:
                Highcharts.defaultOptions.legend.backgroundColor || '#EEE',
            innerRadius: '60%',
            outerRadius: '100%',
            shape: 'arc'
        }
    },
    exporting: {
        enabled: false
    },
    tooltip: {
        enabled: false
    },

    // the value axis
    yAxis: {
        stops: [
            [0.1, '#55BF3B'], // green
            [0.5, '#DDDF0D'], // yellow
            [0.9, '#DF5353'] // red
        ],
        lineWidth: 0,
        tickWidth: 0,
        minorTickInterval: null,
        tickAmount: 2,
        title: {
            y: -30
        },
        labels: {
            y: 20
        }
    },

    plotOptions: {
        solidgauge: {
            dataLabels: {
                y: 10,
                borderWidth: 0,
                useHTML: true
            }
        }
    }
};

// The speed gauge
var chartSpeed = Highcharts.chart('container-speed', Highcharts.merge(gaugeOptions, {
    yAxis: {
        min: 0,
        max: 100,
        title: {
            text: 'predict'
        }
    },
    credits: {
        enabled: false
    },
    series: [{
        name: 'Speed',
        data: [0],
        dataLabels: {
            format:
                '<div style="text-align:center">' +
                '<span style="font-size:40px">{y} %</span><br/>' +
                // '<span style="font-size:12px;opacity:0.4">km/h</span>' +
                '</div>'
        },
        tooltip: {
            valueSuffix: ' km/h'
        }
    }]

}));

socket.on('connect', () => {
    console.log(socket.id);
    socket.on('results',(msg)=>{
        results.src = msg.imgString;
        temp.innerHTML = msg.tempVal;
        humi.innerHTML = msg.humiVal;
        mois.innerHTML = msg.moisVal;
        smoke.innerHTML = msg.smokeVal;

        if (chartSpeed) {
            const point = chartSpeed.series[0].points[0];
            point.update(msg.pr);
        }
    });
});