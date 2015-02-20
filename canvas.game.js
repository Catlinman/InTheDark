
// Define and load the sounds which will be used by the game.
var CAVEAMBIENCESOUND = new Audio("res/sounds/ambience.mp3");
var COINSOUND = new Audio("res/sounds/coin.mp3");
var BREAKSOUND = new Audio("res/sounds/break.mp3");
var BASSSOUND = new Audio("res/sounds/bass.mp3");
var TRAPSOUND = new Audio("res/sounds/trap.mp3");
var BOOSTSOUND = new Audio("res/sounds/boost.mp3");
var HIT1SOUND = new Audio("res/sounds/hit1.mp3");
var HIT2SOUND = new Audio("res/sounds/hit2.mp3");
var JUMPSOUND = new Audio("res/sounds/jump.mp3");
var LANDSOUND = new Audio("res/sounds/land.mp3");
var DEATHSOUND = new Audio("res/sounds/death.mp3");
var STEPSOUND1 = new Audio("res/sounds/step1.mp3");
var STEPSOUND2 = new Audio("res/sounds/step2.mp3");
var STEPSOUND3 = new Audio("res/sounds/step3.mp3");
var RUMBLESOUND = new Audio("res/sounds/rumble.mp3");

// Set the volume of each sound.
BREAKSOUND.volume = 0.75;
COINSOUND.volume = 0.5;
DEATHSOUND.volume = 0.75;
JUMPSOUND.volume = 0.6;
LANDSOUND.volume = 0.3;
DEATHSOUND.volume = 0.65;
HIT1SOUND.volume = 0.75;
STEPSOUND1.volume = 0.25;
STEPSOUND2.volume = 0.25;
STEPSOUND3.volume = 0.25;

// Create an array of 
var HITARRAY = [HIT1SOUND, HIT2SOUND];
var STEPARRAY = [STEPSOUND1, STEPSOUND2, STEPSOUND3];

var GAME = document.getElementById("canvas-game");
var DT = 0;
var LASTDT = Date.now();
var TIME = 0;

var WIDTH = 800,
	HEIGHT = 600;

var VIEW_ANGLE = 60,
	ASPECT = WIDTH / HEIGHT,
	NEAR = 0.01,
	FAR = 75;

var QUEUERENDER = false;

var renderer = new THREE.WebGLRenderer({
	canvas: GAME,
	antialias: true,
	maxLights: 128
});
var camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
var scene = new THREE.Scene();

var SENSITIVITY = 0.002;

renderer.shadowMapEnabled = true;
renderer.shadowMapSoft = false;

renderer.shadowCameraNear = 1;
renderer.shadowCameraFar = 75;
renderer.shadowCameraFov = 60;

renderer.shadowMapBias = 0.0001;
renderer.shadowMapDarkness = 1;
renderer.shadowMapWidth = 1024;
renderer.shadowMapHeight = 1024;

var Entities = [];
Entities.Objects = [];

var ambience = {};
var player = {};
var fancylight = {};
var floorHeight = 0;
var currentColor = createRGBNoise(150, 150, 150, 50);
var currentFloor = 1;
var gameover = false;
var totalCoins = 0;
var totalEnemies = 0;
var timeleft = 15;

function createRGB(r, g, b) {
	return new THREE.Color("rgb(" + r + "," + g + "," + b + ")");
}

function createRGBNoise(r, g, b, noise) {
	return new THREE.Color("rgb(" + (r + Math.randomRange(-noise, noise)) + "," + (g + Math.randomRange(-noise, noise)) + "," + (b + Math.randomRange(-noise, noise)) + ")");
}

function colorLerp(from, to, t) {
	return new THREE.Color((Math.lerp(from.r, to.r, t)), (Math.lerp(from.g, to.g, t)), (Math.lerp(from.b, to.b, t)));
}

function generateRoom(depth, obstacles, foliageNum, floorColor, wallColor, detailColor, skyColor, skyIntensity, ambientlightColor) {
	var size = Math.clamp(depth, 1, 6) * 16;
	var o = obstacles || Math.clamp(currentFloor * 16, 0, 142);
	var f = foliageNum || 200;

	floorHeight = -Math.pow(2, depth) * 2;
	currentColor = createRGBNoise(150, 150, 150, 50);
	player.safeposition.y = -Math.pow(2, depth) * 2;
	player.safeHeight = -Math.pow(2, depth) * 2;

	var fColor = floorColor || null;
	for(var i = 0; i < size / 4; i++) {
		for(var j = 0; j < size / 4; j++) {
			var chance = 3;
			if(depth > 1) chance = Math.randomRange(1, Math.max(255 - depth * 50, 100));
			if(chance > 2) {
				new Entities.Tile(new THREE.Vector3(i * 4 - size / 2, -Math.pow(2, depth) * 2 - 1, j * 4 - size / 2), null, new THREE.Vector3(4, 1, 4), fColor);
			} else if(chance == 2) {
				new Entities.Spike(new THREE.Vector3(i * 4 - size / 2, -Math.pow(2, depth) * 2 - 1, j * 4 - size / 2), null, new THREE.Vector3(4, 1, 4), fColor);
			} else {
				new Entities.JumpPad(new THREE.Vector3(i * 4 - size / 2, -Math.pow(2, depth) * 2 - 1, j * 4 - size / 2), null, new THREE.Vector3(4, 1, 4), fColor);
			}
		}
	}

	var wColor = wallColor || null;
	for(var i = 0; i < o; i++) {
		new Entities.FallingBox(
			new THREE.Vector3(Math.randomRangeFloat(-size / 2, size / 2), -Math.pow(2, depth) * 2 - 1, Math.randomRangeFloat(-size / 2, size / 2)),
			null,
			new THREE.Vector3(Math.randomRange(1, depth), Math.randomRange(2, Math.min(Math.pow(2, depth), 86)), Math.randomRange(1, depth)),
			wColor
		)
	}

	new Entities.Box(new THREE.Vector3(size / 2, -Math.pow(2, depth) - 1, 1), null, new THREE.Vector3(4, Math.pow(2, depth) * 3, size), wColor);
	new Entities.Box(new THREE.Vector3(-size / 2, -Math.pow(2, depth) - 1, 1), null, new THREE.Vector3(4, Math.pow(2, depth) * 3, size), wColor);
	new Entities.Box(new THREE.Vector3(1, -Math.pow(2, depth) - 1, size / 2), null, new THREE.Vector3(size, Math.pow(2, depth) * 3, 4), wColor);
	new Entities.Box(new THREE.Vector3(1, -Math.pow(2, depth) - 1, -size / 2), null, new THREE.Vector3(size, Math.pow(2, depth) * 3, 4), wColor);

	var dColor = detailColor || null;
	for(var i = 0; i < f; i++) {
		new Entities.Foliage(
			new THREE.Vector3(Math.randomRangeFloat(-size / 2, size / 2), floorHeight - 1, Math.randomRangeFloat(-size / 2, size / 2)),
			dColor
		);
	}

	var ambient = createRGB(Math.ceil((currentColor.r * 255) * 0.05), Math.ceil((currentColor.g * 255) * 0.05), Math.ceil((currentColor.b * 255) * 0.05));
	var sColor = skyColor || createRGB(0, 0, 0);
	ambience.requestColor = sColor;
	ambience.worldlightIntensity = skyIntensity || 0;

	if(depth > 1) {
		for(var i = 0; i < (Math.min(depth * 4, 25)); i++) {
			new Entities.Coin(new THREE.Vector3(Math.randomRangeFloat(-size / 2, size / 2), -Math.pow(2, depth), Math.randomRangeFloat(-size / 2, size / 2)));
		}

		for(var i = 0; i < (Math.min(Math.randomRange(depth, depth * 3), 48)); i++) {
			new Entities.Enemy(new THREE.Vector3(Math.randomRangeFloat(-size / 2, size / 2), -Math.pow(2, depth), Math.randomRangeFloat(-size / 2, size / 2)));
		}

		BREAKSOUND.play();
		BASSSOUND.play();
	}
}

Entities.AmbienceController = function() {
	this.position = new THREE.Vector3(9000, 9000, 9000);
	this.rotation = new THREE.Euler();
	this.scale = new THREE.Vector3(0, 0, 0);
	this.requestColor = createRGB(255, 175, 155);
	this.color = renderer.getClearColor();

	this.ambientlightColor = createRGB(0, 0, 0);
	this.ambientlight = new THREE.AmbientLight(this.ambientlightColor);
	scene.add(this.ambientlight);

	this.worldlightIntensity = 0.5;
	this.worldlight = new THREE.HemisphereLight(createRGB(255, 175, 155), createRGB(25, 25, 25), 0.5);
	scene.add(this.worldlight);

	Entities.Objects.push(this);
}

Entities.AmbienceController.prototype.update = function(dt) {
	if(gameover == false) {
		timeleft = timeleft - dt;

		if(timeleft < 0) {
			player.yawObject.position.y += 0.1;
			player.velocity.y = 0.3;
			currentFloor++;
			generateRoom(currentFloor, null, null, null, null, null);

			timeleft = 10 + Math.min(10 * currentFloor, 45);
		} else if(timeleft < 5) {
			if(Math.ceil(timeleft) == 5) RUMBLESOUND.play();
			for(var i = 0; i < Entities.Objects.length; i++) {
				if(Entities.Objects[i] != this && Entities.Objects[i] != player && Entities.Objects[i] != fancylight) {
					if(Entities.Objects[i].mesh) {
						Entities.Objects[i].mesh.rotation.x += Math.randomRangeFloat(-0.0025, 0.0025);
						Entities.Objects[i].mesh.rotation.y += Math.randomRangeFloat(-0.0025, 0.0025);
						Entities.Objects[i].mesh.rotation.z += Math.randomRangeFloat(-0.0025, 0.0025);
					}
				}
			}
		}
	}

	this.color = colorLerp(this.color, this.requestColor, dt * 8);

	this.worldlight.color = this.color;
	this.worldlight.intensity = Math.lerp(this.worldlight.intensity, this.worldlightIntensity, dt * 8);

	renderer.setClearColor(this.color);
}

Entities.AmbienceController.prototype.destroy = function() {
	Entities.Objects.splice(Entities.Objects.indexOf(this), 1);
}

Entities.Box = function(position, rotation, scale, color) {
	this.collider = true;
	this.position = position || new THREE.Vector3();
	this.rotation = rotation || new THREE.Euler();
	this.scale = scale || new THREE.Vector3(1, 1, 1);
	this.color = color || currentColor;

	var geometry = new THREE.CubeGeometry(this.scale.x, this.scale.y, this.scale.z);
	var newcolor = new THREE.Color("rgb(" + (this.color.r * 255) + "," + (this.color.g * 255 + Math.randomRange(-25, 25)) + "," + (this.color.b * 255 + Math.randomRange(-25, 25)) + ")");
	var material = new THREE.MeshPhongMaterial({
		color: newcolor,
		wireframe: false
	});

	this.mesh = new THREE.Mesh(geometry, material);
	this.mesh.position = this.position;
	this.mesh.rotation = this.rotation;
	this.mesh.castShadow = true;
	this.mesh.receiveShadow = true;

	this.level = currentFloor;

	scene.add(this.mesh);

	Entities.Objects.push(this);
}

Entities.Box.prototype.update = function(dt) {
	if(this.level != currentFloor) {
		if(this.mesh.position.y > 100) {
			this.destroy();
		} else {
			this.mesh.position.y += dt * 16;
		}
	}
}

Entities.Box.prototype.destroy = function() {
	Entities.Objects.splice(Entities.Objects.indexOf(this), 1);
	scene.remove(this.mesh);
}

Entities.FallingBox = function(position, rotation, scale, color) {
	this.collider = true;
	this.position = position || new THREE.Vector3();
	this.rotation = rotation || new THREE.Euler();
	this.scale = scale || new THREE.Vector3(1, 1, 1);
	this.color = color || currentColor;

	this.vy = 0;

	this.spin = new THREE.Vector3();
	this.spin.x = Math.randomRangeFloat(-0.01, 0.01);
	this.spin.y = Math.randomRangeFloat(-0.01, 0.01);
	this.spin.z = Math.randomRangeFloat(-0.01, 0.01);

	var geometry = new THREE.CubeGeometry(this.scale.x, this.scale.y, this.scale.z);
	var newcolor = new THREE.Color("rgb(" + (this.color.r * 255) + "," + (this.color.g * 255 + Math.randomRange(-25, 25)) + "," + (this.color.b * 255 + Math.randomRange(-25, 25)) + ")");
	var material = new THREE.MeshPhongMaterial({
		color: newcolor,
		wireframe: false
	});

	this.mesh = new THREE.Mesh(geometry, material);
	this.mesh.position = this.position;
	this.mesh.rotation = this.rotation;
	this.mesh.castShadow = true;
	this.mesh.receiveShadow = true;

	this.level = currentFloor;

	scene.add(this.mesh);

	Entities.Objects.push(this);
}

Entities.FallingBox.prototype.update = function(dt) {
	if(this.level != currentFloor) {
		if(this.mesh.position.y < floorHeight - this.mesh.scale.y) {
			this.destroy();
		} else {
			this.scale = new THREE.Vector3(0, 0, 0);
			this.vy = Math.lerp(this.vy, -9.81, dt / 24);
			this.mesh.position.y += this.vy;
			this.mesh.rotation.x += this.spin.x;
			this.mesh.rotation.y += this.spin.y;
			this.mesh.rotation.z += this.spin.z;
		}
	}
}

Entities.FallingBox.prototype.destroy = function() {
	Entities.Objects.splice(Entities.Objects.indexOf(this), 1);
	scene.remove(this.mesh);
}

Entities.Coin = function(position, rotation, scale, color) {
	this.position = position || new THREE.Vector3();
	this.rotation = rotation || new THREE.Euler();
	this.scale = scale || new THREE.Vector3(1, 1, 1);
	this.color = color || currentColor;

	this.vy = 0;

	var geometry = new THREE.RingGeometry(0.10, 0.2, 16);
	var material = new THREE.MeshLambertMaterial({
		color: 0xaaaa00,
		side: THREE.DoubleSide
	});

	this.mesh = new THREE.Mesh(geometry, material);
	this.mesh.position = this.position;
	this.mesh.rotation = this.rotation;

	scene.add(this.mesh);

	this.level = currentFloor;

	Entities.Objects.push(this);
}

Entities.Coin.prototype.update = function(dt) {
	if(this.mesh.position.distanceToSquared(player.position) < 1.5) {
		fancylight.spotlight.intensity = 25;
		COINSOUND.play();
		totalCoins++;
		player.health += 5;
		this.destroy();
	}

	this.mesh.rotation.y += dt;
	this.vy = Math.lerp(this.vy, -9.81, dt / 24);
	this.mesh.position.y += this.vy;

	if(this.mesh.position.y < floorHeight) {
		this.mesh.position.y = floorHeight - 0.5;
		this.vy = -this.vy / 8;
	}

	if(this.level < currentFloor - 1) this.destroy();
}

Entities.Coin.prototype.destroy = function() {
	Entities.Objects.splice(Entities.Objects.indexOf(this), 1);
	scene.remove(this.mesh);
}

Entities.Foliage = function(position, color) {
	this.position = position || new THREE.Vector3();
	this.rotation = new THREE.Euler(0, Math.random() * 2, 0);
	this.scale = new THREE.Vector3();
	this.color = color || currentColor;

	var geometry = new THREE.PlaneGeometry(0.1, Math.randomRangeFloat(0.1, 1));
	var newcolor = new THREE.Color("rgb(" + (this.color.r * 255 + Math.randomRange(-15, 15)) + "," + (this.color.g * 255 + Math.randomRange(-15, 15)) + "," + (this.color.b * 255 + Math.randomRange(-15, 15)) + ")");
	var material = new THREE.MeshLambertMaterial({
		color: newcolor,
		wireframe: false
	});

	this.mesh = new THREE.Mesh(geometry, material);
	this.mesh.position = this.position;
	this.mesh.rotation = this.rotation;
	this.mesh.castShadow = true;

	scene.add(this.mesh);

	this.level = currentFloor;

	Entities.Objects.push(this);
}

Entities.Foliage.prototype.update = function(dt) {
	this.mesh.lookAt(player.yawObject.position);
	if(this.level != currentFloor) this.destroy();
}

Entities.Foliage.prototype.destroy = function() {
	Entities.Objects.splice(Entities.Objects.indexOf(this), 1);
	scene.remove(this.mesh);
}

Entities.Tile = function(position, rotation, scale, color) {
	this.position = position || new THREE.Vector3();
	this.rotation = rotation || new THREE.Euler(Math.rad(270), 0, Math.rad(90));
	this.scale = scale || new THREE.Vector3(1, 1, 1);
	this.color = color || currentColor;

	this.vy = 0;

	this.spin = new THREE.Vector3();
	this.spin.x = Math.randomRangeFloat(-0.1, 0.1);
	this.spin.y = Math.randomRangeFloat(-0.1, 0.1);
	this.spin.z = Math.randomRangeFloat(-0.1, 0.1);

	var geometry = new THREE.PlaneGeometry(this.scale.x, this.scale.z);
	var newcolor = new THREE.Color("rgb(" + (this.color.r * 255 + Math.randomRange(-15, 15)) + "," + (this.color.g * 255 + Math.randomRange(-15, 15)) + "," + (this.color.b * 255 + Math.randomRange(-15, 15)) + ")");
	var material = new THREE.MeshPhongMaterial({
		color: newcolor,
		wireframe: false
	});

	this.mesh = new THREE.Mesh(geometry, material);
	this.mesh.position = this.position;
	this.mesh.rotation = this.rotation;
	this.mesh.receiveShadow = true;

	this.level = currentFloor;

	scene.add(this.mesh);

	Entities.Objects.push(this);
}

Entities.Tile.prototype.update = function(dt) {
	if(this.level != currentFloor) {
		if(this.mesh.position.y < floorHeight) {
			this.destroy();
		} else {
			this.scale = new THREE.Vector3(0, 0, 0);
			this.vy = Math.lerp(this.vy, -9.81, dt / 16);
			this.mesh.position.y += this.vy;
			this.mesh.rotation.x += this.spin.x;
			this.mesh.rotation.y += this.spin.y;
			this.mesh.rotation.z += this.spin.z;
		}
	}
}

Entities.Tile.prototype.destroy = function() {
	Entities.Objects.splice(Entities.Objects.indexOf(this), 1);
	scene.remove(this.mesh);
}

Entities.Floor = function(position, rotation, scale, color) {
	this.position = position || new THREE.Vector3();
	this.rotation = rotation || new THREE.Euler(Math.rad(270), 0, Math.rad(90));
	this.scale = scale || new THREE.Vector3(1, 1, 1);
	this.color = color || currentColor;

	var geometry = new THREE.PlaneGeometry(this.scale.x, this.scale.z);
	var material = new THREE.MeshLambertMaterial({
		color: this.color,
		wireframe: false
	});

	this.mesh = new THREE.Mesh(geometry, material);
	this.mesh.position = this.position;
	this.mesh.rotation = this.rotation;
	this.mesh.receiveShadow = false;

	this.level = currentFloor;

	scene.add(this.mesh);

	Entities.Objects.push(this);
}

Entities.Floor.prototype.update = function(dt) {
	if(this.level != currentFloor) {
		this.destroy();
	}
}

Entities.Floor.prototype.destroy = function() {
	Entities.Objects.splice(Entities.Objects.indexOf(this), 1);
	scene.remove(this.mesh);
}

Entities.FancyLight = function(position, rotation, scale, color, strength) {
	this.position = position || new THREE.Vector3();
	this.rotation = rotation || new THREE.Euler();
	this.scale = scale || new THREE.Vector3(1, 1, 0.5);

	this.origColor = currentColor;
	this.color = color || createRGB(currentColor.r * 255 + 100, currentColor.g * 255 + 100, currentColor.b * 255 + 100);
	this.strength = strength || 30;

	var geometry = new THREE.SphereGeometry(this.scale.z, 32, 32);
	var material = new THREE.MeshBasicMaterial({
		color: this.color,
		wireframe: false
	});
	this.mesh = new THREE.Mesh(geometry, material);
	this.mesh.position = this.position;

	this.follower = new THREE.Object3D();

	this.light = new THREE.PointLight(this.color, 0.1, this.strength);
	this.light.position = this.position;

	this.spotlight = new THREE.SpotLight(this.color, 1, this.strength);
	this.spotlight.position = this.position;
	this.spotlight.castShadow = true;
	this.spotlight.shadowMapWidth = 1024;
	this.spotlight.shadowMapHeight = 1024;
	this.spotlight.shadowCameraNear = 1;
	this.spotlight.shadowCameraFar = 75;
	this.spotlight.shadowCameraFov = 60;
	this.spotlight.target = this.follower;

	scene.add(this.mesh);
	scene.add(this.light);
	scene.add(this.spotlight)

	Entities.Objects.push(this);
}

Entities.FancyLight.prototype.update = function(dt) {
	if(currentFloor > 1 && gameover == false) {
		this.light.intensity = Math.lerp(this.light.intensity, (player.health / 1000), dt * 8);
		this.spotlight.intensity = Math.lerp(this.spotlight.intensity, (currentFloor / 2) * (player.health / 100), dt * 8);

		this.follower.position.lerp(player.yawObject.position, dt);
		this.position.x = Math.lerp(this.position.x, player.position.x, dt);
		this.position.y = Math.lerp(this.position.y, player.position.y + (2 * currentFloor) + 2, dt * 4);
		this.position.z = Math.lerp(this.position.z, player.position.z, dt);

		if(this.origColor != currentColor) {
			this.origColor = currentColor;
			this.color = createRGB(currentColor.r * 255 + 100, currentColor.g * 255 + 100, currentColor.b * 255 + 100);
			this.light.color.copy(this.color);
			this.spotlight.color.copy(this.color);
			this.mesh.material.color.copy(this.color);
		}

		this.mesh.position.y = this.position.y + Math.sin(TIME) / 50;
	} else if(gameover == true) {
		this.light.intensity = Math.lerp(this.light.intensity, 25, dt * 8);
		this.position.x = Math.lerp(this.position.x, 0, dt);
		this.position.y = Math.lerp(this.position.y, 10, dt * 4);
		this.position.z = Math.lerp(this.position.z, 12.5, dt);
	}
}

Entities.FancyLight.prototype.destroy = function() {
	Entities.Objects.splice(Entities.Objects.indexOf(this), 1);
	scene.remove(this.mesh);
	scene.remove(this.light);
}

Entities.Spike = function(position, rotation, scale, color) {
	this.position = position || new THREE.Vector3();
	this.rotation = rotation || new THREE.Euler(Math.rad(270), 0, Math.rad(90));
	this.scale = scale || new THREE.Vector3(1, 1, 1);
	this.color = createRGB(100, 100, 100) || currentColor;
	this.spikeHeight = 0.25;
	this.vy = 0;

	this.spin = new THREE.Vector3();
	this.spin.x = Math.randomRangeFloat(-0.1, 0.1);
	this.spin.y = Math.randomRangeFloat(-0.1, 0.1);
	this.spin.z = Math.randomRangeFloat(-0.1, 0.1);

	var geometry = new THREE.PlaneGeometry(this.scale.x, this.scale.z);
	var material = new THREE.MeshPhongMaterial({
		color: this.color,
		wireframe: false
	});

	this.mesh = new THREE.Mesh(geometry, material);
	this.mesh.position = this.position;
	this.mesh.rotation = this.rotation;
	this.mesh.receiveShadow = true;

	var spikegeometryMERGE = new THREE.CubeGeometry(0.1, 0.1, 0.1);
	var spikegeometry = new THREE.CubeGeometry(0.1, 1, 0.1);
	var spikematerial = new THREE.MeshLambertMaterial({
		color: this.color,
		wireframe: false
	});

	for(var u = 0; u < 8; u++) {
		for(var o = 0; o < 8; o++) {
			var spike = new THREE.Mesh(spikegeometry, spikematerial);
			spike.position = new THREE.Vector3((u / 2) - (this.scale.x / 2) + 0.2, (o / 2) - (this.scale.z / 2) + 0.1, 0);
			spike.rotation = new THREE.Euler(Math.PI_2, 0, 0);
			spike.receiveShadow = true;
			spike.castShadow = true;
			THREE.GeometryUtils.merge(spikegeometryMERGE, spike);
		}
	}

	var spikematerial = new THREE.MeshLambertMaterial({
		color: this.color,
		wireframe: false
	});

	this.spikemesh = new THREE.Mesh(spikegeometryMERGE, spikematerial);


	this.mesh.add(this.spikemesh);

	this.level = currentFloor;

	scene.add(this.mesh);

	Entities.Objects.push(this);
}

Entities.Spike.prototype.update = function(dt) {
	if(this.level != currentFloor) {
		this.spikeHeight = -0.4;
		this.spikemesh.position.z = this.spikeHeight;

		if(this.mesh.position.y < floorHeight) {
			this.destroy();
		} else {
			this.scale = new THREE.Vector3(0, 0, 0);
			this.vy = Math.lerp(this.vy, -9.81, dt / 16);
			this.mesh.position.y += this.vy;
			this.mesh.rotation.x += this.spin.x;
			this.mesh.rotation.y += this.spin.y;
			this.mesh.rotation.z += this.spin.z;
		}
	} else {
		if(this.mesh.position.distanceTo(player.yawObject.position) < 2.5) {
			TRAPSOUND.play();
			player.health -= 500 * dt;

			if(player.health > 0) {
				fancylight.spotlight.intensity = 5;
			}

			player.yawObject.position.y += 0.1;
			player.velocity.x += Math.randomRangeFloat(-0.15, 0.15);
			player.velocity.y = (-player.velocity.y / 4) + 0.10 + Math.randomRangeFloat(-0.1, 0.1);
			player.velocity.z += Math.randomRangeFloat(-0.15, 0.15);

			for(var num = 0; num < Math.randomRange(5, 10); num++) {
				new Entities.Blood(player.yawObject.position, createRGB(255, 0, 0));
			}

			this.spikeHeight = 0.25;
			this.spikemesh.position.z = this.spikeHeight;
		} else {
			this.spikeHeight = -0.4;
		}

		this.spikemesh.position.z = Math.lerp(this.spikemesh.position.z, this.spikeHeight, dt * 8);
	}
}

Entities.Spike.prototype.destroy = function() {
	Entities.Objects.splice(Entities.Objects.indexOf(this), 1);

	this.mesh.remove(this.spikemesh);
	scene.remove(this.mesh);
}

Entities.JumpPad = function(position, rotation, scale, color) {
	this.position = position || new THREE.Vector3();
	this.rotation = rotation || new THREE.Euler(Math.rad(270), 0, Math.rad(90));
	this.scale = scale || new THREE.Vector3(1, 1, 1);
	this.color = createRGB(50, 50, 75) || currentColor;
	this.padHeight = 0;
	this.vy = 0;

	this.spin = new THREE.Vector3();
	this.spin.x = Math.randomRangeFloat(-0.1, 0.1);
	this.spin.y = Math.randomRangeFloat(-0.1, 0.1);
	this.spin.z = Math.randomRangeFloat(-0.1, 0.1);

	var geometry = new THREE.PlaneGeometry(this.scale.x, this.scale.z);
	var material = new THREE.MeshPhongMaterial({
		color: this.color,
		wireframe: false
	});
	this.mesh = new THREE.Mesh(geometry, material);
	this.mesh.position = this.position;
	this.mesh.rotation = this.rotation;
	this.mesh.receiveShadow = true;

	scene.add(this.mesh);

	var geometry = new THREE.CubeGeometry(this.scale.x / 2, 0.5, this.scale.z / 2);
	var material = new THREE.MeshPhongMaterial({
		color: createRGB(150, 225, 175),
		wireframe: false
	});

	this.padmesh = new THREE.Mesh(geometry, material);
	this.padmesh.castShadow = true;
	this.padmesh.receiveShadow = true;
	this.padmesh.position = new THREE.Vector3(this.position.x, this.position.y, this.position.z);

	this.level = currentFloor;

	scene.add(this.padmesh);

	Entities.Objects.push(this);
}

Entities.JumpPad.prototype.update = function(dt) {
	if(this.level != currentFloor) {
		this.padHeight = 1;
		this.padmesh.position.y = this.padHeight;

		if(this.mesh.position.y < floorHeight) {
			this.destroy();
		} else {
			this.scale = new THREE.Vector3(0, 0, 0);
			this.vy = Math.lerp(this.vy, -9.81, dt / 16);
			this.mesh.position.y += this.vy;
			this.mesh.rotation.x += this.spin.x;
			this.mesh.rotation.y += this.spin.y;
			this.mesh.rotation.z += this.spin.z;
		}
	} else {
		if(this.mesh.position.distanceTo(player.yawObject.position) < 2) {
			BOOSTSOUND.play();
			player.yawObject.position.y += 0.1;
			player.velocity.x += Math.randomRangeFloat(-0.1, 0.1);
			player.velocity.y = (-player.velocity.y / 4) + 0.5 + Math.randomRangeFloat(-0.1, 0.1);
			player.velocity.z += Math.randomRangeFloat(-0.1, 0.1);
			this.padHeight = this.position.y + 10;
		} else {
			this.padHeight = this.position.y;
		}

		this.padmesh.position.y = Math.lerp(this.padmesh.position.y, this.padHeight, dt * 4);
	}
}

Entities.JumpPad.prototype.destroy = function() {
	Entities.Objects.splice(Entities.Objects.indexOf(this), 1);

	scene.remove(this.mesh);
	scene.remove(this.padmesh);
}

Entities.Enemy = function(position, rotation, scale) {
	this.collider = true;
	this.health = 25;
	this.position = position || new THREE.Vector3();
	this.rotation = rotation || new THREE.Euler();
	this.scale = scale || new THREE.Vector3(0.75, 0.75, 0.75);

	this.direction = new THREE.Vector3();
	this.force = new THREE.Vector3();
	this.d = new THREE.Vector3();

	this.safeposition = this.position;

	var geometry = new THREE.CubeGeometry(this.scale.x, this.scale.y, this.scale.z);
	var material = new THREE.MeshPhongMaterial({
		color: createRGBNoise(50, 150, 225, 25),
		wireframe: false
	});

	this.mesh = new THREE.Mesh(geometry, material);
	this.mesh.position = this.position;
	this.mesh.rotation = this.rotation;
	this.mesh.castShadow = true;
	this.mesh.receiveShadow = true;

	this.level = currentFloor;

	scene.add(this.mesh);

	Entities.Objects.push(this);
}

Entities.Enemy.prototype.update = function(dt) {
	this.force.x = Math.lerp(this.force.x, 0, dt * 8);
	this.force.z = Math.lerp(this.force.z, 0, dt * 8);

	var dist = this.mesh.position.distanceTo(player.yawObject.position);

	this.mesh.position.y = floorHeight - 0.75;

	this.direction.x = player.yawObject.position.x - this.mesh.position.x;
	this.direction.z = player.yawObject.position.z - this.mesh.position.z;

	this.direction.x = this.direction.x / (Math.max(dist, 1));
	this.direction.z = this.direction.z / (Math.max(dist, 1));

	this.direction.x = (this.direction.x + this.force.x) * dt * 3;
	this.direction.z = (this.direction.z + this.force.z) * dt * 3;

	if(dist < 1.5) {
		HITARRAY[Math.randomRange(0, HITARRAY.length - 1)].play();

		player.health -= 350 * dt;

		if(player.health > 0) {
			fancylight.spotlight.intensity = 5;
		}

		player.yawObject.position.y += 0.1;
		player.velocity.x += Math.randomRangeFloat(-0.15, 0.15);
		player.velocity.y = (-player.velocity.y / 4) + 0.10 + Math.randomRangeFloat(-0.1, 0.1);
		player.velocity.z += Math.randomRangeFloat(-0.15, 0.15);

		for(var num = 0; num < Math.randomRange(5, 10); num++) {
			new Entities.Blood(player.yawObject.position, createRGB(255, 0, 0));
		}
	}

	var collided = false;
	for(var i = 0; i < Entities.Objects.length; i++) {
		if(Entities.Objects[i] != this && Entities.Objects[i] != player) {
			if(Entities.Objects[i].collider) {
				if(collision.boxHelper(this.mesh.position, this.mesh.scale, Entities.Objects[i].mesh.position, Entities.Objects[i].mesh.scale)) {
					collided = true;
					break;
				}
			}
		}
	}

	if(collided === false) {
		this.safeposition.copy(this.mesh.position);

		this.d.lerp(this.direction, dt * 8);
	} else {
		this.direction.x = -this.direction.x;
		this.direction.z = -this.direction.z;
		this.mesh.position.copy(this.safeposition);

		this.d.copy(this.direction);
	}

	this.mesh.translateX(this.d.x);
	this.mesh.translateZ(this.d.z);

	if(this.health <= 0 || currentFloor != this.level) {
		fancylight.spotlight.intensity = 5;
		DEATHSOUND.play();
		this.destroy();
	}
}

Entities.Enemy.prototype.destroy = function() {
	totalEnemies++;
	new Entities.Coin(this.mesh.position);
	for(var num = 0; num < Math.randomRange(16, 32); num++) {
		new Entities.Blood(this.mesh.position, this.mesh.material.color);
	}

	Entities.Objects.splice(Entities.Objects.indexOf(this), 1);
	scene.remove(this.mesh);
}

Entities.Blood = function(position, color) {
	this.position = new THREE.Vector3();
	if(position) this.position.copy(position);

	this.rotation = new THREE.Euler(0, Math.random() * 4, 0);

	var s = Math.randomRangeFloat(0.05, 0.15);
	this.scale = new THREE.Vector3(s, s, s);

	this.color = color || currentColor;

	this.velocity = new THREE.Vector3(Math.randomRangeFloat(-3, 3), Math.randomRangeFloat(2, 7), Math.randomRangeFloat(-3, 3));

	var geometry = new THREE.CubeGeometry(this.scale.x, this.scale.y, this.scale.z);
	var material = new THREE.MeshPhongMaterial({
		color: this.color,
		wireframe: false
	});

	this.mesh = new THREE.Mesh(geometry, material);
	this.mesh.position = this.position;
	this.mesh.rotation = this.rotation;
	this.mesh.castShadow = true;
	this.mesh.receiveShadow = true;

	this.level = currentFloor;

	scene.add(this.mesh);

	Entities.Objects.push(this);
}

Entities.Blood.prototype.update = function(dt) {
	this.velocity.x = Math.lerp(this.velocity.x, 0, dt * 1.5);
	this.velocity.z = Math.lerp(this.velocity.z, 0, dt * 1.5);

	this.mesh.position.x += this.velocity.x * dt;
	this.mesh.position.y += this.velocity.y * dt;
	this.mesh.position.z += this.velocity.z * dt;

	if(this.mesh.position.y < floorHeight - (1.05 - this.scale.y)) {
		this.mesh.position.y = floorHeight - (1.05 - this.scale.y);
	} else if(this.mesh.position.y < floorHeight - 1.05) {
		this.destroy();
	} else {
		this.velocity.y = Math.lerp(this.velocity.y, -9.81 - (Math.abs(Math.sin(this.mesh.position.x * 10000))), dt);
	}

	if(this.level < currentFloor - 1) this.destroy();

	this.scale.y -= dt / 50;

	if(this.scale <= 0) {

	}
}

Entities.Blood.prototype.destroy = function() {
	Entities.Objects.splice(Entities.Objects.indexOf(this), 1);
	scene.remove(this.mesh);
}

/*
	88888888ba   88
	88      "8b  88
	88      ,8P  88
	88aaaaaa8P'  88  ,adPPYYba,  8b       d8   ,adPPYba,  8b,dPPYba,
	88""""""'    88  ""     `Y8  `8b     d8'  a8P_____88  88P'   "Y8
	88           88  ,adPPPPP88   `8b   d8'   8PP"""""""  88
	88           88  88,    ,88    `8b,d8'    "8b,   ,aa  88
	88           88  `"8bbdP"Y8      Y88'      `"Ybbd8"'  88
	                                 d8'
	                                d8'
*/

Entities.Player = function(position, rotation, scale) {
	this.walkTime = 0;
	this.nextWalkLoop = 0.4;
	this.health = 100;
	this.punchCooldown = 0;
	this.position = position || new THREE.Vector3();
	this.safeHeight = floorHeight;
	this.currentGround;
	this.rotation = rotation || new THREE.Euler();
	this.scale = scale || new THREE.Vector3();

	this.safeposition = this.position;
	this.velocity = new THREE.Vector3();

	this.pitchObject = new THREE.Object3D();
	this.pitchObject.rotation.x = this.rotation.x
	this.pitchObject.add(camera);

	this.yawObject = new THREE.Object3D();
	this.yawObject.rotation.y = this.rotation.y;
	this.yawObject.add(this.pitchObject);

	scene.add(this.yawObject);

	Entities.Objects.push(this);
}

Entities.Player.prototype.update = function(dt) {
	if(gameover == false) {
		if(this.health > 0) {
			if(this.health < 100) {
				this.health += 1 * dt;
			} else {
				this.health = 100;
			}
		} else {
			if(gameover == false) {
				gameover = true;
				notifyGameOver();
			}
		}

		if(this.yawObject.position.y > this.safeHeight) {
			this.velocity.x = Math.lerp(this.velocity.x, 0, dt);
			this.velocity.y = Math.lerp(this.velocity.y, -9.81, dt / 16);
			this.velocity.z = Math.lerp(this.velocity.z, 0, dt);

		} else {
			if(this.velocity.y != 0) LANDSOUND.play();

			this.yawObject.position.y = this.safeHeight;
			this.safeposition.y = this.safeHeight;

			this.velocity.x = Math.lerp(this.velocity.x, 0, dt * 8);
			this.velocity.y = 0;
			this.velocity.z = Math.lerp(this.velocity.z, 0, dt * 8);

			if(input.keys.check("up")) {
				this.velocity.y += 0.25;
				JUMPSOUND.play();
			}

			if(input.keys.check("forward")) {
				this.walkTime += dt;
				this.velocity.z -= dt;
			} else if(input.keys.check("back")) {
				this.walkTime += dt;
				this.velocity.z += dt * 0.75;
			}

			if(input.keys.check("left")) {
				this.walkTime += dt;
				this.velocity.x -= dt;
			} else if(input.keys.check("right")) {
				this.walkTime += dt;
				this.velocity.x += dt;
			}

			if(this.walkTime > this.nextWalkLoop) {
				this.walkTime = 0;
				STEPARRAY[Math.randomRange(0, STEPARRAY.length - 1)].play();
			}
		}

		if(this.punchCooldown == 0) {
			if(input.mouse.check("punch")) {
				for(var i = 0; i < Entities.Objects.length; i++) {
					if(Entities.Objects[i] != this) {
						if(Entities.Objects[i].health) {
							if(Entities.Objects[i].mesh.position.distanceToSquared(this.yawObject.position) < 5) {
								Entities.Objects[i].force.x = (Entities.Objects[i].mesh.position.x - this.yawObject.position.x) * 5;
								Entities.Objects[i].force.z = (Entities.Objects[i].mesh.position.z - this.yawObject.position.z) * 5;
								Entities.Objects[i].health -= 5;

								for(var num = 0; num < Math.randomRange(2, 6); num++) {
									new Entities.Blood(Entities.Objects[i].mesh.position, Entities.Objects[i].mesh.material.color);
								}

								this.punchCooldown = 0.25;

								HITARRAY[Math.randomRange(0, HITARRAY.length - 1)].play();
							}
						}
					}
				}
			}
		}

		var collided = false;
		for(var i = 0; i < Entities.Objects.length; i++) {
			if(Entities.Objects[i] != this) {
				if(Entities.Objects[i].collider) {
					var newScale = new THREE.Vector3();
					newScale.copy(this.scale);
					newScale.y = newScale.y * 6;

					if(collision.boxHelper(this.yawObject.position, newScale, Entities.Objects[i].position, Entities.Objects[i].scale)) {
						if(Entities.Objects[i].position.y + Entities.Objects[i].scale.y / 2 < this.yawObject.position.y + this.scale.y / 2) {
							this.currentGround = Entities.Objects[i];
							this.safeHeight = Entities.Objects[i].position.y + (Entities.Objects[i].scale.y / 2) + (this.scale.y / 2) + 0.5;
							collided = false;
						} else {
							collided = true;
						}

						break;
					}
				}
			}
		}

		if(collided === false) {
			this.safeposition.copy(this.yawObject.position);
			if(this.currentGround) {
				var collisionPoint = new THREE.Vector3();
				collisionPoint.copy(this.yawObject.position);
				collisionPoint.y -= this.currentGround.scale.y / 2;

				if(!collision.boxHelper(collisionPoint, this.scale, this.currentGround.position, this.currentGround.scale)) {
					this.safeHeight = floorHeight + 0.5;
				}
			}
		} else {
			this.velocity.x = -this.velocity.x / 2;
			this.velocity.z = -this.velocity.z / 2;
			this.yawObject.position.copy(this.safeposition);
		}

		this.yawObject.translateX(this.velocity.x);
		this.yawObject.translateY(this.velocity.y);
		this.yawObject.translateZ(this.velocity.z);

		this.punchCooldown = Math.max(this.punchCooldown - dt, 0);
	}
}

Entities.Player.prototype.destroy = function() {
	Entities.Objects.splice(Entities.Objects.indexOf(this), 1);
}

/*
	88               88
	88               ""    ,d
	88                     88
	88  8b,dPPYba,   88  MM88MMM
	88  88P'   `"8a  88    88
	88  88       88  88    88
	88  88       88  88    88,
	88  88       88  88    "Y888
*/

function init() {
	scene.add(camera);

	ambience = new Entities.AmbienceController();

	player = new Entities.Player(new THREE.Vector3(0, 0, 0), new THREE.Euler(0, Math.rad(180), 0), new THREE.Vector3(0.5, 1.5, 0.5));

	generateRoom(1, -1, 100, createRGB(50, 200, 50), createRGB(75, 75, 75), createRGB(50, 200, 50), createRGB(235, 220, 205), 0.75);

	fancylight = new Entities.FancyLight(new THREE.Vector3(0, 350, 0));

	GAME.oncontextmenu = function(e) {
		e.preventDefault();
	};

	input.keys.add("left", 37);
	input.keys.add("right", 39);
	input.keys.add("forward", 38);
	input.keys.add("back", 40);

	input.keys.add("left", 65);
	input.keys.add("right", 68);
	input.keys.add("forward", 87);
	input.keys.add("back", 83);

	input.keys.add("up", 32);
	input.keys.add("down", 67);

	input.keys.add("shoot", 69);

	input.mouse.addKey("punch", 0);

	input.keys.debug = false;
	input.mouse.debug = false;

	new Entities.Floor(new THREE.Vector3(0, -5.5, 0), null, new THREE.Vector3(25, 1, 25), createRGB(5, 5, 5));
}
init();

function update() {
	DT = (Date.now() - LASTDT) / 1000;
	LASTDT = Date.now();
	TIME += DT;

	for(ent in Entities.Objects) {
		Entities.Objects[ent].update(DT);
	}

	if(currentFloor > 1 && CAVEAMBIENCESOUND.loop === false) {
		CAVEAMBIENCESOUND.loop = true;
		CAVEAMBIENCESOUND.play();
	}

	requestAnimationFrame(update);
	renderer.render(scene, camera);
}
update();

renderer.context.canvas.addEventListener("webglcontextlost", function(event) {
	event.preventDefault();
	cancelAnimationFrame(update);
}, false);

function onFullscreenChange(state) {
	if(state === true) {
		renderer.setSize(window.innerWidth, window.innerHeight);
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
	} else {
		renderer.setSize(WIDTH, HEIGHT);
		camera.aspect = WIDTH / HEIGHT;
		camera.updateProjectionMatrix();
	}
}

window.addEventListener("keydown", function(e) {
	if(e.keyCode === 70) {
		fullscreen.toggle(GAME, true, onFullscreenChange);
	} else if(e.keyCode === 107 || e.keyCode === 187) {
		SENSITIVITY = Math.min(SENSITIVITY + 0.0001, 0.01);
		console.log("MOUSE SENSITIVITY: " + SENSITIVITY);
	} else if(e.keyCode === 109 || e.keyCode === 189) {
		console.log(SENSITIVITY);
		SENSITIVITY = Math.max(SENSITIVITY - 0.0001, 0.0005);
		console.log("MOUSE SENSITIVITY: " + SENSITIVITY);
	}
}, false);

var onMouseMove = function(e) {
	var movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
	var movementY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;

	player.yawObject.rotation.y -= movementX * SENSITIVITY;
	player.pitchObject.rotation.x -= movementY * SENSITIVITY;

	player.pitchObject.rotation.x = Math.max(-Math.PI_2, Math.min(Math.PI_2, player.pitchObject.rotation.x));
}

document.addEventListener('mousemove', onMouseMove, false);

function notifyGameOver() {
	ambience.requestColor = createRGB(0, 0, 0);
	ambience.worldlightIntensity = 0;
	ambience.ambientlightColor = createRGB(0, 0, 0);
	ambience.ambientlight.color = ambience.ambientlightColor

	player.pitchObject.remove(camera);
	camera.position.set(0, 10, 0);

	var material = new THREE.MeshPhongMaterial({
		wireframe: false
	});

	var geometry = new THREE.TextGeometry("You have died in the depths", {
		size: 1,
		height: 0.25,
		bevelEnabled: true,
		bevelSize: 0.025,
		bevelThickness: 0.1,
		weight: 'normal'
	});
	var text = new THREE.Mesh(geometry, material);
	text.position = new THREE.Vector3(-8.5, 14, -15);
	scene.add(text);

	var geometry = new THREE.TextGeometry("Total coins collected : " + totalCoins, {
		size: 1,
		height: 0.25,
		bevelEnabled: true,
		bevelSize: 0.025,
		bevelThickness: 0.1,
		weight: 'normal'
	});
	var text = new THREE.Mesh(geometry, material);
	text.position = new THREE.Vector3(-7.5, 11.5, -15);
	scene.add(text);

	var geometry = new THREE.TextGeometry("Enemies slain : " + totalEnemies, {
		size: 1,
		height: 0.25,
		bevelEnabled: true,
		bevelSize: 0.025,
		bevelThickness: 0.1,
		weight: 'normal'
	});
	var text = new THREE.Mesh(geometry, material);
	text.position = new THREE.Vector3(-5.0, 8.5, -15);
	text.rotation.x = -0.1;
	scene.add(text);

	var geometry = new THREE.TextGeometry("Level reached : " + (currentFloor - 1), {
		size: 1,
		height: 0.25,
		bevelEnabled: true,
		bevelSize: 0.025,
		bevelThickness: 0.1,
		weight: 'normal'
	});
	var text = new THREE.Mesh(geometry, material);
	text.position = new THREE.Vector3(-5.25, 5.5, -15);
	text.rotation.x = -0.2;
	scene.add(text);
}
