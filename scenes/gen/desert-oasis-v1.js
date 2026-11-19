// Desert oasis, first version: Stepped mesas with carved stairs, a colonnade and a cliff doorway, a rock arch, a palm-ringed pool, a camp with camels and a well.
// The prototype replaced it with a later Desert oasis (desert-oasis.js) and never showed this one.
// A scene for the generator in engine/gen/genmain.js. It must stay self-contained: the generator hands this function to a
// Web Worker as text, so it can use only what it takes from the kit `K`.
export default function (K) {
const {NU,C,G0,G,mu,h3,n2,n3,prim,sm,hAt,sdBox,ball,cap,ell,foot,cyl,box,palm,steps,lamp}=K;
function camel(x,z,ra){const b=hAt(x,z),c=Math.cos(ra),s=Math.sin(ra),P=(u,v)=>[x+u*c-v*s,z+u*s+v*c];let p=P(-1.7,0),q=P(1.7,0);cap(p[0],b+3.7,p[1],q[0],b+3.7,q[1],1.3,43);ell(x,b+5.1,z,1.2,0.9,1.1,43);box(x,b+5.2,z,0.9,0.5,1.25,23,0.2,ra);
p=P(2.5,0);q=P(3.7,0);cap(p[0],b+4.2,p[1],q[0],b+6.5,q[1],0.55,43);p=P(4.4,0);ball(p[0],b+6.7,p[1],0.75,43);for(const u of[-1.6,1.6])for(const v of[-0.7,0.7]){p=P(u,v);cap(p[0],b-0.3,p[1],p[0],b+3,p[1],0.42,43);}}
return {name:'Desert oasis',water:[40,150,160],cap:'Stepped mesas with carved stairs, a colonnade and a cliff doorway, a rock arch, a palm-ringed pool, a camp with camels and a well.',bg:[20,14,22],LD:[-0.55,0.66,0.5],amb:[0.5,0.48,0.6],sun:[1.25,1.05,0.76],level:G0-1.6,pv:[2.5,0.1,1],pcol:[240,214,160],pn:30,foot,
h:(x,z)=>{let h=G0+2.5*n2(x*0.06,z*0.06)+0.6*Math.sin((x+z*0.5)*0.5);const r1=Math.hypot(x-(C-16),z-(C-16))/(18+7*n2(x*0.09,z*0.09));if(r1<1)h+=Math.floor((1-r1)*3.4+0.75)*7;
const r2=Math.hypot(x-(C+28),z-(C-26))/(8+3*n2(x*0.15,z*0.15));if(r2<1)h+=Math.floor((1-r2)*2+0.8)*7;return(G0-5.5)+(h-(G0-5.5))*sm(0.8,1.3,G.pd(x,z));},
bot:(x,z)=>G0-12-3*n2(x*0.2,z*0.2),
top:(sx,sy,sz,j,hv)=>{const pd=G.pd(sx,sz);if(pd<1.4)return sy<G0-1?32:1;if(sy>G0+5)return 21;return(G.P[mu(sx,sz)]&&hv>0.2)?46:20;},side:()=>21,
fix:(mm,sx,sy,sz,nx,ny,nz,hv)=>(mm===7&&ny>0.5&&hv<0.04)?16:mm,
scatter:(mm,sx,sy,sz,hv,a)=>{if(mm===1){if(hv<0.45)a(sx,sy+0.8+hv*2.5,sz,15);if(hv>0.9)for(let q=1;q<5;q++)a(sx,sy+q*0.8,sz,14);}else if(mm===20&&hv>0.988){a(sx,sy+0.7,sz,45);a(sx+0.5,sy+1.3,sz,45);a(sx-0.4,sy+1.2,sz+0.4,45);}},
init(){G.pd=(x,z)=>Math.hypot(x-(C+12),z-(C+14))/(9+3*n2(x*0.15+20,z*0.15));G.P=new Uint8Array(NU*NU);
const ln=(a,b,c,d)=>{for(let f=0;f<=1;f+=0.01){const w=2*Math.sin(f*6.28),x=Math.round(a+(c-a)*f+w),z=Math.round(b+(d-b)*f-w);for(let p=-1;p<=1;p++)for(let q=-1;q<=1;q++)G.P[mu(x+p,z+q)]=1;}};
ln(C+25,C+6,C-6,C+24);ln(C+25,C+6,C+3,C+3);ln(C-6,C+24,C+2,C+2);ln(C+25,C+6,C+40,C+20);},
build(){this.lights=[];for(let k=0;k<6;k++){const a=k*1.02+0.5;palm(C+12+13.5*Math.cos(a),C+14+13.5*Math.sin(a),11+((k*5)%7)*1.3,k+1);}
const tx=C+25,tz=C-6,tb=hAt(tx,tz);G.tcx=tx;G.tcz=tz;cyl(tx,tz,tb-0.5,tb+10,7.5,0.3,26);ball(tx,tb+10.3,tz,0.6,23);box(tx,tb+2.2,tz+5.4,1.6,2.4,1.6,36,0.3);box(tx,tb+0.3,tz+11,3,0.25,2,23);
const t2x=C+35,t2z=C+20,t2b=hAt(t2x,t2z);cyl(t2x,t2z,t2b-0.5,t2b+6.5,4.8,0.3,26);box(t2x-3.4,t2b+1.6,t2z+1,1.1,1.7,1.1,36,0.3,0.5);
box(tx-9,tb+1,tz+5,1.2,1.2,1.2,34,0.1,0.4);box(tx-9.5,tb+3.2,tz+5.2,0.9,0.9,0.9,34,0.1,0.9);ball(tx-6,tb+0.9,tz+8,1.1,25);ball(tx+8,tb+0.8,tz+6,1,25);ball(tx-4.4,tb+0.7,tz+9.4,0.8,25);
const sx=C+10,sz=C-4,sb=hAt(sx,sz);box(sx,sb+5,sz,3.6,0.25,2.7,23,0.05,0.3);for(const a of[-3,3])for(const b of[-2.2,2.2])cap(sx+a,sb-0.5,sz+b,sx+a,sb+5,sz+b,0.3,5);box(sx,sb+1.4,sz,2.4,0.3,1.2,34,0,0.3);ball(sx-1.2,sb+2.3,sz,0.7,25);ball(sx+0.8,sb+2.2,sz+0.3,0.6,40);ball(sx+1.8,sb+2.2,sz-0.3,0.55,28);
lamp(this,tx+8.5,tz+9,6,10,1.3,[1,0.8,0.45]);lamp(this,C+4,C+4,5,10,1,[1,0.8,0.45]);lamp(this,C-2,C+30,5,10,1,[1,0.8,0.45]);
const wx=C-6,wz=C+27,wb=hAt(wx,wz);prim(wx-6,wx+6,wb-2,wb+5,wz-6,wz+6,4,(x,y,z)=>Math.max(Math.abs(Math.hypot(x-wx,z-wz)-2.5)-0.85,Math.abs(y-wb-1.2)-1.7));cap(wx-3,wb,wz,wx-3,wb+6.5,wz,0.45,5);cap(wx+3,wb,wz,wx+3,wb+6.5,wz,0.45,5);cap(wx-3.6,wb+6.5,wz,wx+3.6,wb+6.5,wz,0.5,5);ball(wx,wb+4,wz,0.8,34);
camel(C+4,C+33,0.5);camel(C+12,C+35,-0.4);
const ct=[[C-30,C+10,6],[C-22,C+30,5],[C+34,C+32,7],[C+4,C-36,5],[C+37,C+6,4.5],[C-36,C+36,5.5],[C-38,C+22,4]];for(const q of ct){const b=hAt(q[0],q[1])-0.5;cap(q[0],b,q[1],q[0],b+q[2],q[1],1.1,28);cap(q[0],b+q[2]*0.45,q[1],q[0]+2.3,b+q[2]*0.5,q[1],0.7,28);cap(q[0]+2.3,b+q[2]*0.5,q[1],q[0]+2.3,b+q[2]*0.9,q[1],0.7,28);cap(q[0],b+q[2]*0.6,q[1],q[0]-2,b+q[2]*0.65,q[1],0.6,28);cap(q[0]-2,b+q[2]*0.65,q[1],q[0]-2,b+q[2]*0.95,q[1],0.6,28);}
for(let i=0;i<12;i++){const x=C-38+h3(i,71,1)*76,z=C-38+h3(i,71,2)*76;if(G.pd(x,z)<1.6||G.P[mu(x,z)])continue;const b=hAt(x,z);if(b>G0+5)continue;box(x,b+0.4,z,0.9+h3(i,71,3)*1.4,0.7+h3(i,71,4),0.8+h3(i,71,5),21,0.8,i);}
const mb=hAt(C-16,C-16);cyl(C-19.5,C-14.5,mb-1,mb+9,1.4,1.3,40);cyl(C-16,C-12,mb-1,mb+9,1.4,1.3,40);cyl(C-12,C-15.5,mb-1,mb+5,1.4,1.3,40);cyl(C-15,C-20,mb-1,mb+7,1.4,1.3,40);box(C-17.75,mb+9.6,C-13.25,3,0.6,1,40,0.1,0.62);box(C-13,mb+0.9,C-19,3,0.9,1,40,0.2,2.2);
steps(C+3,C+3,G0+1.4,C-5,C-5,G0+8.8,7,1.9,40);
const dy=hAt(C-4,C-4);box(C-7,dy+3.4,C-7,2.6,3.6,1.7,40,0.2,0.785);box(C-6.2,dy+2.8,C-6.2,1.5,2.7,1.5,36,0.2,0.785);ball(C-3.6,dy+4.6,C-8.6,0.6,11);ball(C-8.6,dy+4.6,C-3.6,0.6,11);this.lights.push([C-4.5,dy+4.6,C-4.5,1.1,1,0.6,0.3]);
const ax=C+6,az=C-31,ab=hAt(ax,az),ar=0.25,c=Math.cos(ar),s=Math.sin(ar);prim(ax-14,ax+14,ab-2,ab+19,az-8,az+8,21,(x,y,z)=>{const u=(x-ax)*c+(z-az)*s,v=(z-az)*c-(x-ax)*s,w=y-ab;return Math.max(sdBox(u,w-7,v,9.5-w*0.12,8.5,2.6)-0.9+1.2*(n3(x*0.25,y*0.25,z*0.25)-0.5),-(Math.hypot(u,(w-2)*0.85)-5.4));});
}};
}
