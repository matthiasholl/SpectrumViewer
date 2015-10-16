/////////////////////////////////////////////////////////////////////////
// helpers for plugging in UI elements found in plotSpectra.mustache
// usage:
// 1. expects a global object dataStore to exist; create in the head.
// 2. after dom is loaded, call createFigure() and setupFigureControl()
// 3. expects a global function constructQueries([keys]), which takes
//    an array of plot names, and returns an array of queries to
//    pass to fetchSpectrum (see below)
// 4. expects a global function fetchSpectrum(query), which requests the
//    appropriate data and puts it in the right place, and a callback
//    fetchCallback() that runs after all data is loaded (probably a
//    good time to ask for a plot redraw, for example).
/////////////////////////////////////////////////////////////////////////

function createFigure(){
    //set up the canvas and viewer object

    var width = 0.9*document.getElementById('plotWrap').offsetWidth;
    var height = 32/48*width;
    var canvas = document.getElementById('plotID')

    canvas.width = width;
    canvas.height = height;
    dataStore.viewer = new spectrumViewer('plotID');
    dataStore.viewer.plotData();
}

function setupFigureControl(){
    //plug in all the callbacks etc for the spectrum controls

    var i, radios;
    //x-range control:
    document.getElementById('minX').onchange = updatePlotRange;
    document.getElementById('maxX').onchange = updatePlotRange;
    dataStore.viewer.chooseLimitsCallback = updateRangeSelector

    //onclick for scroll buttons - 1D:
    document.getElementById('bigLeft').onclick = dataStore.viewer.scrollSpectra.bind(dataStore.viewer, -100);
    document.getElementById('littleLeft').onclick = dataStore.viewer.scrollSpectra.bind(dataStore.viewer, -1);
    document.getElementById('littleRight').onclick = dataStore.viewer.scrollSpectra.bind(dataStore.viewer, 1);
    document.getElementById('bigRight').onclick = dataStore.viewer.scrollSpectra.bind(dataStore.viewer, 100);

    //unzoom button
    document.getElementById('unzoom').onclick = dataStore.viewer.unzoom.bind(dataStore.viewer);

    //lin-log toggle
    radios = document.getElementById('logToggleWrap').getElementsByTagName('input');
    for(i = 0; i < radios.length; i++) {
        radios[i].onclick = function() {
            dataStore.viewer.setAxisType(this.value)
        };
    }

    //update interval select
    document.getElementById('upOptions').onchange = startRefreshLoop;
    //update now button
    document.getElementById('upNow').onclick = refreshPlots;

    //snap to waveform toggle
    //document.getElementById('snapToWaveform').onclick = waveformSnap;  
}

function refreshPlots(){
    // re-fetch all the plots currently displayed.
    // calls fetchSpectrum on every element of the array returned from constructQueries
    // will run a function fetchCallback after data has arrived, if that function exists.

    var plotKeys = Object.keys(dataStore.viewer.plotBuffer);
    var queries = constructQueries(plotKeys); //queries is now an array of URLs to ask for JSON from
    var i;

    Promise.all(queries.map(promiseJSONURL)).then(function(spectra){
            var key
            for(key in spectra[0]){
                dataStore.viewer.addData(key, spectra[0][key]);
            }
    }).then(function(){
        if(typeof fetchCallback === "function"){
            fetchCallback();
        }
    })

}

function startRefreshLoop(){
    //sets the refresh loop as a callback to changing the selector menu.

    var period = parseInt(this.value,10); //in miliseconds

    clearInterval(dataStore.dataRefreshLoop);
    if(period != -1)
        dataStore.dataRefreshLoop = setInterval(refreshPlots, parseInt(this.value,10) );

}

//update the plot ranges onchange of the x-range input fields:
function updatePlotRange(){
    var xMin = document.getElementById('minX'),
        xMax = document.getElementById('maxX');

    dataStore.viewer.XaxisLimitMin = parseInt(xMin.value,10);
    dataStore.viewer.XaxisLimitMax = parseInt(xMax.value,10);

    dataStore.viewer.plotData();              
}

//update the UI when the plot is zoomed with the mouse
function updateRangeSelector(){
    var xMin = dataStore.viewer.XaxisLimitMin,
        xMax = dataStore.viewer.XaxisLimitMax

    document.getElementById('minX').value = xMin;
    document.getElementById('maxX').value = xMax;
}

//callback for clicking on Snap to Waveform
function waveformSnap(){
    toggleHidden('waveformBadge')

    if(this.engaged){
        dataStore.viewer.demandXmin = null;
        dataStore.viewer.demandXmax = null;
        dataStore.viewer.demandYmin = null;
        dataStore.viewer.demandYmax = null;
        dataStore.viewer.chooseLimitsCallback = function(){};
        dataStore.viewer.unzoom();
        this.engaged = 0;
    } else {
        dataStore.viewer.demandXmin = 0;
        dataStore.viewer.demandXmax = 256;
        dataStore.viewer.chooseLimitsCallback = function(){
            //set some demand values for the y axis and rerun the limit calculation
            var rerun = dataStore.viewer.demandYmin == null;
            dataStore.viewer.demandYmin = Math.max(0, dataStore.viewer.minY - (dataStore.viewer.maxY - dataStore.viewer.minY)*0.1);
            dataStore.viewer.demandYmax = dataStore.viewer.maxY + (dataStore.viewer.maxY - dataStore.viewer.minY)*0.1; 
            if(rerun) dataStore.viewer.chooseLimits();
            dataStore.viewer.demandYmin = null;
            dataStore.viewer.demandYmax = null;
        }
        dataStore.viewer.plotData();
        this.engaged = 1; 
    }                   
}