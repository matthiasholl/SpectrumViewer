function arrangePoints(x, y, flags){
    //take two equal length arrays x, y and return an array of points suitable for dygraphs, ie
    // [ [x[0], y[0]], [x[1], y[1]]...  ]
    //flags is another array indicating different data series; 
    //for every distinct flag, there will be another column in the inner arrays; a given column will contain only values sharing a flag, or null.
    // example: arrangePoints( [0,1,2,3], [10,11,12,13], [1,2,1,2]) returns:
    // [
    //      [0,10,null],
    //      [1,null,11],
    //      [2,12,null],
    //      [3,null,13] 
    // ]

    var copyFlags = []
    var uniqueFlags;
    var i, j, series, data = [];
    var row = [];

    for(i=0; i<flags.length; i++){
        copyFlags.push(flags[i]);
    }
    uniqueFlags = Array.from(new Set(flags.sort()));

    for(i=0; i<x.length; i++){
        row = [x[i]];
        series = uniqueFlags.indexOf(copyFlags[i]);
        for(j=0; j<uniqueFlags.length; j++){
            if(j == series)
                row.push(y[i]);
            else
                row.push(null);
        }
        data.push(row);
    }

    return data;
}

function createBins(n, constant){
    //returns an array [0,1,2,...n-1], useful for creating the x-array for arrangePoints if all you have is a spectrum of y values.
    //if constant is defined, returns an array of length n repeating constant.
    //thanks http://stackoverflow.com/questions/3746725/create-a-javascript-array-containing-1-n

    if(arguments.length === 1)
        return Array.apply(null, {length: n}).map(Number.call, Number)
    else
        return Array.apply(null, {length: n}).map(function(){return constant}, null)

}

function toggleHidden(id){
    //adds the class 'hidden' to object id if it doesn't have it already,
    //or removes it if it does.
    var classes = document.getElementById(id).className.split(' ');
    var hidden = classes.indexOf('hidden')

    if(hidden == -1){
        classes.push('hidden')
    } else{
        classes.splice(hidden, 1)
    }

    document.getElementById(id).className = classes.join(' ')

}

function alwaysThisLong(number, minLength){
    //returns number as a string padded with most-significant 0's to make it minLength.

    var num = ''+number;
    while(num.length<minLength)
        num = '0' + num

    return num
}

function getSelected(id){
    //return the current value selected by the select element with id.
    //thx http://stackoverflow.com/questions/1085801/get-selected-value-in-dropdown-list-using-javascript

    var e = document.getElementById(id);
    return e.options[e.selectedIndex].value;
}

function fadeHexColor(color, opacity){
    //given a hex color '#123456', return 'rgba(0x12, 0x34, 0x56, opactiy)'

    var R, G, B;

    R = parseInt(color.slice(1,3), 16);
    G = parseInt(color.slice(3,5), 16);
    B = parseInt(color.slice(5,7), 16);

    return 'rgba(' + R + ',' + G + ',' + B + ',' + opacity + ')';
}

function deleteNode(id){
    //delete a dom node with id
    //thanks https://developer.mozilla.org/en-US/docs/Web/API/Node/removeChild
    var node = document.getElementById(id);
    if (node.parentNode) {
        node.parentNode.removeChild(node);
    }
}

function constructQueries(keys){
    //takes a list of plot names and produces the query string needed to fetch them, in an array
    //more than 32 requests will be split into separate queries.

    var i, j, queryString, queries = [];
    for(i=0; i<Math.ceil(keys.length/32); i++){
        queryString = dataStore.spectrumServer + '?cmd=callspechandler';
        for(j=i*32; j<Math.min( (i+1)*32, keys.length ); j++){
            queryString += '&spectrum' + j + '=' + keys[j];
        }
        queries.push(queryString);
    }

    return queries
}

function spectraCallback(spectra){
    //callback to run after fetching spectra from the analyzer
    //used for spectrum viewer and rate monitor; gain matcher uses modified version
    var key
    for(key in spectra[0]){
        if(key != 'metadata')
            dataStore.viewer.addData(key, spectra[0][key]);
        else
            dataStore.metadata = JSON.parse(JSON.stringify(spectra[0].metadata));
    }
}

function promiseJSONURL(url){
    // promise to get response from <url> 
    //thanks http://www.html5rocks.com/en/tutorials/es6/promises/

    // Return a new promise.
    return new Promise(function(resolve, reject) {
        // Do the usual XHR stuff
        var req = new XMLHttpRequest();
        req.open('GET', url);

        req.onload = function() {
            // This is called even on 404 etc
            // so check the status
            if (req.status == 200) {
                // Resolve the promise with the response text parsed as JSON
                resolve(JSON.parse(req.response.replace(/\'/g, '\"')));  //good grief fix this in the server
            }
            else {
                // Otherwise reject with the status text
                // which will hopefully be a meaningful error
                reject(Error(req.statusText));
            }
        };

        // Handle network errors
        req.onerror = function() {
            reject(Error("Network Error"));
        };

        // Make the request
        req.send();
    });
}

function promiseScript(url){
    //like promiseURL, but does the script tag dance to avoid non-CORS-compliant servers

    // Return a new promise.
    return new Promise(function(resolve, reject) {

        var script = document.createElement('script');

        script.setAttribute('src', url);
        script.onload = function(){
            deleteNode('promiseScript');
            resolve(null); 
        }
        script.id = 'promiseScript';
        document.head.appendChild(script);
    });
}

function subtractHistograms(h0, h1){
    // perform element-wise subtraction h1-h0

    var i, diff = []

    if(h0.length != h1.length){
        console.log('tried to subtract histograms of different length, abort')
        return diff
    }

    for(i=0; i<h0.length; i++){
        diff[i] = h1[i] - h0[i];
    }

    return diff

}

function RCS(data, theory, parameters){
    //return the reduced chi^2 for an array of data compared to an array of corresponding theory predictions
    //assume variance on data = data (ie, poissonian counting error)
    //parameters == number of fitted parameters

    var i, rcs = 0;

    for(i=0; i<data.length; i++){
        rcs += Math.pow(data[i] - theory[i],2) / data[i]
    }

    return rcs / (data.length - parameters - 1);
}

function gauss(amplitude, center, width, x){
    return amplitude*Math.exp(-1*(x-center)*(x-center)/2/width/width);
}

// attach the .equals method to Array's prototype to call it on any array
// thanks http://stackoverflow.com/questions/7837456/how-to-compare-arrays-in-javascript
Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time 
    if (this.length != array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;       
        }           
        else if (this[i] != array[i]) { 
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;   
        }           
    }       
    return true;
}   

//replace every element in an array with 0
Array.prototype.zero = function(){
    var i;

    for(i=0; i<this.length; i++){
        this[i] = 0;
    }
}

//sum the elements in an array from [x0, x1)
Array.prototype.integrate = function(x0, x1){
    var i, sum = 0

    if(!x0)
        x0 = 0
    if(!x1)
        x1 = this.length

    for(i=x0; i<x1; i++)
        sum += this[i]

    return sum;
}

//fill an array with n copies of value
Array.prototype.fill = function(value, n){
    var i;
    console.log(value, n)
    for(i=0; i<n; i++)
        this[i] = value
}