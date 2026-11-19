// Underhall, the hall under the bluff and the battle arena: a round stone floor, a raised dais of humming
// crystals, braziers and a broken wall of niches.
// A scene for the generator in engine/gen/genmain.js. It must stay self-contained: the generator hands this function to a
// Web Worker as text, so it can use only what it takes from the kit `K`.
export default function (K) {
const {C,G0,HT,n2,prim,sm,ball,cap,ell,foot,cyl,box,crag,pillar}=K;
return {name:'Underhall',ry0:0,focus:[0,5,0],bg:[10,13,24],LD:[-0.4,0.75,-0.52],amb:[0.31,0.35,0.5],sun:[0.66,0.72,0.95],level:null,pv:[0.04,0.5,0.03],pcol:[120,255,226],pn:26,tile:[[98,104,116],[84,90,104],[40,44,58]],
foot:(x,z)=>Math.hypot(x-C,z-C)-33+1.8*n2(x*0.12+5,z*0.12),
h:(x,z)=>{const v=z-C;let h=G0+1;if(v>15){const f=(v-15)/4.5;h+=Math.round((f>1?1:f)*3)/3*2.25;}return h;},
bot:(x,z)=>G0-6-3.2*n2(x*0.1,z*0.1)-1.3*n2(x*0.45,z*0.45)-7*sm(20,0,Math.hypot(x-C,z-C)),
top:(sx,sy,sz,j)=>{const u=sx-C,v=sz-C,r=Math.hypot(u,v);if(v<14.5&&r<11.6){if(Math.abs(r-11)<0.42||Math.abs(r-6.4)<0.3)return 31;if(r>6.4){const k=Math.atan2(v,u)/(Math.PI/4),f=k-Math.floor(k);if(Math.abs(f-0.5)*r<0.36)return 31;}else if(r<1.3)return 31;}
return n2(sx*0.2+9,sz*0.2)>0.8&&r>15?18:97;},
side:(sx,sy,sz,j)=>sy>HT[j]-3?98:3,
scatter:()=>{},init(){},
build(){const LT=this.lights=[];this.emit=[];const g=G0+1,gp=g+2.25;
const brazier=(x,z,y)=>{cyl(x,z,y-0.3,y+0.5,1.1,0.9,98);cyl(x,z,y+0.5,y+3,0.3,0.3,56);cyl(x,z,y+3,y+3.9,0.7,1.5,56);ell(x,y+4.5,z,1.0,1.1,1.0,11);ball(x,y+4.1,z,0.8,10);LT.push([x,y+5,z,1.6,1,0.6,0.28]);};
// rear wall: an arc of stone blocks with dark niches
for(let i=0;i<9;i++){const a=Math.PI*(0.14+i*0.09),x=C+Math.cos(a)*29.5,z=C+Math.sin(a)*29.5,ra=a-Math.PI/2,hh=13+2.5*n2(i*1.7,3)-(i===0||i===8?5:0);
box(x,gp+hh/2-0.6,z,4.6,hh/2,1.5,98,0.15,ra);box(x,gp+hh-0.4,z,4.9,0.5,1.9,4,0.1,ra);
if(i%2===1){const nx=C+Math.cos(a)*28.2,nz=C+Math.sin(a)*28.2;box(nx,gp+4.2,nz,1.7,4,0.5,36,0.05,ra);box(nx,gp+8.6,nz,2.1,0.4,0.7,4,0.05,ra);}}
pillar(C-13,C+21,gp-0.4,13);pillar(C+13,C+21,gp-0.4,13);pillar(C-24,C+10,g-0.4,12);pillar(C+24,C+10,g-0.4,12);pillar(C-27,C-6,g-0.4,5.5,1);pillar(C+27.5,C-7,g-0.4,4,1);
cap(C-21,g+1.2,C-13,C-14.5,g+1.2,C-17,1.5,98);cap(C+19,g+1.1,C-16,C+23,g+1.1,C-13.5,1.4,98);
brazier(C-19,C+9,g);brazier(C+19,C+9,g);brazier(C-8,C+23,gp);brazier(C+8,C+23,gp);
// the humming crystals at the back
for(const q of[[0,25,9.5,1.5,0],[-2.2,24,6,1.1,0.3],[2.4,24.4,7,1.2,-0.25],[-0.9,22.6,3.6,0.8,0.1],[1.3,22.4,4.2,0.8,-0.1],[-3.6,25.6,3.8,0.9,0.4],[3.9,25.8,4.4,0.9,-0.4]]){const x=C+q[0],z=C+q[1];
prim(x-4,x+4,gp-0.5,gp+q[2]+1,z-3,z+3,31,(X,Y,Z)=>{const t=(Y-gp)/q[2],cx=x+q[4]*(Y-gp);return Math.max(Math.hypot(X-cx,Z-z)-q[3]*(1-t*0.92),gp-0.4-Y,Y-gp-q[2])*0.7;});}
box(C,gp+0.3,C+24.4,5.6,0.5,3,98,0.2);LT.push([C,gp+5,C+21,1.5,0.3,0.95,0.85]);LT.push([C,g+2,C,0.9,0.3,0.95,0.85]);
for(const q of[[-26,3,1.9,2],[25.5,1.5,1.6,5],[-17,-22,1.7,7],[15,-24,1.5,3],[-8,-27,1.2,4],[28,-1,1.2,6],[-29,8,1.3,8],[6,-28.5,1,9]])crag(C+q[0],g+q[2]*0.3,C+q[1],q[2]*1.2,q[2],q[2]*1.1,3,q[3]);
for(const q of[[-23.5,-2,2.6],[22,-9,2.2],[-12,-23,1.8],[11,26.5,2.4],[-15.5,24.5,2]]){const y=q[1]>15?gp:g;cyl(C+q[0],C+q[1],y-0.3,y+q[2],0.75,0.06,3);}
this.birds=null;}};
}
