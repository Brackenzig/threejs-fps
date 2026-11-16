export const $=id=>document.getElementById(id);
export function createHud(){const ctx=$('radar').getContext('2d');let hitTime;
 return {feed(text){const e=document.createElement('div');e.textContent=text;$('feed').prepend(e);while($('feed').children.length>4)$('feed').lastChild.remove();},
 // Headshots flash gold, a kill turns the marker red: the shooter reads the
 // result of every shot without looking away from the crosshair.
 hit(head,kill){const m=$('hitmarker');m.className=kill?'kill':head?'head':'';m.style.opacity=1;clearTimeout(hitTime);hitTime=setTimeout(()=>{m.style.opacity=0;m.className='';},150);},
 update(s,w,bots,body,world){
 $('amberScore').textContent=s.score.amber;$('tealScore').textContent=s.score.teal;$('round').textContent=`ROUND ${String(s.round).padStart(2,'0')} / FIRST TO 5`;
 const t=Math.ceil(Math.max(0,s.timer));$('timer').textContent=`${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;$('phase').textContent=(s.phase==='buy'?'REQUISITION':s.planted?'CHARGE ACTIVE':s.phase.toUpperCase())+(Math.max(s.score.amber,s.score.teal)===4&&s.phase!=='match'?' · MATCH POINT':'');$('health').textContent=s.health;$('armor').textContent=s.armor;$('money').textContent=`$ ${s.money.toLocaleString()} / ${s.kills} ELIMINATIONS`;$('weapon').textContent=w.current.name;$('ammo').textContent=w.state.mag;$('reserve').textContent='/ '+w.state.reserve;$('equipment').textContent=`G · ${s.grenade?'FRAGMENT READY':'NO GRENADE'} / ${w.state.reloadLeft>0?'RELOADING':'E · RELAY CHARGE'}`;$('buyCash').textContent=`AVAILABLE $${s.money} · ${Math.ceil(s.timer)}s remaining`;
 $('objective').textContent=s.phase==='buy'?'B · OPEN REQUISITION / PREPARE TO BREACH':s.planted?`RELAY ${s.site.name} ARMED · PREVENT DEFUSAL`:s.health<=0?'UNIT DOWN · SPECTATING THE YARD':'PLANT AT A OR B · HOLD E FOR 3 SECONDS';
 // The crosshair opens up with spread: still while aimed, wide while moving
 // or spraying, so stopping to aim is visible before the shot lands.
 const speed=Math.hypot(body.velocity.x,body.velocity.z);
 const gap=5+Math.round(w.spread(speed)*600);
 $('crosshair').style.setProperty('--cg',Math.min(26,gap)+'px');
 // Plant/defuse progress as a bar under the crosshair; it only shows while
 // someone is arming or disarming, so idle screenshots are unchanged.
 const prog=s.planted?s.defuse/6:s.plant/3;
 $('plantbar').style.opacity=prog>0?1:0;
 $('plantfill').style.width=`${Math.min(100,prog*100)}%`;
 ctx.clearRect(0,0,180,180);ctx.fillStyle='#193b3b';ctx.fillRect(0,0,180,180);ctx.strokeStyle='#52716b';ctx.strokeRect(8,8,164,164);ctx.fillStyle='#667b6b';for(const b of world.colliders){if(b.max.y<.1||b.min.y>2)continue;ctx.fillRect(90+b.min.x*4,90+b.min.z*4,(b.max.x-b.min.x)*4,(b.max.z-b.min.z)*4);}for(const site of world.sites){ctx.fillStyle='#edba70';ctx.font='bold 12px monospace';ctx.fillText(site.name,85+site.x*4,95+site.z*4);}for(const b of bots.items){if(!b.alive)continue;if(b.team==='teal'&&!s.planted&&b.g.position.distanceTo(body.position)>14)continue;ctx.fillStyle=b.team==='amber'?'#efc277':'#6fc5c3';ctx.beginPath();ctx.arc(90+b.g.position.x*4,90+b.g.position.z*4,3,0,7);ctx.fill();}ctx.save();ctx.translate(90+body.position.x*4,90+body.position.z*4);ctx.rotate(-body.yaw);ctx.fillStyle='#ffffff';ctx.beginPath();ctx.moveTo(0,-6);ctx.lineTo(-4,4);ctx.lineTo(4,4);ctx.fill();ctx.restore();
 }};
}
