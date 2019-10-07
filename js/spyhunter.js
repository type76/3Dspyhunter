/**
 * @file Spyhunter game
 * @author type76 <osmanjaro@gmail.com>
 * @author Michael Dearman <mickeyuk2017@gmail.com>
 */

/**
 * Three.js
 */
var camera, scene, renderer, geometry, texture, mesh, controls;

/**
 * Is player car driving?
 * @type {boolean}
 */
var driving = false;

/**
 * Has player car exceeded...something?
 * @type {boolean}
 */
var exceeded = false;

/**
 * Has enemy truck collided with player?
 * @type {boolean}
 */
var truckcollide = false;

/**
 * Update edges?
 * @type {boolean}
 */
var edgeupdate = false;

/**
 * Hit canvas
 * @type {object}
 */
var hitcanvas = document.getElementById('hitcanvas'),
hitctx = hitcanvas.getContext('2d');


var hitimg = new Image();
hitimg.src = 'assets/hitbg.png';
var xamnt;
var active = true
colcanvas = document.getElementById('colcanvas'),
colctx = colcanvas.getContext('2d');
var colimg = new Image();
colimg.src = 'assets/bg.png';

var hero;
var revcounter = 0;
var count = 0;
var increment = 0;
var topspeed = 10;
var slowdown = false;
var enginefail = false;
// var seekeron = false;
var pathf = 0;
var xposindex = 127;
var timerID;
var bullets = [];
var xu = 0;
var xv = 0;
var startpoz = 20;
var collidableMeshList = [];
var speed = 50;
var clock = new THREE.Clock();
var delta = 0;
var width = window.innerWidth,
height = window.innerHeight;

/**
 * Keyboard control defaults and methods.
 * 
 * @type {object}
 */
keyboard = {

  _pressed: {},

  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  Z: 90,
  X: 88,
  C: 67,

  isDown: function(keyCode) {
      return this._pressed[keyCode];
  },

  onKeydown: function(event) {
      this._pressed[event.keyCode] = true;
  },

  onKeyup: function(event) {
      delete this._pressed[event.keyCode];
  }

};

/*****************
 * INIT
 ****************/

 /**
 * Initiate the game.
 */
function init() {

  // Init renderer
  renderer = initRenderer();

  // New scene
  scene = initScene();

  // Create object groups
  initGroups();

  // Player car
  initPlayer();

  // Bullet
  initBullet();

  // Initialize collision texture
  runtexture = initCollisionTex();

  // Init colliders
  initcolliders();

  // Init level
  initLevel();

  // Weapons
  initWeapons();

  // Sprites
  initSprites();

  // Add vehicles
  addVehicles();

  // Event listeners
  window.addEventListener('focus', starttab); // Active
  window.addEventListener('blur', stoptab); // Inactive
  window.addEventListener('resize', onWindowResize, false );
  window.addEventListener('keyup', function(event) { keyboard.onKeyup(event); }, false);
  window.addEventListener('keydown', function(event) { keyboard.onKeydown(event); }, false);

  // Main game loop
  setTimeout(function() {
    animate();
  }, 200);

}

/**
 * Initializes the three.js renderer.
 * 
 * @return {object}
 */
function initRenderer() {
  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
  });
  renderer.setSize(width, height);
  document.body.appendChild(renderer.domElement);
  return renderer;
}

/**
 * Creates the scene.
 * 
 * @returns {object}
 */
function initScene() {

  // New scene
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 1000);
  // camera.position.z = 28; camera.position.y = 10; // fps
  camera.position.z = 0.01;
  camera.position.y = 30;
  scene.add(camera);

  // Orbit controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI * 0.46;
  controls.enableDamping = true;
  controls.dampingFactor = 0.4;
  controls.maxDistance = 30;
  controls.enablePan = false;

  // Ambient light
  var ambient = new THREE.AmbientLight(0xffffff);
  ambient.intensity = 0.7;
  scene.add(ambient);

  // Lights
  var light = new THREE.PointLight(0xffffff, 1, 100);
  light.position.set(50, 50, 10);
  scene.add(light);

  return scene;

}

/**
 * Initializes the object groups.
 * 
 */
function initGroups() {

  // Hero bounding box
  hero = new THREE.Group();
  scene.add( hero );

  // 3D cursor
  cursor = new THREE.Group();
  scene.add(cursor);
  cursor.position.z=2;

  // Bullet group
  bulletgroup = new THREE.Group();
  scene.add(bulletgroup);

  // Background group
  bggroup = new THREE.Group();
  scene.add(bggroup);

}

/**
 * Initializes the player object.
 * 
 * @returns {object}
 */
function initPlayer() {
  let bgeometry = new THREE.BoxGeometry( 1, 1, 1.8 );
  let mmaterial = new THREE.MeshLambertMaterial( { color: 0xcccccc, wireframe:true,
  transparent:true, opacity:0 } );
  cubicbody = new THREE.Mesh( bgeometry, mmaterial );
  cubicbody.position.set(0,0,0);
  hero.add( cubicbody );
  return cubicbody;
}

/**
 * Initializes the bullet object.
 * 
 * @returns {object}
 */
function initBullet() {
  let shootgeometry = new THREE.BoxGeometry( 0.5, 0.5, 0.5 );
  let shootmaterial = new THREE.MeshBasicMaterial( { color: 0xffffff } );
  bullet = new THREE.Mesh( shootgeometry, shootmaterial );
  bullet.position.set(0,0,1000);
  hero.add( bullet );
  return bullet;
}

/**
 * Initializes the collision texture.
 * 
 * @returns {object}
 */
function initCollisionTex() {
  var runtexture = new THREE.Texture(colcanvas);
  runtexture.magFilter = THREE.NearestFilter;
  runtexture.minFilter = THREE.LinearMipMapLinearFilter;
  return runtexture;
}

/**
 * Initializes the level.
 * 
 */
function initLevel() {

  // Ground texture
  var material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map:runtexture, 
      side:THREE.DoubleSide
  });

  // Plane
  var geometry = new THREE.PlaneBufferGeometry( 40, 40, 1 );
  var groundplane = new THREE.Mesh( geometry, material );
  groundplane.rotation.set (-Math.PI/2,0,Math.PI/2);
  groundplane.position.set (0,-0.5,0);
  scene.add( groundplane );

  // left side bushes
  for ( var i = 0; i < 5; i ++ ) {
    var spriteMap = new THREE.TextureLoader().load( "assets/bush.png" );
    spriteMap.magFilter = THREE.NearestFilter;
    spriteMap.minFilter = THREE.LinearMipMapLinearFilter;
    var spriteMaterial = new THREE.SpriteMaterial( { map: spriteMap, color: 0xffffff } );
    var bush = new THREE.Sprite( spriteMaterial );
    var scl = Math.random()+1;
    bush.position.x = -20;
    bush.position.z = (4*scl)*i;
    bush.position.y = 0.25;
    bush.scale.set(scl,scl,scl);
    bggroup.add( bush );
  }

  // Right side bushes
  for ( var i = 0; i < 5; i ++ ) {
    var spriteMap = new THREE.TextureLoader().load( "assets/bush.png" );
    spriteMap.magFilter = THREE.NearestFilter;
    spriteMap.minFilter = THREE.LinearMipMapLinearFilter;
    var spriteMaterial = new THREE.SpriteMaterial( { map: spriteMap, color: 0xffffff } );
    var bush = new THREE.Sprite( spriteMaterial );
    var scl = Math.random()+1;
    bush.position.x = 20;
    bush.position.z = (4*scl)*i;
    bush.position.y = 0.25;
    bush.scale.set(scl,scl,scl);
    bggroup.add( bush );
  }

  // Lamp posts
  var geometry = new THREE.BoxGeometry( 0.2, 5, 0.2 );
  var material = new THREE.MeshBasicMaterial( { color: 0x3d3d3d } );
  lamppost = new THREE.Mesh( geometry, material );
  lamppostOffset = Math.random() < 0.5 ? 7 : -7;
  lamppost.position.z = -20;
  lamppost.position.x = hero.position.x - lamppostOffset;
  lamppost.name = 'lamppost';
  bggroup.add( lamppost );

}

/**
 * Initializes the game's weapons.
 * 
 */
function initWeapons() {
  emitter = new THREE.Object3D();
  emitter.position.set(0, 0.1, -0.6);
  hero.add(emitter);
}

/**
 * Initializes sprites.
 * 
 */
function initSprites() {

  // Crash sprite
  var spritecrash = new THREE.TextureLoader().load( "assets/snowflake.png" );
  spritecrash.magFilter = THREE.NearestFilter;
  spritecrash.minFilter = THREE.LinearMipMapLinearFilter;
  var spriteMaterial = new THREE.SpriteMaterial( { map: spritecrash, color: 0xffffff } );
  crash = new THREE.Sprite( spriteMaterial );
  crash.position.y = -0.5;
  crash.scale.set(4,4,4);
  scene.add( crash );
  crash.visible = false;

}

/*****************
 * GAME LOOP
 ****************/

/**
 * The main game loop
 */
function animate() {
  if (!active) { return } // [stop raf]
  increment++;
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  controls.update();
  // camera.lookAt(hero.position.x, hero.position.y, hero.position.z );
  playerupdate();
  collisions();
  changeCanvas();
  movebg();
// play engine sound
  if (typeof source !== 'undefined') {
    source.playbackRate.value = revcounter / 20;
  }
  delta = clock.getDelta();
  bullets.forEach(b => {
// move bullets
  if (!exceeded) {bullet.translateZ(-speed * delta);}
// delete once out of frame
  if (bullet.position.z < -20) {
  exceeded = true;
  scene.remove( bullet );
  bullet.visible = false;
}
});
}

/**
 * Move background
 */
function movebg() {

  // Lampposts
  if (trk.position.z < 15 && lamppost.position.z <= -20) {
    lamppost.visible = true;
    lamppost.position.x = (cgood.position.x - trk.position.x)*0.4 + lamppostOffset;
  }

  // Lamppost switch side
  if (lamppost.position.z >= 19) {
    lamppostOffset = Math.random() < 0.5 ? 7 : -7;
  }

  // x pos os post
  for ( var i = 0; bggroup.children[i]; i ++ ) {
    bggroup.children[i].position.z += revcounter/13;
    if (bggroup.children[i].position.z > 20) {
      bggroup.children[i].position.z = -21-Math.random()*20;
    }
    if (bggroup.children[i].position.z< -20) {
    bggroup.children[i].visible=false;} else {
      if (bggroup.children[i].name != 'lamppost') {
        bggroup.children[i].visible= true;
      }
    }
  }

}

/**
 * Updates the canvas
 */
function changeCanvas() {

    // wall collide slow down
    if (enginefail==true && revcounter>1) {
    revcounter=revcounter/1.1;
    document.body.classList = 'offroad';
    }  else {
    if (revcounter>0) {accelerate();
        document.body.classList = '';
        }
    }// if enginefail

    count += revcounter/4;

    if (count>(2304-128)) {count=0;}
    // refresh colour canvas
    colctx.drawImage(colimg, 0, 0);
    colctx.clearRect(0, 0, 128, 128);
    colctx.drawImage(
    colimg,
    count,
    0,
    128,
    128,0, 0, 128, 128
    );

    // refresh lookup canvas    
    hitctx.drawImage(hitimg, count, 0, 
    128, 128, 
    0, 0, 128, 128);

    // check lookup colour
    texData = hitctx.getImageData(xv, xu, 128, 128);
    if (texData.data[0]>1) {
    enginefail = true;
    } else {
    enginefail = false;
    }

    if (truckcollide) {return}

    var xx =((-collidableMeshList[0].position.z+10*6.4)-44)*3.2;
    posData = hitctx.getImageData(xx, 0, 1, 1);

    // // blue enemy dot
    // hitctx.fillStyle = "blue";
    // hitctx.fillRect(xx, 0, 2, 2);
    xposindex = posData.data[0];
    collidableMeshList[0].position.x = (xposindex-127)/2;

    // if collider is out of frame, use this start pos 
    if (collidableMeshList[0].position.z > 20) {
      posData = hitctx.getImageData(1, 0, 1, 1);
      xposindex = posData.data[0];     
      collidableMeshList[0].position.x = (xposindex-127)/2;
    }

}

/**
 * On window resize
 */
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

/**
 * Player movement
 */
function playerupdate() {
  if (keyboard.isDown(keyboard.LEFT) && cursor.position.x>-20)   {
    cursor.position.x -= 0.4; 
  }
  if (keyboard.isDown(keyboard.RIGHT)  && cursor.position.x<20)   {
    cursor.position.x += 0.4; 
  }
  if (keyboard.isDown(keyboard.UP)  && cursor.position.z>-20)   {
    cursor.position.z -= 0.2; 
  }
  if (keyboard.isDown(keyboard.DOWN)  && cursor.position.z<20)   {
    cursor.position.z += 0.2; 
    //
    // seekeron = true;
  }
  if (keyboard.isDown(keyboard.Z))   {
    driving = true;
    accelerate();
    document.getElementById('cntrls').style.display = 'none';
  }
  if (keyboard.isDown(keyboard.X))   {
    decelerate();
  }
  if (keyboard.isDown(keyboard.C))   {
    // if (!exceeded) {tap();}

    // clear/reset array
    bullets=[];
    bullet.position.z = 0;
    emitter.position.z = 0;
    exceeded = false;
    shoot();
  }


var diffx = cursor.position.x - hero.position.x;
var diffz = cursor.position.z - hero.position.z;
// var posdiff = Math.abs(diffx);
// var expo = (posdiff)/20;
// console.log(expo)
var expo = 0.07+(revcounter/100);
// var expo = revcounter/100;
// // position lerp
hero.position.x += diffx*expo;
hero.position.z += diffz*expo;
// rotation lerp
hero.rotation.y = -diffx*expo;
hero.rotation.x = diffz*expo/2;
// red dot
xu = 64+Math.floor( hero.position.x*100/32);
xv = 64-Math.floor(hero.position.z*100/32);
runtexture.needsUpdate = true;

// camera.lookAt(hero.position.x, 0, hero.position.z-10); //fps
}

/**
 * Acceleration
 * 
 * @param {object} e Event
 */
function accelerate(e) {
  slowdown = false;
  stopwarp = false;
  timerID = cancelAnimationFrame(slowtimer);
  timerID = requestAnimationFrame(timer);
    // if (revcounter < 0.1) {startengine();}
    if (e) {e.preventDefault();}
}

/**
 * Engine sound effect
 */
function startengine() {
    audioCtx = new(window.AudioContext || window.webkitAudioContext)();
    source = audioCtx.createBufferSource();
    getData();
    source.start(0);
}

/**
 * Deceleration
 * 
 * @param {object} e Event
 */
function decelerate(e) {
  slowdown = true;
  stopwarp = true; 
  timerID = cancelAnimationFrame(timerID);
  timerID = requestAnimationFrame(slowtimer);
  if (e) {e.preventDefault();}
}

/**
 * Slow down
 */
function slowtimer() {
  revcounter = revcounter-0.1;
  if (revcounter<0.1) {
    revcounter=0; 
    cancelAnimationFrame(slowtimer); 
    if (typeof source !== 'undefined') {
        source.stop(0);
    }
    return;
  } else {
    requestAnimationFrame(slowtimer);
  }
}


/**
 * Speed up
 */
function timer() { 
  if (revcounter < topspeed || slowdown == true) {
    timerID = requestAnimationFrame(timer);
    revcounter = revcounter+0.1;
  }
}

/**
 * Shoot
 */
function shoot() {
    bullet.visible = true;
    bullet.position.copy(emitter.getWorldPosition());
    bullet.quaternion.copy(cursor.quaternion);
    bulletgroup.add(bullet);
    bullets.push(bullet);
}

/**
 * Start tab
 */
function starttab() {
  active = true;
  // source.start(0);
  // startengine();
  animate();
}

/**
 * Stop tab
 */
function stoptab() {
  active = false;
  source.stop(0);
}

/**
 * Init colliders
 */
function initcolliders() {
  var collidergeo = new THREE.CubeGeometry(0.5, 0.5, 1.7);

  var yellowc = new THREE.MeshBasicMaterial({
    color: 0xffff00, wireframe:true,
    transparent:true, opacity:0
  });
  cgood = new THREE.Mesh(collidergeo, yellowc);
  cgood.position.set(3, 0.5, startpoz);
  cgood.name = 'good';
  scene.add(cgood);
  collidableMeshList.push(cgood);


  // bad collider
  var cbad = new THREE.Mesh(collidergeo, yellowc);
  cbad.position.set(-3, 0.5, startpoz);
  cbad.name = 'bad';
  scene.add(cbad);
  collidableMeshList.push(cbad);
  cbad.visible = false;


  // heat seeker collider
  var seeker = new THREE.Mesh(collidergeo, yellowc);
  seeker.position.set(0, 0.5, startpoz);
  seeker.name = 'seeker';
  scene.add(seeker);
  collidableMeshList.push(seeker);
  seeker.visible = false;

}

/**
 * Player hit.
 * 
 * @param {array} v 
 */
function hit(v) {
  if (hero.position.z>17) {return}
if (v.length > 0) {
  truckcollide = true;

    if (v[0].object.name == 'good') {
      goodhit(); 
      crash.position.x = trk.position.x;
      crash.position.z = trk.position.z;
      crash.visible = true;
    }
    if (v[0].object.name == 'bad') {
      badhit();
    }
    if (v[0].object.name == 'seeker') {
      seekhit();
    }

} //if
}

/**
 * Bullet hit
 * 
 * @param {array} v 
 */
function bullethit(v) {
  if (v.length > 0) {
      bullets=[];
      bullet.position.z = -10000;

      v[0].object.position.z = startpoz;

      if (v[0].object.name == 'good') {
        goodshoot();
        crash.position.x = trk.position.x;
        crash.position.z = trk.position.z;
        crash.visible = true;
      }

      if (v[0].object.name == 'bad') {
        badshoot();
      }

      if (v[0].object.name == 'seeker') {
        seekshoot();
      }
  }
}

/**
 * Collisions
 */
function collisions() {

  // ship hitbox
  for (var vertexIndex = 0; vertexIndex < cubicbody.geometry.vertices.length; vertexIndex++) {
    var localVertex = cubicbody.geometry.vertices[vertexIndex].clone();
    var globalVertex = localVertex.applyMatrix4(cubicbody.matrix);
    var directionVector = globalVertex.sub(cubicbody.position);

    var vray = new THREE.Raycaster(hero.position, directionVector.normalize());
    var collisionResults = vray.intersectObjects(collidableMeshList);
    if (collisionResults.length > 0 && collidableMeshList.distance < directionVector.length())
      console.log('hit');
    hit(collisionResults)
  }

  // bullet hitbox
  for (var vertexIndex = 0; vertexIndex < bullet.geometry.vertices.length; vertexIndex++) {
    var localVertex = bullet.geometry.vertices[vertexIndex].clone();
    var globalVertex = localVertex.applyMatrix4(bullet.matrix);
    var directionVector = globalVertex.sub(bullet.position);

    var vray = new THREE.Raycaster(bullet.position, directionVector.normalize());
    var collisionResults = vray.intersectObjects(collidableMeshList);
    if (collisionResults.length > 0 && collidableMeshList.distance < directionVector.length())
      console.log('hit');
    bullethit(collisionResults)
  }

  // set truck speed/pos
  if (revcounter>0) {
  collidableMeshList[0].position.z -= (delta*3);
        if (truckcollide){
          // trk.position.z -= (20 - trk.position.z)*0.01;
          collidableMeshList[0].position.z = 20;
          collidableMeshList[0].position.z -= (delta*3);
          truckcollide = false;
        } 
    xposindex = xposindex+(delta*3);
    if (enginefail) {
      xposindex = xposindex-(delta*12);
      collidableMeshList[0].position.z -= (delta*12);
    }
  }

  // set to loop back to start
  if (collidableMeshList[0].position.z < -20) {
    collidableMeshList[0].position.z = 30;
    truckcollide = false;
    trk.visible = false;
  }

  // set visibility of truck
  if (collidableMeshList[0].position.z > 20) {
    trk.visible = false;
  } else {
    if (truckcollide || !driving || collidableMeshList[0].position.z < -20) {return} //dont view until..
    trk.visible = true;
  }

  // truck position lerp
  trk.position.x += (cgood.position.x - trk.position.x)*0.4;
  trk.position.z += (cgood.position.z - trk.position.z)*0.4;

  // rotation lerp
  trk.rotation.y = 1.55-(cgood.position.x - trk.position.x)*0.4;
  trk.rotation.x = (cgood.position.z - trk.position.z)*0.4;

  // set crash fx
  crash.position.z += revcounter/13;
  if (crash.position.z>20) {crash.visible=false;}

}

/**
 * Good enemy hit.
 */
function goodhit() {
  trk.visible = false; 
  console.log('good'); 
  explosion();
}

/**
 * Bad enemy hit?
 */
function badhit() {
  console.log('bad'); 
  explosion();
}

/**
 * Seek hit?
 */
function seekhit() {
  console.log('seek'); 
  explosion();
}

/**
 * Good shot?
 */
function goodshoot() {
  console.log('good');
  explosion();
}

/**
 * Bad shot?
 */
function badshoot() {
console.log('bad');
explosion();
}

/**
 * Seek shoot?
 */
function seekshoot() {
console.log('seek');
explosion();
}

/*****************
 * AUDIO
 ****************/

/**
 * Explosion sound effect.
 */
function explosion() {
  new Audio("audio/explode2.wav").play();
}

/**
 * Get audio data.
 */
function getData() {
  source = audioCtx.createBufferSource();
  request = new XMLHttpRequest();

  request.open('GET', 'audio/ngin.wav', true);

  request.responseType = 'arraybuffer';
  request.onload = function() {
      var audioData = request.response;

      audioCtx.decodeAudioData(audioData, function(buffer) {
              myBuffer = buffer;
              songLength = buffer.duration;
              source.buffer = myBuffer;
              source.playbackRate.value = revcounter / 20;
              source.loop = true;

              var gainNode = audioCtx.createGain()
              gainNode.gain.value = 0.2 // 10% volume
              gainNode.connect(audioCtx.destination)
              source.connect(gainNode)

          },

          function(e) {
              "Error with decoding audio data" + e.error
          });

  }

  request.send();
}

/*****************
 * MODELS
 ****************/

/**
 * Add vehicles
 */
function addVehicles() {

  // car
  var loader = new THREE.ObjectLoader();
  loader.load( 'models/car.json', function ( object ) {
      object.scale.set( 0.3, 0.3, 0.3 );
      object.rotation.set( 0, Math.PI, 0 );
      object.position.set( 0.4, 0, -0.2 );
      object.name = "car";
      hero.add( object );
  });

  // truck
  var loader = new THREE.ObjectLoader();
  loader.load( 'models/truck.json', function ( object ) {
      object.scale.set( 0.3, 0.3, 0.3 );
      object.position.set( 0.15, -0.4, 0 );
      object.name = "truck";
      scene.add( object );

      // baddie position lerp
      trk = scene.getObjectByProperty( 'name', 'truck', false );
      trk.visible = false;
  });

}

/*****************
 * START
 ****************/
window.addEventListener('load', init, false); // Start