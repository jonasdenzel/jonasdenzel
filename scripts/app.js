  // TODO add service worker code here
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
             .register('./service-worker.js')
             .then(function() { console.log('Service Worker Registered'); });
  };

  function getUserMedia(constraints) {
    // if Promise-based API is available, use it
    if (navigator.mediaDevices) {
      return navigator.mediaDevices.getUserMedia(constraints);
    }
      
    // otherwise try falling back to old, possibly prefixed API...
    var legacyApi = navigator.getUserMedia || navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia || navigator.msGetUserMedia;
      
    if (legacyApi) {
      // ...and promisify it
      return new Promise(function (resolve, reject) {
        legacyApi.bind(navigator)(constraints, resolve, reject);
      });
    }
  }
  
  function getStream (type) {
    if (!navigator.mediaDevices && !navigator.getUserMedia && !navigator.webkitGetUserMedia &&
      !navigator.mozGetUserMedia && !navigator.msGetUserMedia) {
      alert('User Media API not supported.');
      return;
    }
  
    var constraints = {};
    constraints[type] = true;
    
    getUserMedia(constraints)
      .then(function (stream) {
        var mediaControl = document.querySelector(type);
        
        if ('srcObject' in mediaControl) {
          mediaControl.srcObject = stream;
        } else if (navigator.mozGetUserMedia) {
          mediaControl.mozSrcObject = stream;
        } else {
          mediaControl.src = (window.URL || window.webkitURL).createObjectURL(stream);
        }
      
        mediaControl.play();
      })
      .catch(function (err) {
        alert('Error: ' + err);
      })
    }

    var target = document.getElementById('target');
    var watchId;
    
    function appendLocation(location, verb) {
      verb = verb || 'updated';
      var newLocation = document.createElement('p');
      newLocation.innerHTML = 'Location ' + verb + ': ' + location.coords.latitude + ', ' + location.coords.longitude + '';
      target.appendChild(newLocation);
    }
    
    if ('geolocation' in navigator) {
      document.getElementById('askButton').addEventListener('click', function () {
        navigator.geolocation.getCurrentPosition(function (location) {
          appendLocation(location, 'fetched');
        });
        watchId = navigator.geolocation.watchPosition(appendLocation);
      });
    } else {
      target.innerText = 'Geolocation API not supported.'; 
    }

    if ('LinearAccelerationSensor' in window && 'Gyroscope' in window) {
      document.getElementById('moApi').innerHTML = 'Generic Sensor API';
      
      let lastReadingTimestamp;
      let accelerometer = new LinearAccelerationSensor();
      accelerometer.addEventListener('reading', e => {
        if (lastReadingTimestamp) {
          intervalHandler(Math.round(accelerometer.timestamp - lastReadingTimestamp));
        }
        lastReadingTimestamp = accelerometer.timestamp
        accelerationHandler(accelerometer, 'moAccel');
      });
      accelerometer.start();
      
      if ('GravitySensor' in window) {
        let gravity = new GravitySensor();
        gravity.addEventListener('reading', e => accelerationHandler(gravity, 'moAccelGrav'));
        gravity.start();
      }
      
      let gyroscope = new Gyroscope();
      gyroscope.addEventListener('reading', e => rotationHandler({
        alpha: gyroscope.x,
        beta: gyroscope.y,
        gamma: gyroscope.z
      }));
      gyroscope.start();
      
    } else if ('DeviceMotionEvent' in window) {
      document.getElementById('moApi').innerHTML = 'Device Motion API';
      
      var onDeviceMotion = function (eventData) {
        accelerationHandler(eventData.acceleration, 'moAccel');
        accelerationHandler(eventData.accelerationIncludingGravity, 'moAccelGrav');
        rotationHandler(eventData.rotationRate);
        intervalHandler(eventData.interval);
      }
      
      window.addEventListener('devicemotion', onDeviceMotion, false);
    } else {
      document.getElementById('moApi').innerHTML = 'No Accelerometer & Gyroscope API available';
    }
    
    function accelerationHandler(acceleration, targetId) {
      var info, xyz = "[X, Y, Z]";
    
      info = xyz.replace("X", acceleration.x && acceleration.x.toFixed(3));
      info = info.replace("Y", acceleration.y && acceleration.y.toFixed(3));
      info = info.replace("Z", acceleration.z && acceleration.z.toFixed(3));
      document.getElementById(targetId).innerHTML = info;
    }
    
    function rotationHandler(rotation) {
      var info, xyz = "[X, Y, Z]";
    
      info = xyz.replace("X", rotation.alpha && rotation.alpha.toFixed(3));
      info = info.replace("Y", rotation.beta && rotation.beta.toFixed(3));
      info = info.replace("Z", rotation.gamma && rotation.gamma.toFixed(3));
      document.getElementById("moRotation").innerHTML = info;
    }
    
    function intervalHandler(interval) {
      document.getElementById("moInterval").innerHTML = interval;
  }

  if ('localStorage' in window || 'sessionStorage' in window) {
    var selectedEngine;
  
    var logTarget = document.getElementById('target');
    var valueInput = document.getElementById('value');
  
    var reloadInputValue = function () {
    console.log(selectedEngine, window[selectedEngine].getItem('myKey'))
      valueInput.value = window[selectedEngine].getItem('myKey') || '';
    }
    
    var selectEngine = function (engine) {
      selectedEngine = engine;
      reloadInputValue();
    };
  
    function handleChange(change) {
      var timeBadge = new Date().toTimeString().split(' ')[0];
      var newState = document.createElement('p');
      newState.innerHTML = '' + timeBadge + ' ' + change + '.';
      logTarget.appendChild(newState);
    }
  
    var radios = document.querySelectorAll('#selectEngine input');
    for (var i = 0; i < radios.length; ++i) {
      radios[i].addEventListener('change', function () {
        selectEngine(this.value)
      });
    }
    
    selectEngine('localStorage');
  
    valueInput.addEventListener('keyup', function () {
      window[selectedEngine].setItem('myKey', this.value);
    });
  
    var onStorageChanged = function (change) {
      var engine = change.storageArea === window.localStorage ? 'localStorage' : 'sessionStorage';
      handleChange('External change in ' + engine + ': key ' + change.key + ' changed from ' + change.oldValue + ' to ' + change.newValue + '');
      if (engine === selectedEngine) {
        reloadInputValue();
      }
    }
  
    window.addEventListener('storage', onStorageChanged)
  }