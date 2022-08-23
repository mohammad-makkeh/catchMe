"use strict"

const scoreDisplay = document.querySelector(".score");
const sc = document.querySelector(".sc");
const currentWeapon = document.querySelector(".currentWeapon span");
const wrapper = document.querySelector(".wrapper");
const restartBtn = document.querySelector(".restart");
restartBtn.addEventListener("click",()=>{
	scoreDisplay.classList.remove("gameOver");
	restartBtn.classList.remove("show");
	loserSound.currentTime = 0;
	loserSound.pause();
	init();
})
const start = document.querySelector(".start");
let gameStarted = false;
start.addEventListener("click",()=>{
	wrapper.classList.add("hide");
	gameStarted = true;
	init();
})
const shotSound = document.querySelector(".shotSound");
const laserSound = document.querySelector(".laserSound");
const backgroundMusic = document.querySelector(".backgroundMusic");
const loserSound = document.querySelector(".loser");

backgroundMusic.volume = 0.1;
shotSound.volume = 0.2;
laserSound.volume = 0.125;
loserSound.volume = 1;

const audioBtn = document.querySelector(".audioBtn");
audioBtn.addEventListener("click",()=>{
	audioBtn.querySelector("i").classList.toggle("fa-volume-up");
	audioBtn.querySelector("i").classList.toggle("fa-volume-mute");
	backgroundMusic.muted = !backgroundMusic.muted;
	shotSound.muted = !shotSound.muted;
	laserSound.muted = !laserSound.muted;
	loserSound.muted = !loserSound.muted;

})

//get the canvas
const canvas = document.getElementById("canvas");
const c = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;

let pushedArrows = [];
let enemies = [];
let bullets = [];
let lasers = [];
let shazaya = [];
let player;
let n = 10;
let arsenal = ["Single Bullet", "Large Bullet", "Triple Bullets", "Riffle Gun", "Laser", "Explosive Laser", "Double Explosive Laser"];
let weaponIndex = 0;
let score = 0;
let l;
let ls;
let gameOver = false;
let breaks = false;
let fire = false; //for the riffleGun
let alreadyHarder = false;
let fireRate = 4;
let difficulty = 15;
let waveRate = 1000;
let interval;
let friction = 0.85;
let focus = "visible";

let mouse = {
	x : undefined,
	y : undefined
}

//getting the mouse x y:
window.addEventListener("mousemove",(e)=>{
	if(gameOver) return;
	mouse.x = event.clientX;
	mouse.y = event.clientY;
})


//shooting
window.addEventListener("click",(event)=>{
	if(gameOver || !gameStarted) return;
	mouse.x = event.clientX;
	mouse.y = event.clientY;		

	shotSound.currentTime = 0;
	laserSound.currentTime = 0;
	if(weaponIndex <=2 ){
		shotSound.play();
	}
	//riffle gunsound handled in the game loop
	else if(weaponIndex > 3){
		laserSound.play();
	}


	switch(arsenal[weaponIndex]){

		case "Single Bullet" : {
			let x = player.x;
			let y = player.y;
			let r = 8;
			let clr = "#fff"
			let dx = mouse.x - x;
			let dy = mouse.y - y;
			let angle = Math.atan2(dy, dx);
			let v = {
				x : Math.cos(angle) * 20,
				y : Math.sin(angle) * 20
			}
			bullets.push(new Bullet(x, y, r, clr, v));
			break;
		}	

		case "Large Bullet":{
			shotSound.volume = 0.3;
			let x = player.x;
			let y = player.y;
			let r = 15;
			let clr = "#fff"
			let dx = mouse.x - x;
			let dy = mouse.y - y;
			let angle = Math.atan2(dy, dx);
			let v = {
				x : Math.cos(angle) * 22,
				y : Math.sin(angle) * 22
			}
			bullets.push(new Bullet(x, y, r, clr, v));
			break;
		}
		
		case "Triple Bullets":{
			shotSound.volume = 0.4;
			//shoot triple bullets
			let x = player.x;
			let y = player.y;
			let r = 8;
			let clr = "#fff"
			//first bullet:
			let dx = mouse.x - x;
			let dy = mouse.y - y;
			let angle = Math.atan2(dy, dx);
			let v = {
				x : Math.cos(angle) * 20,
				y : Math.sin(angle) * 20
			}
			bullets.push(new Bullet(x, y, r, clr, v));

			//second bullet:
			dx = mouse.x - 20 - x;
			dy = mouse.y - 20 - y;
			angle = Math.atan2(dy, dx);
			v = {
				x : Math.cos(angle) * 20,
				y : Math.sin(angle) * 20
			}
			bullets.push(new Bullet(x, y, r, clr, v));

			//third bullet:
			dx = mouse.x + 20 - x;
			dy = mouse.y + 20 - y;
			angle = Math.atan2(dy, dx);
			v = {
				x : Math.cos(angle) * 20,
				y : Math.sin(angle) * 20
			}
			bullets.push(new Bullet(x, y, r, clr, v));
			break;
		}

		case "Riffle Gun":{
			shotSound.volume = 0.2;
			setFire();
			break;
		}

		case "Laser":{
			//note: I SPENT 2 HOURS MAKING AN EQUATION SYSTEM TO DETECT COLLISIONS BETWEEN
			//		A LINE AND A CIRCLE TO EMULATE LASER, THEN FIGURED OUT I COULD JUST SEND
			//		A QUICK INVISIBLE INDESTRUTABLE BULLET AND JUST DRAW THE LASER :(
			//But the laser works both ways.. 

			l = new LineEquation(mouse, {x: player.x, y: player.y});
			if(mouse.y > player.y){
				ls = l.intersects(new LineEquation({x:0,y:canvas.height}, {x:1, y:canvas.height}));
			}
			else{
				ls = l.intersects(new LineEquation({x:0,y:0}, {x:1, y:0}));
			}

			enemies.forEach((enemy, i)=>{
				if(l.intersects(enemy)){
					if
					(
						(
							(mouse.x > player.x && enemy.x > player.x) ||
							(mouse.x < player.x && enemy.x < player.x)
						)

						||

						(
							(mouse.y > player.y && enemy.y > player.y) ||
							(mouse.y < player.y && enemy.y < player.y)	
						)
					)
					{
						enemies.splice(i, 1);
						score += Math.floor(enemy.r * 10);
						sc.innerHTML = `${score}`;
						explode(enemy);

					}
				
				}
			})
			lasers.push(new Laser(ls));

			break;
			
		

		//we can alternatively send a ver fast bullet invisible invincible:			
			// let x = player.x;
			// let y = player.y;
			// let r = 8;
			// let clr = "#fff0"
			// let dx = mouse.x - x;
			// let dy = mouse.y - y;
			// let angle = Math.atan2(dy, dx);
			// let v = {
			// 	x : Math.cos(angle) * 35,
			// 	y : Math.sin(angle) * 35
			// }
			// bullets.push(new Bullet(x, y, r, clr, v, true));	
			// break;
		}

		case "Explosive Laser":{
			l = new LineEquation(mouse, {x: player.x, y: player.y});
			if(mouse.y > player.y){
				ls = l.intersects(new LineEquation({x:0,y:canvas.height}, {x:1, y:canvas.height}));
			}
			else{
				ls = l.intersects(new LineEquation({x:0,y:0}, {x:1, y:0}));
			}

			enemies.forEach((enemy, i)=>{
				if
				(
					(
						(mouse.x > player.x && enemy.x > player.x) ||
						(mouse.x < player.x && enemy.x < player.x)
					)

					||

					(
						(mouse.y > player.y && enemy.y > player.y) ||
						(mouse.y < player.y && enemy.y < player.y)	
					)
				)
				{	
					if(l.intersects(enemy)){
						enemies.splice(i, 1);
						score += Math.floor(enemy.r * 10);
						sc.innerHTML = `${score}`;

						//enemy explodes into bullets:
						for( let i = 0 ; i < Math.floor(enemy.r * 0.5) ; i++ ){
							
							let v = {
								x :   (Math.random() - 0.5) * (Math.random() * 20 + 16),
								y :   (Math.random() - 0.5) * (Math.random() * 20 + 16)
							}
							let decay = 0.965;
							bullets.push(new Bullet(enemy.x, enemy.y, 5, "#fff", v, false, decay));
						}
					}
				
				}
			})
			let explosive = true;
			lasers.push(new Laser(ls, explosive));

			break;
		}

		case "Double Explosive Laser" :{
			laserSound.volume = 0.185;
			backgroundMusic.volume = 0.2;
			l = new LineEquation(mouse, {x: player.x, y: player.y});
			
			let ls1 = l.intersects(new LineEquation({x:0,y:canvas.height}, {x:1, y:canvas.height}));
					
			let ls2 = l.intersects(new LineEquation({x:0,y:0}, {x:1, y:0}));
			

			enemies.forEach((enemy, i)=>{
				if(l.intersects(enemy)){
					
					enemies.splice(i, 1);
					score += Math.floor(enemy.r * 10);
					sc.innerHTML = `${score}`;

					//enemy explodes into bullets:
					for( let i = 0 ; i < Math.floor(enemy.r * 0.4) ; i++ ){
						
						let v = {
							x :   (Math.random() - 0.5) * (Math.random() * 20 + 16),
							y :   (Math.random() - 0.5) * (Math.random() * 20 + 16)
						}
						let decay = 0.965;
						bullets.push(new Bullet(enemy.x, enemy.y, 5, "#fff", v, false, decay));
					}
				}
			})
			lasers.push(new Laser(ls1));
			lasers.push(new Laser(ls2));

			break;
		}

	}
});

	


window.addEventListener("resize",()=>{
	canvas.width = innerWidth;
	canvas.height = innerHeight;
	// init();
});

function setFire(){
	if(gameOver) return;
	window.addEventListener("mousedown",()=>{
		fire = true;
	})

	window.addEventListener("mouseup",()=>{
		fire = false;
	})
}











		


class Player{

	constructor(x, y, r, clr, speed){
		this.x = x;
		this.y = y;
		this.r = r;
		this.clr = clr;
		this.speed = speed;
		this.v = { x : 0, y :0 };
	}

	draw(){
		c.beginPath();
		c.fillStyle = this.clr;
		c.arc(this.x, this.y, this.r, 0, Math.PI*2, false);
		c.shadowBlur = 10;
		c.shadowColor = '#fff';
		c.fill();
		c.shadowBlur = 0;
		c.shadowColor = '#FD010000';
	}

	update(){
		if (keys[map.get("w")]) {
	        if (this.v.y > -this.speed) {
	            this.v.y--;
	        }
	    }
	    
	    if (keys[map.get("s")]) {
	        if (this.v.y < this.speed) {
	            this.v.y++;
	        }
	    }
	    if (keys[map.get("d")]) {
	        if (this.v.x < this.speed) {
	            this.v.x++;
	        }
	    }
	    if (keys[map.get("a")]) {
	        if (this.v.x > -this.speed) {
	            this.v.x--;
	        }
	    }

	    this.v.y *= friction;
	    this.y += this.v.y;
	    this.v.x *= friction;
	    this.x += this.v.x;

	    this.x = this.x + this.r > canvas.width ? canvas.width - this.r : this.x; 
	    this.x = this.x - this.r < 0 ? this.r : this.x; 

	    this.y = this.y + this.r > canvas.height ? canvas.height - this.r : this.y; 
	    this.y = this.y - this.r < 0 ? this.r : this.y; 


		this.draw();
	}
}

class Enemy{
	constructor(x, y, r, clr, v, player){
		this.x = x;
		this.y = y;
		this.r = r;
		this.clr = clr;
		this.v = v;
		this.player = player
		this.factor = (40 / this.r) > 1 ? (40 / this.r) * 0.75 : (40 / this.r); 
	}
	draw(){
		c.beginPath();
		c.fillStyle = this.clr;
		c.arc(this.x, this.y, this.r, 0, Math.PI*2, false);
		c.fill();
	}

	move(){
		this.x -= this.v.x;
		this.y -= this.v.y;
	}

	update(){
		let dx = this.x - player.x;
		let dy = this.y - player.y;
		let angle = Math.atan2(dy, dx);
		this.v.x = Math.cos(angle) * this.factor;
		this.v.y = Math.sin(angle) * this.factor;
		this.draw();
		this.move();
	}	

}

class Shazeyye{
	constructor(x, y, r, clr, v){
		this.x = x;
		this.y = y;
		this.r = r;
		this.clr = clr;
		this.v = v;
		this.alpha = 1; 
	}

	draw(){
		c.save();
		c.beginPath();
		c.globalAlpha = this.alpha;
		c.fillStyle = this.clr;
		c.arc(this.x, this.y, this.r, 0, Math.PI*2, false);
		c.fill();
		c.restore();
	}

	move(){
		this.x += this.v.x;
		this.y += this.v.y;
		this.alpha -= 0.02;
	}

	update(){
		this.move();
		this.draw();
	}	


}

class Bullet{
	constructor(x, y, r, clr, v, invincible = false, decay = 1){
		this.x = x;
		this.y = y;
		this.r = r;
		this.clr = clr;
		this.v = v;
		this.invincible = invincible;
		this.decay = decay;
	}

	draw(){
		c.beginPath();
		c.fillStyle = this.clr;
		c.arc(this.x, this.y, this.r, 0, Math.PI*2, false);
		c.fill();
	}

	move(){
		this.x += this.v.x;
		this.y += this.v.y;
	}

	update(){
		this.v.x *= this.decay;
		this.v.y *= this.decay;
		this.move();
		this.draw();
	}	

}


//(d-c)/(a-b), (a*(d-c)/(a-b))+c

class LineEquation{
	constructor(p1, p2){
		this.a = (p2.y - p1.y) / (p2.x - p1.x);
		this.b = p1.y - this.a * p1.x;
	}
	intersects(target){
		if(target instanceof Enemy){
			let a = 1 + this.a * this.a;
			let b = -2*target.x + 2*this.a*this.b -2*this.a*target.y;
			let c = this.b*this.b -2*this.b*target.y + target.y*target.y - target.r*target.r + target.x*target.x;
			
			let delta = b*b - 4*a*c;
			return delta >= 0;
		}
		return {
			x: (target.b - this.b) / (this.a - target.a),
			y: (this.a * (target.b - this.b) / (this.a - target.a)) + this.b
		}
	}
}

class Laser{
	constructor(ls){
		this.ls = ls;
		this.time = 5;
	}
	draw(){
		c.strokeStyle = "#f00";
		c.beginPath();
		c.moveTo(player.x, player.y);
		c.lineWidth = 5;
		c.lineTo(this.ls.x, this.ls.y);
		c.shadowBlur = 10;
		c.shadowColor = '#FD0100';
		c.stroke();
		c.shadowBlur = 0;
		c.shadowColor = '#FD010000';
	}
	update(){
		if(this.time)
			this.draw();
		this.time -= 1;
	}
}




function fillEnemies(n){



	for(let i = 0 ; i < n ; i++){
		let inc = weaponIndex == 5 ? 2 : 1;
		let fiftyfifty = Math.random() * 2 - 1 < 0 ? 0 : 1;
		let fiftyfifty2 = Math.random() * 2 - 1 < 0 ? 0 : 1;
		let x, y;
		if(fiftyfifty2){
			x = canvas.width * fiftyfifty;
			y = Math.random() * canvas.height;
		}
		else{
			x = Math.random() * canvas.width;
			y = canvas.height * fiftyfifty;
		}
		
		

		let r = Math.random() * 25 + 15;
		let clr = `hsl(${Math.random()*360}, ${Math.random()*100 + 50}%, 60%)`;
		let dx = x - player.x;
		let dy = y - player.y;
		let angle = Math.atan2(dy, dx);
		let v = {
			x : Math.cos(angle) * (difficulty / 7),
			y : Math.sin(angle) * (difficulty / 7)
		}

		enemies.push(new Enemy(x, y, r, clr, v, player));
	}
}


function explode(enemy){
	if(weaponIndex >= 5) return;
	for(let i = 0; i < enemy.r ; i++){
		shazaya.push(new Shazeyye(enemy.x, enemy.y , Math.random() * 1.5 + 0.5, enemy.clr, { x: (Math.random() - 0.5)*( (Math.random()*5)+3 ),
				y: (Math.random() - 0.5)*( (Math.random()*5)+3 )}));
	}
}

function makeItHarder(){
	if(alreadyHarder) return;
	alreadyHarder = true;
	clearInterval(interval);
	waveRate = 5000;
	interval = setInterval(function() {
		if(focus == "visible"){		//to avoid creating enemies when out of the game tab 
			n += difficulty;
			difficulty += 2;
			fillEnemies(n);
		}
	}, waveRate);
}



function init(){
	backgroundMusic.volume = 0.1;
	shotSound.volume = 0.2;
	laserSound.volume = 0.125;
	loserSound.volume = 1;
	gameOver = false;
	alreadyHarder = false;
	score = 0;
	sc.innerHTML = score;
	weaponIndex = 0;
	difficulty = 7;
	waveRate = 10000;
	bullets = [];
	enemies = [];
	lasers = [];
	shazaya = [];
	player = new Player(canvas.width/2, canvas.height/2, 15, "#fff", 20 );
	n  = 10;
	fillEnemies(n);
	interval = setInterval(function() {
		if(focus == "visible"){		//to avoid creating enemies when out of the game tab 
			n += difficulty;
			if(weaponIndex==6)
				difficulty += 2;
			fillEnemies(n);
		}
	}, waveRate);

	backgroundMusic.play();
	gameLoop();

}



//get the eq of the circle
//sub eq of line l in the eq of circle
//check if delta >= 0 then boom

function gameLoop(){
	let raf = requestAnimationFrame(gameLoop);

	if(weaponIndex!=3)
		fire = false; //done with the riffleGun

	if(fire && (raf % fireRate) == 0){
		let x = player.x;
		let y = player.y;
		let r = 4;
		let clr = "#ff0"
		let dx = mouse.x - x;
		let dy = mouse.y - y;
		let angle = Math.atan2(dy, dx);
		let v = {
			x : Math.cos(angle) * 20,
			y : Math.sin(angle) * 20
		}
		shotSound.currentTime = 0;
		bullets.push(new Bullet(x, y, r, clr, v));
		shotSound.play();
	}

	
	if(score > 300000){ //double explosive laser
		weaponIndex = 6;
		makeItHarder();	
	} 

	else if(score > 200000) //explosive laser
		weaponIndex = 5;

	else if(score > 140000) //laser
		weaponIndex = 4

	else if(score > 80000) //riffle gun
		weaponIndex = 3;

	else if(score > 30000) //triple bullet
		weaponIndex = 2;

	else if(score > 10000) //large bullet
		weaponIndex = 1;

	currentWeapon.innerHTML = arsenal[weaponIndex];



	c.fillStyle = "#0006";
	if(fire) c.fillStyle = "#000";
	c.fillRect( 0, 0, canvas.width, canvas.height )
	
	player.update();

	bullets.forEach((bullet, i)=>{
		bullet.update();
		if(bullet.x > canvas.width || bullet.x < 0 ||
		   bullet.y > canvas.height || bullet.y < 0){
			bullets.splice(i, 1);
		}
	});

	enemies.forEach((enemy, eIndex)=>{
		enemy.update()
		let dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
		if(dist - enemy.r - player.r < 1){
			gameOver = true;
			backgroundMusic.pause();
			loserSound.play();
			cancelAnimationFrame(raf);
			scoreDisplay.classList.add("gameOver");
			restartBtn.classList.add("show");
			clearInterval(interval);
		}

		bullets.forEach((bullet, bIndex)=>{
			dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
			if(dist - bullet.r - enemy.r < 1){
				score += Math.floor(enemy.r * 10);
				sc.innerHTML = `${score}`;

				enemies.splice(eIndex, 1);
				if(bullet.invincible==false)
					bullets.splice(bIndex, 1);
				explode(enemy);
			}
			//remove small decay bullets
			if(bullet.decay != 1 && (Math.abs(bullet.v.x < 2) && Math.abs(bullet.v.y < 2))){
				bullets.splice(bIndex, 1);	
			}
		})
	});


	lasers.forEach((laser, i)=>{
		if(laser.time > 0)
			laser.update();
		else{
			lasers.splice(i, 1);
		}
	})
	
	shazaya.forEach((shazeyye, i)=>{
		if(shazeyye.alpha <= 0.2)
			shazaya.splice(i, 1);
		else{
			shazeyye.update();
		}
	})
}




//moving:
let mapObj = {
	"w" : 1,
	"d" : 2,
	"s" : 3,
	"a" : 4,
}

let keys = [];

let map = new Map(Object.entries(mapObj));

window.addEventListener("keydown", (e)=>{

	let k = e.key.toLowerCase();
	if(k == "m")
		audioBtn.click();

	if(gameOver){
		if(k == " ")
			restartBtn.click();
	}

	if(map.get(k))
		keys[map.get(k)] = true;
	if(k == "shift")
		friction = 0.93;

});

window.addEventListener("keyup", (e)=>{
	let k = e.key.toLowerCase();
	if(map.get(k))
		keys[map.get(k)] = false;
	if(k == "shift")
		friction = 0.85;

});



document.addEventListener('visibilitychange', function(){
   focus = document.visibilityState;
});

window.addEventListener("load",()=>{
	loserSound.volume = 0;
	loserSound.play();
})







//temporary code to snapshot a logo only

// function takeASnap(){
// 	const img = canvas.toDataURL();
// 	const link = document.createElement('a');
// 	document.body.appendChild(link);
// 	link.href = img;
// 	link.download = 'catchMeLogo.png';
// 	link.click();
// 	document.body.removeChild(link);
// }

// window.addEventListener("keydown",e=>{
// 	if(e.key=="c"){
// 		takeASnap();
// 	}
// });
