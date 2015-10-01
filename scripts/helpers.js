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

function toggleList(listID){

    var classes = document.getElementById(listID).className.split(' ');
    var hidden = classes.indexOf('hidden')

    if(hidden == -1){
        classes.push('hidden')
    } else{
        classes.splice(hidden, 1)
    }

    document.getElementById(listID).className = classes.join(' ')

}