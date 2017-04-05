// var debug = true;
var debug = false;

var minRMS = 0;
var maxRMS = 256;

var minFrequency = 3;
var maxFrequency = 25;

var fadingTime = 1500;
var ghostDistortTime = 3000;

var state = "idle";

//---------------------------------------------------------------//
$(function(){
  //Setup wrapper height relative to container, to prevent info container to introduce empty space at the bottom of the container
  $("#container-wrapper").height($("#container").outerHeight(true));

  startIdle();
})

setupAudio();
var audioLoaded = false;
var ghostAnimationFinished = false;
var ghostDistortStarted = false;
audio.addEventListener('loadeddata', function(){
    audioLoaded = true;
    if (ghostAnimationFinished && !ghostDistortStarted){
      ghostDistortStarted = true;
      distortGhost(document.getElementById("ghost"), function(){
        startDrawing(20); //brain alpha waves are 10 pulses per second. Draw double the speed to change bg every half cycle
        audio.volume = 1;
        state = "playing";
        animationTransition = false;
      });

    }
}, false);

var infoVisible = false;
var infoAnimating = false;
$("#info-button").on("click", function(){
  infoAnimating = true;

  $("#info-section").css("background-color", "#686867");
  $("#container > .main").css("visibility", "visible");

  if (infoVisible){
    var newHeight = "20px";
    var newY = 0;
  }else{
    var newHeight = $("#container").height();
    var newY = - $("#container").height();
  }
  $("#info-section").transit({
    height: newHeight,
    y: newY
  }, fadingTime, function(){
    infoAnimating = false;
    infoVisible = !infoVisible;
    if (infoVisible){
      $("#info-button").text("CLOSE");
      $("#info-section").css("background-color", "rgb(0,0,0,0)");
      $("#container > .main").css("visibility", "hidden");
    }
    else {
      $("#info-button").text("INFO");
      $("#info-section").css("background-color", "rgb(0,0,0,0)");
    }
  })
});


var animationTransition = false;
$(document).click(function(event) {
  if(!infoAnimating && !$(event.target).closest('#info-button').length && !animationTransition) {
    animationTransition = true;
    if (state == "idle"){
      audio.src = 'Atto3.mp3';
      audio.play();

      if (infoVisible){
        hideInfoSection(idleToPlay);
      }else{
        idleToPlay()
      }
    }else if (state == "playing"){
      playToPause();
    }else if (state == "pause"){
      pauseToPlay();
    }
  }
})


//--------- Audio ----------//
var audioCtx, audio, source, analyser, dataArray;
function setupAudio(){
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  audio = new Audio();
  audio.crossOrigin = "anonymous";
  source = audioCtx.createMediaElementSource(audio);

  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);
  analyser.connect(audioCtx.destination);

  dataArray = new Uint8Array(analyser.frequencyBinCount);

}
function getFrequencyData(){
  analyser.getByteFrequencyData(dataArray);
  var rms = 0;
  for (var i=minFrequency; i<maxFrequency; i++){
    rms+= dataArray[i];
  }
  return rms/(maxFrequency - minFrequency)
}

var fps, fpsInterval, startTime, now, then, elapsed;
function startDrawing(fps) {
    fpsInterval = 1000 / fps;
    then = Date.now();
    startTime = then;
    console.log(startTime);
    draw();
}

//--------- Drawing ----------//
function draw() {

  requestAnimationFrame(draw);

  if (state == "pause") return;

  if (debug) drawSpectrum();

  //Draw
  now = Date.now();
  elapsed = now - then;
  if (elapsed > fpsInterval){
     then = now - (elapsed % fpsInterval);
     drawBackground();
  }
}

var colorState = false;
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


//--------- Utility functions ----------//
function resetInfoSection(){
  var newHeight = "20px";
  var newY = 0;
  infoVisible = false;
  $("#container > .main").css("visibility", "visible");
  $("#info-button").text("INFO");
  $("#info-section").css("background-color", "rgb(0,0,0,0)");
  $("#info-section").transit({
    height: newHeight,
    y: newY}, 50);
}

function hideInfoSection(callback){
  infoAnimating = true;
  var newHeight = "20px";
  var newY = 0;
  $("#info-section").css("background-color", "#686867");
  $("#container > .main").css("visibility", "visible");
  $("#info-section").transit({
    height: newHeight,
    y: newY}, fadingTime, function(){
      infoAnimating = false;
      infoVisible = !infoVisible;
      $("#info-button").text("INFO");
      $("#info-section").css("background-color", "rgb(0,0,0,0)");
      callback();
    });
}

function startIdle(){
  animationTransition = true;
  $(".info").delay(1000).animate({
    opacity: 1
  }, fadingTime, function(){
    animationTransition = false;
  });
  $("#mask > #static").animate({
    opacity: 1
  }, fadingTime);
}

function idleToPlay(){
  $(".info").animate({
    opacity: 0
  }, fadingTime);
  $("#mask > #static").delay(500).animate({
    opacity: 0
  }, fadingTime);

  $("body").animate({
    backgroundColor: "#000"
  }, fadingTime);

  $("#ghost").css("visibility", "visible");
  $("#ghost").animate({
    opacity: 1
  }, fadingTime, function(){
    ghostAnimationFinished = true;
    if (audioLoaded && !ghostDistortStarted){
      ghostDistortStarted = true;
      distortGhost(document.getElementById("ghost"), function(){
        startDrawing(20); //brain alpha waves are 10 pulses per second. Draw double the speed to change bg every half cycle
        state = "playing";
        animationTransition = false;
      });
    }
    ghostAnimationFinished = true;
  })
}

function playToPause(){
  state = "pause";
  audio.pause();

  $(".info").delay(500).animate({
    opacity: 1
  }, fadingTime);

  $("#mask > #static").animate({
    opacity: 1
  }, fadingTime);

  $("body").css("backgroundColor", "#000");
  $("body").animate({
    backgroundColor: "#686867"
  }, fadingTime, function(){
    animationTransition = false;
  });
}

function pauseToPlay(){
  $(".info").animate({
    opacity: 0
  }, fadingTime);
  $("#mask > #static").delay(500).animate({
    opacity: 0
  }, fadingTime, function(){
    audio.play();
    state = "playing";
    animationTransition = false;
    resetInfoSection();
  });

  $("body").css("backgroundColor", "#686867");
  $("body").animate({
    backgroundColor: "#000"
  }, fadingTime);
}

function transform2d(elt, x1, y1, x2, y2, x3, y3, x4, y4) {
  var w = elt.offsetWidth, h = elt.offsetHeight;
  var transform = PerspT([0, 0, w, 0, 0, h, w, h], [x1, y1, x2, y2, x3, y3, x4, y4]);
  var t = transform.coeffs;
  t = [t[0], t[3], 0, t[6],
       t[1], t[4], 0, t[7],
       0   , 0   , 1, 0   ,
       t[2], t[5], 0, t[8]];
  t = "matrix3d(" + t.join(", ") + ")";
  // elt.style["-webkit-transform"] = t;
  // elt.style["-moz-transform"] = t;
  // elt.style["-o-transform"] = t;
  elt.style.transform = t;
}
var distortGhostCallbackCalled;
function distortGhost(el, callback){
  var corners;
  distortGhostCallbackCalled = false;
  corners = [0, 0, $(el).width(), 0, 0, $(el).height(), $(el).width(), $(el).height()];
  $({ i:0 }).animate({ i: 1}, {
      duration: ghostDistortTime,
      step: function(i, fi) {

          $(el).css("opacity", (1 - i))

          var xTransformFactor = 1.3;
          var yTransformFactor = 1.01;
          corners[0]+=xTransformFactor*i;
          corners[2]+=xTransformFactor*i;
          // corners[3]-=yTransformFactor*i;

          transform2d(el, corners[0], corners[1], corners[2], corners[3],
                           corners[4], corners[5], corners[6], corners[7]);

          if (i > 0.9 && !distortGhostCallbackCalled) {
            callback();
            distortGhostCallbackCalled =  true;
          }

      },

  });
}

//--------- Utility - Spectrometer ----------//
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
