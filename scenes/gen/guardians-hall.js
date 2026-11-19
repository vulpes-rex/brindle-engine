// Guardian’s hall: undefined
// A scene for the generator in engine/gen/genmain.js. It must stay self-contained: the generator hands this function to a
// Web Worker as text, so it can use only what it takes from the kit `K`.
export default function (K) {
const {C,G0,G,h3,n2,n3,prim,ball,cap,ell,foot,cyl,box,ring,crag,hero,pillar}=K;
function torch(sc,x,y,z,dx,dz){cap(x,y,z,x+dx*1.3,y+0.9,z+dz*1.3,0.2,56);ell(x+dx*1.3,y+1.2,z+dz*1.3,0.5,0.3,0.5,56);ell(x+dx*1.3,y+2,z+dz*1.3,0.42,0.8,0.42,11);ball(x+dx*1.3,y+1.6,z+dz*1.3,0.45,10);sc.lights.push([x+dx*2.2,y+2.2,z+dz*2.2,1.5,1,0.62,0.3]);}
return {name:'Guardian’s hall',ry0:2.5,focus:[0,12,-2],bg:[8,10,14],LD:[0.35,0.7,-0.62],amb:[0.3,0.34,0.46],sun:[0.55,0.62,0.85],level:null,pv:[0.2,0.5,0.15],pcol:[255,190,120],pn:22,foot,tile:[[92,98,96],[80,86,88],[42,46,48]],swm:{23:50,11:90},
h:(x,z)=>{const r=Math.hypot(x-C,z-(C-10));return G0+2+(r<12.5?1.6:r<14.5?0.8:0);},bot:(x,z)=>G0-11-2*n2(x*0.2,z*0.2)-n2(x*0.8,z*0.8),top:()=>97,side:()=>4,
fix:(mm,sx,sy,sz,nx,ny,nz,hv)=>{if(mm===97&&n3(sx*0.3,2,sz*0.3)+((sx<C-25||sz<C-25)?0.16:0)>0.7)return 18;if((mm===99||mm===4||mm===98)&&ny>0.5&&n3(sx*0.3,sy*0.3,sz*0.3)>(mm===99?0.5:0.42))return 18;return mm;},
scatter:(mm,sx,sy,sz,hv,a,ny)=>{if(mm===18&&hv>0.975)a(sx,sy+0.4,sz,8);else if((mm===4&&ny<0.3&&ny>-0.3&&sy>G0+12&&hv<0.018)||(mm===99&&ny<-0.4&&hv<0.05)){const n=3+Math.floor(hv*300)%7;for(let q=1;q<=n;q++)a(sx,sy-q*0.7,sz,6);}},
build(){const L=this.lights=[],yf=G0+2,gx=C,gz=C-10,y0=yf+1.6;
const rag=u=>1.2*Math.floor(3*n2(u*0.2,3))+Math.max(0,(u-(C+16))*0.7);
prim(C-36,C-29,yf-1,yf+17,C-36,C+36,4,(x,y,z)=>{let d=Math.max(Math.abs(x-(C-32.5))-1.5,y-(yf+15.5-rag(z)),yf-1-y,Math.abs(z-C)-34);const hz=z-(C+6),hy=y-(yf+5);return Math.max(d,-Math.min(Math.max(Math.abs(hz)-2.6,hy),Math.hypot(hz,hy)-2.6));});
prim(C-36,C+36,yf-1,yf+17,C-36,C-29,4,(x,y,z)=>{let d=Math.max(Math.abs(z-(C-32.5))-1.5,y-(yf+15.5-rag(x+40)),yf-1-y,Math.abs(x-C)-34);for(const wx of[C-14,C+4])d=Math.max(d,-Math.max(Math.abs(x-wx)-0.55,Math.abs(y-(yf+10))-1.9));return d;});
box(C-30,yf+0.3,C+6,1.4,0.3,3.3,98,0.06);
[[C-20,13,0],[C-4,13,0],[C+12,13,0],[C+28,6.5,1]].forEach(q=>pillar(q[0],C-26.5,yf,q[1],q[2]));[[C-12,13,0],[C+4,13,0],[C+20,8,1]].forEach(q=>pillar(C-26.5,q[0],yf,q[1],q[2]));
torch(this,C-12,yf+7.5,C-31,0,1);torch(this,C+20,yf+7.5,C-31,0,1);torch(this,C-31,yf+7.5,C-4,1,0);torch(this,C-31,yf+7.5,C+13,1,0);
for(const q of[[C+35,C+31],[C-23,C+33],[C+36,C-8]]){for(let k=0;k<3;k++){const a=k*2.094;cap(q[0]+1.2*Math.cos(a),yf,q[1]+1.2*Math.sin(a),q[0],yf+2.4,q[1],0.14,56);}ell(q[0],yf+2.6,q[1],1,0.42,1,56);ell(q[0],yf+3.5,q[1],0.55,1,0.55,11);ball(q[0],yf+3,q[1],0.55,10);L.push([q[0],yf+4.2,q[1],1.5,1,0.62,0.3]);}
for(const bx of[C+4,C-28+0.01]){if(bx>C){cap(bx-2,yf+13,C-30.7,bx+2,yf+13,C-30.7,0.16,54);box(bx,yf+9.8,C-30.75,1.6,3.1,0.1,23,0.03);box(bx,yf+8.2,C-30.6,1.6,0.3,0.1,54,0.02);box(bx,yf+11.2,C-30.6,0.5,0.5,0.1,54,0.02);}}
cap(C-30.7,yf+13,C+18,C-30.7,yf+13,C+22,0.16,54);box(C-30.75,yf+9.8,C+20,1.6,3.1,0.1,23,0.03,1.5708);box(C-30.6,yf+8.2,C+20,1.6,0.3,0.1,54,0.02,1.5708);
{const kx=C-26,kz=C+29;box(kx,yf+0.9,kz,1.6,0.95,1.05,34,0.1,0.8);box(kx,yf+0.9,kz,1.72,0.14,1.17,54,0.03,0.8);box(kx,yf+2,kz,1.6,0.3,1.05,34,0.2,0.8);}
for(let i=0;i<16;i++){const w=i%2,u=C-26+h3(i,171,1)*56,v=C-27.5+h3(i,171,2)*3,x=w?v:u,z=w?u:v;box(x,yf+0.4+h3(i,171,5)*0.5,z,0.6+h3(i,171,3)*0.9,0.5+h3(i,171,4)*0.6,0.6+h3(i,171,5)*0.8,i%3?4:98,0.3,i);}
for(let i=0;i<5;i++)box(C+29+h3(i,172,1)*5,yf+0.5,C-28+h3(i,172,2)*5,0.8+h3(i,172,3),0.6,0.8,98,0.4,i);
{const bx=C-25,bz=C+3;ball(bx,yf+0.55,bz,0.6,22);ball(bx+0.45,yf+0.4,bz+0.3,0.36,22);for(let k=0;k<4;k++)cap(bx-1.2-k*0.7,yf+0.2,bz-0.4,bx-1.3-k*0.7,yf+1.1,bz+0.5,0.13,22);cap(bx-1,yf+0.2,bz-0.4,bx-3.8,yf+0.2,bz-0.6,0.15,22);}
ring(gx,y0+0.06,gz,9.6,0.15,31);ring(gx,y0+0.06,gz,6.2,0.13,31);for(let k=0;k<8;k++){const a=k*0.7854;cap(gx+6.2*Math.cos(a),y0+0.06,gz+6.2*Math.sin(a),gx+9.6*Math.cos(a),y0+0.06,gz+9.6*Math.sin(a),0.12,31);}L.push([gx,y0+1.5,gz+7,0.8,0.3,0.95,0.85],[gx,y0+1.5,gz-7,0.6,0.3,0.95,0.85]);
crag(gx-4,y0+1.6,gz+0.8,2.7,1.9,3.2,99,1);crag(gx+4,y0+1.6,gz+0.8,2.7,1.9,3.2,99,2);crag(gx-3.7,y0+5.6,gz,2.2,4.3,2.3,99,3);crag(gx+3.7,y0+5.6,gz,2.2,4.3,2.3,99,4);crag(gx,y0+9.8,gz,4.8,2.3,3.1,99,5);
crag(gx,y0+14.6,gz+0.3,6.3,4.7,4.3,99,6);crag(gx-7.7,y0+17.6,gz,3.4,3,3.3,99,7);crag(gx+7.7,y0+17.6,gz,3.4,3,3.3,99,8);crag(gx,y0+20.9,gz+0.9,2.3,2.1,2.3,99,9);crag(gx-1.3,y0+23.2,gz+0.3,0.8,1.3,0.8,99,10);crag(gx+1.5,y0+23,gz+0.1,0.7,1.1,0.7,99,11);
crag(gx-9.3,y0+13,gz+0.9,2,3.7,2,99,12);crag(gx-9.9,y0+7.2,gz+2.6,2.3,3.9,2.3,99,13);crag(gx-9.9,y0+2.7,gz+3.8,2.6,2.2,2.7,99,14);
ball(gx,y0+14.6,gz+4.1,1.6,31);for(const q of[[-2.6,1.8],[2.6,1.8],[-2.2,-2.2],[2.2,-2.2]])cap(gx+q[0]*0.5,y0+14.6+q[1]*0.5,gz+4.45,gx+q[0]*1.35,y0+14.6+q[1]*1.35,gz+4.2,0.2,31);
ball(gx-0.95,y0+21.2,gz+2.85,0.42,31);ball(gx+0.95,y0+21.2,gz+2.85,0.42,31);L.push([gx,y0+15,gz+7,1.5,0.3,0.95,0.85],[gx,y0+21.5,gz+5,0.5,0.3,0.95,0.85]);
const ax=gx+7.7,ay=y0+17.6;G.dyn=[{cx:ax,cy:ay,cz:gz,ax:3,sp:1.1,amp:0.2,bb:[ax-5,ax+7,ay-3,ay+19,gz-6,gz+11],fn:()=>{crag(ax+1.4,ay+4.2,gz+1.4,2,3.7,2,99,21);crag(ax+1.8,ay+9.8,gz+3,2.3,3.7,2.3,99,22);crag(ax+1.8,ay+14.2,gz+4.2,2.8,2.5,2.8,99,23);
cap(ax+0.6,ay+8,gz+5.2,ax+0.8,ay+11.6,gz+5.6,0.2,31);cap(ax+2.6,ay+8,gz+5.2,ax+2.8,ay+11.6,gz+5.6,0.2,31);}}];
let h=hero(C-9,C+14,-1.5708,{legs:73,boot:56,body:73,arm:73,belt:5,hands:[[1.2,-1.5,4.6],[0.9,1.7,3.2]]}),x=C-9,z=C+14;
ell(x,h.y+5.78,z,1.38,1.12,1.38,73);box(x,h.y+5.35,z-1.24,0.7,0.14,0.14,36,0.02);cap(x,h.y+6.8,z,x,h.y+8,z+1.2,0.36,23);cap(x,h.y+8,z+1.2,x,h.y+7.4,z+2.1,0.3,23);box(x,h.y+2.9,z-1.04,0.6,0.9,0.12,88,0.03);
ell(x+1.95,h.y+3.3,z-0.7,0.3,1.5,1.35,88);ball(x+2.2,h.y+3.3,z-0.7,0.4,54);cap(x-1.5,h.y+4.6,z-1.2,x-1.75,h.y+8.6,z-2.1,0.17,73);cap(x-2.1,h.y+5,z-1.35,x-0.95,h.y+5,z-1.25,0.16,54);
x=C-3;z=C+17;h=hero(x,z,-1.5708,{robe:1,legs:100,boot:5,body:100,arm:100,trim:54,hands:[[0.9,-1.6,3.7],[1,1.3,4.2]]});cyl(x,z,h.y+6.05,h.y+6.3,2.05,2.05,100);cyl(x,z,h.y+6.3,h.y+9,1.2,0.1,100);ring(x,h.y+6.48,z,1.2,0.15,54);ell(x,h.y+4.6,z-0.95,0.62,0.85,0.5,22);
{const sp=h.hands[0];cap(sp[0],h.y+0.2,sp[2],sp[0],h.y+8.3,sp[2],0.2,5);ball(sp[0],h.y+8.9,sp[2],0.65,61);L.push([sp[0],h.y+8.9,sp[2],1.1,0.5,0.8,1]);}
x=C+3;z=C+14;h=hero(x,z,-1.5708,{legs:5,boot:56,body:101,arm:101,belt:5,hands:[[0.3,-1.2,3.9],[1.9,0.9,4.2]]});ell(x,h.y+5.65,z+0.45,1.4,1.3,1.35,101);box(x,h.y+2.6,z+1.08,1.1,1.7,0.14,101,0.05);
cap(x+0.9,h.y+6.7,z-1.5,x+0.9,h.y+4.2,z-2.2,0.15,5);cap(x+0.9,h.y+4.2,z-2.2,x+0.9,h.y+1.7,z-1.5,0.15,5);cap(x+0.9,h.y+6.7,z-1.5,x+0.9,h.y+1.7,z-1.5,0.06,22);cap(x+0.9,h.y+4.2,z-0.5,x+0.9,h.y+4.2,z-3.7,0.08,22);ball(x+0.9,h.y+4.2,z-3.8,0.16,73);
cap(x-0.5,h.y+2.6,z+1.3,x+0.6,h.y+5,z+1.4,0.42,5);for(let k=0;k<3;k++)cap(x+0.5+k*0.15,h.y+5,z+1.4,x+0.8+k*0.25,h.y+6.3,z+1.5,0.07,22);
x=C+9;z=C+17;h=hero(x,z,-1.5708,{robe:1,legs:22,boot:5,body:22,arm:22,trim:54,belt:54,hands:[[1.3,-1.4,4.4],[0.9,1.3,3.5]]});ell(x,h.y+5.72,z+0.3,1.35,1.15,1.3,103);cap(x,h.y+5,z+1,x,h.y+3.3,z+1.15,0.7,103);
{const sp=h.hands[0];cap(sp[0],h.y+0.2,sp[2],sp[0],h.y+7.7,sp[2],0.18,54);ell(sp[0],h.y+8.5,sp[2],1,1,0.25,54);ball(sp[0],h.y+8.5,sp[2]-0.2,0.45,10);L.push([sp[0],h.y+8.5,sp[2]-1,1,1,0.85,0.5]);}
this.shafts=[];for(const wx of[C-14,C+4])this.shafts.push([wx-this.LD[0]*11,yf+10-this.LD[1]*11,C-31-this.LD[2]*11,1.3,11,18]);
}};
}
