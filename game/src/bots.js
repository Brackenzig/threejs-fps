import * as THREE from 'three';
// Route graph keeps patrols in the map's three lanes. Sight and hearing interrupt patrols.
// Bot roles: defenders hold a site anchor and scan its approach, rotating to a
// planted relay; attackers push a site, and while a teammate plants the other
// holds a covering angle instead of crowding the relay. Each bot fires on its
// own weapon profile (damage + fire rate) after a short reaction delay, so a
// bot that just spotted you does not hit instantly.
const PROFILES = [
  { damage: 34, coolMin: 0.6, coolMax: 1.1 },   // Vela, amber rifle
  { damage: 24, coolMin: 0.32, coolMax: 0.6 }, // Moss, amber smg
  { damage: 34, coolMin: 0.6, coolMax: 1.1 },  // Kestrel, teal rifle
  { damage: 24, coolMin: 0.32, coolMax: 0.6 }, // Iris, teal smg
  { damage: 30, coolMin: 0.45, coolMax: 0.85 }, // Slate, teal rifle
];
const NAMES = ['Vela', 'Moss', 'Kestrel', 'Iris', 'Slate'];
// Defender anchors: Iris holds A, Slate holds B, Kestrel roams mid.
const ANCHORS = [null, null, new THREE.Vector3(0, 0, -5), new THREE.Vector3(-10, 0, -8), new THREE.Vector3(10, 0, -8)];

export function createBots(scene, world, random) {
 const items=[], hitMeshes=[], ray=new THREE.Raycaster(), origin=new THREE.Vector3(), dir=new THREE.Vector3();
 const nodes=[]; for(const z of [16,6,-5,-11,-16]) for(const x of [-13,0,13]) nodes.push(new THREE.Vector3(x,0,z));
 function nearest(p){let n=0,d=Infinity;nodes.forEach((v,i)=>{const q=v.distanceToSquared(p);if(q<d){d=q;n=i;}});return n;}
 function route(p,target){const start=nearest(p),end=nearest(target),queue=[start],prev=new Map([[start,-1]]);for(let k=0;k<queue.length;k++){const n=queue[k];if(n===end)break;for(const j of [n-3,n+3,...(n%3>0?[n-1]:[]),...(n%3<2?[n+1]:[])])if(j>=0&&j<15&&!prev.has(j)){prev.set(j,n);queue.push(j);}} const out=[target.clone()];let n=end;while(n!==-1&&n!==undefined){out.unshift(nodes[n]);n=prev.get(n);}return out;}
 for(let i=0;i<5;i++){
  const team=i<2?'amber':'teal',g=new THREE.Group();const cloth=new THREE.MeshStandardMaterial({color:team==='amber'?0xc99548:0x3a9695,roughness:.85}),dark=new THREE.MeshStandardMaterial({color:0x172a2b});
  function part(w,h,d,x,y,z,mat=cloth,head=false){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;g.add(m);if(head||y===1.08){m.userData.part=head?'head':'body';hitMeshes.push(m);}return m;}
  const torso=part(.57,.65,.32,0,1.08,0);part(.46,.4,.39,0,1.12,-.02,dark);const head=part(.34,.35,.34,0,1.62,0,cloth,true);part(.28,.11,.02,0,1.63,-.18,dark);const legs=[part(.2,.7,.23,-.17,.37,0,dark),part(.2,.7,.23,.17,.37,0,dark)];part(.16,.55,.16,-.38,1.08,-.1);part(.16,.55,.16,.38,1.08,-.1);part(.12,.14,.72,.25,1.13,-.4,dark);
  const b={id:i,name:NAMES[i],team,g,legs,health:100,alive:true,path:[],goal:new THREE.Vector3(),cool:0,think:0,hold:0,react:0,hadEnemy:false,holding:false,scanYaw:undefined,profile:PROFILES[i],anchor:ANCHORS[i]};for(const mesh of hitMeshes)if(mesh.parent===g)mesh.userData.bot=b;scene.add(g);items.push(b);
 }
 function reset(){items.forEach((b,i)=>{b.health=100;b.alive=true;b.g.visible=true;b.g.rotation.set(0,0,0);b.g.position.set(i<2?(i===0?-13:13):[-13,0,13][i-2],0,i<2?16:-16); b.path=[];b.hold=0;b.cool=1+random();b.think=0;b.react=0;b.hadEnemy=false;b.holding=false;b.scanYaw=undefined;});}
 function visible(a,p){origin.copy(a);origin.y+=1.4;dir.copy(p);dir.y+=1.2;dir.sub(origin);const d=dir.length();ray.set(origin,dir.normalize());ray.far=d;return !ray.intersectObjects(world.shootables,false).length;}
 function damage(b,n){if(!b.alive)return false;b.health-=n;if(b.health<=0){b.alive=false;b.g.rotation.z=1.5;b.g.position.y=.12;return true;}return false;}
 function step(dt,s,body,onPlayer,onKill){
  for(const b of items){if(!b.alive)continue;b.cool-=dt;b.think-=dt;b.react-=dt;
   let enemy=null,dist=Infinity;
   if(b.team==='teal'&&s.health>0){const d=b.g.position.distanceTo(body.position);if(d<29&&visible(b.g.position,body.position)){enemy={player:true,pos:body.position};dist=d;}}
   for(const other of items)if(other.alive&&other.team!==b.team){const d=b.g.position.distanceTo(other.g.position);if(d<dist&&d<28&&visible(b.g.position,other.g.position)){enemy={bot:other,pos:other.g.position};dist=d;}}
   if(enemy){if(!b.hadEnemy){b.react=.28+random()*.45;b.hadEnemy=true;}b.g.rotation.y=Math.atan2(b.g.position.x-enemy.pos.x,b.g.position.z-enemy.pos.z);if(b.cool<=0&&b.react<=0){b.cool=b.profile.coolMin+random()*(b.profile.coolMax-b.profile.coolMin);if(random()<Math.max(.14,.72-dist*.018)){if(enemy.player)onPlayer(Math.round(b.profile.damage*.4)+Math.floor(random()*5));else if(damage(enemy.bot,b.profile.damage))onKill(b,enemy.bot);}}if(dist<15)continue;}
   else b.hadEnemy=false;
   if(b.think<=0){b.think=2+random()*2;let target;b.holding=false;b.scanYaw=undefined;
    if(s.planted)target=new THREE.Vector3(s.site.x,0,s.site.z);
    else if(b.team==='amber'){
     // Cover the planter: hold a firing angle 6m short of the relay instead
     // of standing on top of the teammate who is arming it.
     const planter=items.find(o=>o!==b&&o.alive&&o.team==='amber'&&o.hold>0);
     if(planter){const a=world.sites.reduce((best,site)=>Math.hypot(planter.g.position.x-site.x,planter.g.position.z-site.z)<Math.hypot(planter.g.position.x-best.x,planter.g.position.z-best.z)?site:best);target=new THREE.Vector3(a.x,0,a.z+6);b.holding=true;}
     else target=new THREE.Vector3(b.id===0?-10:10,0,-11);
    }
    else if(s.noise&&s.noise.time>0)target=s.noise.pos;
    else if(b.anchor){target=b.anchor.clone();b.holding=true;}
    else {const lane=[-13,0,13][b.id-2];target=new THREE.Vector3(lane,0,random()>.45?6:-11);}
    b.path=route(b.g.position,target);while(b.path.length&&b.path[0].distanceTo(b.g.position)<1)b.path.shift();}
   // Holding an anchor or a cover angle: stand, face the approach, scan it.
   if(b.holding&&b.path.length===0){if(b.scanYaw===undefined)b.scanYaw=b.team==='teal'?Math.atan2(b.g.position.x,b.g.position.z-16):0;b.g.rotation.y=b.scanYaw+Math.sin(s.elapsed*.6+b.id*1.7)*.55;continue;}
   const p=b.path[0];if(p){const dx=p.x-b.g.position.x,dz=p.z-b.g.position.z,d=Math.hypot(dx,dz);if(d<.25)b.path.shift();else{const speed=enemy?1.2:2.6,step=Math.min(d,speed*dt);b.g.position.x+=dx/d*step;b.g.position.z+=dz/d*step;b.g.rotation.y=Math.atan2(-dx,-dz);b.legs[0].rotation.x=Math.sin(s.elapsed*9+b.id)*.42;b.legs[1].rotation.x=-b.legs[0].rotation.x;}}}
 }
 reset();return {items,hitMeshes,reset,step,damage,visible};
}
