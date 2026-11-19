// Frozen shrine: A two-tiered shrine above a frozen lake, with a red gate, stone lanterns, snowy pines, an icefall and falling snow.
// A scene for the generator in engine/gen/genmain.js. It must stay self-contained: the generator hands this function to a
// Web Worker as text, so it can use only what it takes from the kit `K`.
export default function (K) {
const {NU,C,G0,G,pk,mu,h3,n2,n3,sm,hAt,ball,cap,foot,cyl,box,steps,pyr}=K;
function pine(x,z,hh,k){const b=hAt(x,z)-0.5;cap(x,b,z,x,b+hh*0.45,z,0.8,5);for(let i=0;i<4;i++){const y0=b+hh*(0.22+i*0.19),r=hh*0.3*(1-i*0.2);cyl(x,z,y0,y0+hh*0.3,r,0.2,52);}}
function slan(sc,x,z){const b=hAt(x,z);cyl(x,z,b-0.5,b+2.4,0.6,0.5,4);box(x,b+3.1,z,0.9,0.7,0.9,11,0.05);pyr(x,b+3.8,z,1.5,1.2,4);sc.lights.push([x,b+3.1,z,0.9,1,0.7,0.35]);}
return {name:'Frozen shrine',cap:'A two-tiered shrine above a frozen lake, with a red gate, stone lanterns, snowy pines, an icefall and falling snow.',bg:[8,12,24],LD:[0.45,0.7,0.5],amb:[0.38,0.46,0.66],sun:[0.82,0.88,1.02],level:G0-1,pv:[0.8,-3.5,0.4],pcol:[240,244,250],pn:80,foot,
h:(x,z)=>{const back=((C-x)+(C-z))/2;let h=G0+1+3*n2(x*0.07,z*0.07);const lk=Math.hypot(x-(C+13),z-(C+13))/(17+5*n2(x*0.12,z*0.12));h=(G0-5)+(h-(G0-5))*sm(0.85,1.25,lk);
if(Math.hypot(x-(C-14),z-(C-14))<14)h=G0+8;h+=Math.floor(sm(27,38,back+5*n2(x*0.1,z*0.1))*2.6)*6;return h;},
bot:(x,z)=>G0-12-3*n2(x*0.2,z*0.2),
top:(sx,sy,sz,j,hv)=>(G.P[mu(sx,sz)]&&hv>0.15)?13:50,side:()=>3,
fix:(mm,sx,sy,sz,nx,ny,nz,hv)=>{if(mm===7){return(ny>0.5&&Math.abs(Math.sin(sx*0.31+2*n2(sx*0.1,sz*0.1))*Math.cos(sz*0.27+sx*0.05))<0.035)?64:51;}
if(ny>0.6&&(mm===3||mm===4||mm===24||mm===52||mm===5||mm===53)&&n3(sx*0.3,sy*0.3,sz*0.3)>0.28)return 50;return mm;},
scatter:(mm,sx,sy,sz,hv,a)=>{if(mm===50&&hv>0.992)a(sx,sy+0.7,sz,45);},
init(){G.P=new Uint8Array(NU*NU);for(let f=0;f<=1;f+=0.008){const x=Math.round(C+26-34*f+2.5*Math.sin(f*7)),z=Math.round(C-22+16*f+2*Math.sin(f*5));for(let p=-1;p<=1;p++)for(let q=-1;q<=1;q++)G.P[mu(x+p,z+q)]=1;}},
build(){this.lights=[];const sx=C-15,sz=C-15,sb=G0+8;
box(sx,sb+0.6,sz,7.5,0.7,6.5,34,0.1);for(const a of[-6,0,6])for(const b of[-5,5])cyl(sx+a,sz+b,sb+1.2,sb+7,0.6,0.6,53);
box(sx,sb+4,sz-4.6,6,2.8,0.4,22);box(sx-5.8,sb+4,sz-0.5,0.4,2.8,4.2,22);box(sx+5.8,sb+4,sz-2.5,0.4,2.8,2.2,22);
pyr(sx,sb+7,sz,10,1.15,24);box(sx,sb+7.2,sz,9.6,0.3,9.6,53);box(sx,sb+11,sz,3.4,1.6,3.4,53,0.1);pyr(sx,sb+12.6,sz,6.2,1.1,24);ball(sx,sb+18.6,sz,0.7,54);cap(sx,sb+17,sz,sx,sb+18.4,sz,0.3,54);
box(sx,sb+2.4,sz-3.6,1.6,1,0.8,5,0.1);ball(sx,sb+4,sz-3.4,0.9,11);ball(sx-2.4,sb+3,sz-3.4,0.5,11);ball(sx+2.4,sb+3,sz-3.4,0.5,11);this.lights.push([sx,sb+4,sz,1.9,1,0.72,0.38]);this.lights.push([sx,sb+11,sz+5,0.6,1,0.72,0.38]);
this.emit=[[sx+2-C,sb+3-G0,sz+3-C,5,pk(180,186,206),pk(110,118,150)]];
steps(C+1,C-11,G0+2.2,C-6,C-12.5,G0+8.2,6,2.6,4);
const gx=C+5,gz=C-10,gb=hAt(gx,gz);for(const o of[-3.2,3.2]){cyl(gx,gz+o,gb-0.5,gb+9,0.7,0.6,53);}box(gx,gb+8.4,gz,0.5,0.4,4.6,53);box(gx,gb+9.8,gz,0.7,0.45,5.6,53);box(gx,gb+10.5,gz,0.9,0.3,6,24);
slan(this,C+10,C-15);slan(this,C+12,C-5);slan(this,C+22,C-14);slan(this,C-4,C-6);slan(this,C-9,C-21);
const pn=[[C-34,C+6,16],[C-28,C+16,13],[C-36,C+24,18],[C+30,C-32,15],[C+22,C-34,12],[C+36,C-24,17],[C-22,C+30,12],[C-6,C+34,10],[C+34,C-8,11],[C-30,C-36,14],[C-2,C-34,13]];pn.forEach((q,k)=>pine(q[0],q[1],q[2],k));
const fx=C-33,fz=C-22;for(let k=0;k<7;k++){const x=fx+h3(k,95,1)*3,z=fz+k*1.6-4,tp=hAt(x-3,z)+0.5;cap(x,tp,z,x+1.5+h3(k,95,2),hAt(x+5,z)-0.5,z,0.9+h3(k,95,3)*0.6,51);}
for(let k=0;k<6;k++){const a=k*1.1,x=C+13+9*Math.cos(a)*h3(k,96,1),z=C+13+9*Math.sin(a)*h3(k,96,2),hh=3+h3(k,96,3)*5;cyl(x,z,G0-1.5,G0-1+hh,1.1,0.1,51);cyl(x+1.2,z+0.6,G0-1.5,G0-1+hh*0.5,0.7,0.1,51);}
for(let i=0;i<9;i++){const x=C-36+h3(i,97,1)*72,z=C-36+h3(i,97,2)*72;if(G.P[mu(x,z)]||Math.hypot(x-sx,z-sz)<15)continue;box(x,hAt(x,z)+0.5,z,1.1+h3(i,97,3)*1.4,0.9+h3(i,97,4),1+h3(i,97,5),3,0.9,i);}
}};
}
