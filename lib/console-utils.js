const printf = require('printf'),
    readline = require('readline');

var timerObjects = [];
var startLoadAnimation = function() {
    var P = [ '\\', '|', '/', '-' ];
    var i = 0;
    var timerObj = setInterval(function() {
        process.stdout.write('\r' + P[i++]);
        i = i % P.length;
    }, 250);
    timerObjects.push(timerObj);
    return timerObj;
};

var stopLoadAnimation = function(timerObject) {
    clearInterval(timerObject);
    timerObjects.pop();
    readline.cursorTo(process.stdout, 0);
};

var showError = function(err) {
    while(timerObjects.length > 0) {
        stopLoadAnimation();
    }
    console.error(err);
    process.exit(-1);
};

var currentIndent = 0;
var enterStep = function(purposeString) {
    _printWithIndent(currentIndent, purposeString);
    currentIndent++;
};

var exitStep = function() {
    currentIndent--;
};

var printCLI = function(commandLine) {
    _printWithIndent(currentIndent, printf('Command: %s', commandLine));
};

var stepComment = function(purposeString) {
    _printWithIndent(currentIndent, purposeString);
};

var _printWithIndent = function(tab, string) {
    // clear the entire line to remove residue output from loading animation
    process.stdout.write('\r');
    // a tab is 4 spaces, fight me
    console.log(printf('%*s%s', '', tab * 4, string));
};

exports.startLoadAnimation = startLoadAnimation;
exports.stopLoadAnimation = stopLoadAnimation;
exports.showError = showError;
exports.enterStep = enterStep;
exports.exitStep = exitStep;
exports.printCLI = printCLI;
exports.stepComment = stepComment;