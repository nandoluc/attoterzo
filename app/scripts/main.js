var minRMS = 0;
var maxRMS = 256;

var minFrequency = 3;
var maxFrequency = 25;

// var debug = true;
var debug = false;


//
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

var audio = new Audio();
audio.crossOrigin = "anonymous";
var source = audioCtx.createMediaElementSource(audio);
audio.addEventListener('loadeddata', function(){
    console.log("Loaded");
    startDrawing(20); //brain alpha waves are 10 pulses per second. Draw double the speed to change bg every half cycle
}, false);

$(window).on("click", function(){
  console.log("Click")
  audio.src = 'Atto3.mp3';
  audio.play();

})

var analyser = audioCtx.createAnalyser();
analyser.fftSize = 256;

source.connect(analyser);
analyser.connect(audioCtx.destination);

var bufferLength = analyser.frequencyBinCount;
var dataArray = new Uint8Array(bufferLength);
for (var i=0; i<analyser.frequencyBinCount; i++){
  dataArray[i] = 0;
}

var fps, fpsInterval, startTime, now, then, elapsed;
function startDrawing(fps) {
    fpsInterval = 1000 / fps;
    then = Date.now();
    startTime = then;
    console.log(startTime);
    draw();
}

var colorState = false;

function draw() {
  requestAnimationFrame(draw);

  if (debug) drawSpectrum();

  //Draw
  now = Date.now();
  elapsed = now - then;
  if (elapsed > fpsInterval){
     then = now - (elapsed % fpsInterval);
     drawBackground();
  }
}


function getFrequencyData(){
  analyser.getByteFrequencyData(dataArray);
  var rms = 0;
  for (var i=minFrequency; i<maxFrequency; i++){
    rms+= dataArray[i];
  }
  return rms/(maxFrequency - minFrequency)
}

function drawBackground(){
   var rms = getFrequencyData();
   var rmsScaled = Math.min(Math.max(rms, minRMS), maxRMS);
   rmsScaled = (rmsScaled - minRMS)/(maxRMS - minRMS)

   if (debug) console.log("RMS scaled: "+rmsScaled+" - raw: "+rms);
   var rmsColor = Math.floor(rmsScaled*255);

   if (colorState){
     var currentColor = 'rgb('+rmsColor+','+rmsColor+','+rmsColor+')';
     var $body = $('body');
     $body.css('backgroundColor', currentColor);
   }else{
     var $body = $('body');
     $body.css('backgroundColor', "black");
   }
   colorState = !colorState;

}

// Utility - Spectrometer
var canvas, canvasCtx;
function createCanvas() {
    canvas = document.getElementById('analyser');
    canvasCtx = canvas.getContext('2d');
}
function drawSpectrum(){

  analyser.getByteFrequencyData(dataArray);
  canvasCtx.fillStyle = 'rgb(0, 0, 30)';
  canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

  var barWidth = (canvas.width / bufferLength) * 2.5;
  var barHeight;
  var x = 0;

  for(var i = 0; i < bufferLength; i++) {
    barHeight = dataArray[i];

    if (i < minFrequency || i > maxFrequency){
      canvasCtx.fillStyle = 'rgb(100,100,0)';
    }else{
      canvasCtx.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';
    }

    canvasCtx.fillRect(x,canvas.height-barHeight/2,barWidth,barHeight/2);

    x += barWidth + 1;
  }
}
if (debug) createCanvas();


//A light bulb is suspended in the center of the cylinder and the rotation speed allows the light to come out from the holes at a constant frequency of between 8 and 13 pulses per second.
