// Great clockwork: undefined
// A scene for the generator in engine/gen/genmain.js. It must stay self-contained: the generator hands this function to a
// Web Worker as text, so it can use only what it takes from the kit `K`.
export default function (K) {
const {N,C,G0,G,n2,prim,ball,cap,ell,alimb,foot,cyl,box,lamp,barrel,hero}=K;
function gear2(cx,cy,cz,R,th,teeth,ax,m,ph,nsp){const rim=Math.min(2.3,R*0.32),hub=Math.min(1.9,R*0.36),sp=6.2832/nsp,sw=Math.min(0.62,R*0.12);
prim(cx-R-2,cx+R+2,cy-R-2,cy+R+2,cz-R-2,cz+R+2,m,(x,y,z)=>{let a,b,w;if(ax===1){a=x-cx;b=z-cz;w=y-cy;}else if(ax===2){a=x-cx;b=y-cy;w=z-cz;}else{a=z-cz;b=y-cy;w=x-cx;}
const r=Math.hypot(a,b),an=Math.atan2(b,a)-ph,tt=2.5*Math.sin(an*teeth),rr=R+0.3+0.5*(tt>1?1:tt<-1?-1:tt),am=((an%sp)+sp)%sp-sp/2,ds=Math.abs(r*Math.sin(am))-sw,aw=Math.abs(w);
return Math.min(Math.max(Math.min(Math.max(r-rr,(R-rim)-r),r-hub,Math.max(ds,r-R+1)),aw-th),Math.max(r-hub*0.72,aw-th*1.7))*0.8;});}
return {name:'Great clockwork',ry0:2.85,focus:[0,24,2],bg:[12,10,14],LD:[-0.35,0.7,0.62],amb:[0.4,0.4,0.52],sun:[1.08,0.92,0.72],level:null,pv:[0.3,0.25,0.2],pcol:[255,220,150],pn:20,foot,tile:[[116,110,112],[100,94,98],[58,54,60]],
h:()=>G0+2,bot:(x,z)=>G0-11-2*n2(x*0.2,z*0.2)-n2(x*0.8,z*0.8),top:()=>97,side:()=>4,
build(){const L=this.lights=[],yf=G0+2,zg=C+2,zf=C-2.6,W=[1,0.8,0.45],X1=[1,0,0];
const beam=(x0,y0,x1,y1,t)=>alimb([x0,yf+y0,zf],[x1,yf+y1,zf],0.8,t||0.9,56,X1);
for(const x of[C-33,C-12,C+2.7,C+13.5,C+30])beam(x,0,x,47.5);for(const y of[0.8,24,47.5])beam(C-34.5,y,C+31.5,y);
beam(C-33,0.8,C-12,24,0.55);beam(C-12,24,C-33,47.5,0.55);beam(C+13.5,24,C+30,47.5,0.55);beam(C+30,0.8,C+13.5,24,0.55);beam(C+2.7,24,C-12,47.5,0.55);
for(const x of[C-33,C-12,C+2.7,C+13.5,C+30])for(const y of[0.8,24,47.5]){box(x,yf+y,zf+0.75,1.6,1.6,0.3,73,0.1);for(const a of[-1,1])for(const b of[-1,1])ball(x+a,yf+y+b,zf+1.05,0.26,54);}
for(const x of[C-33,C-1,C+30]){alimb([x,yf+41,zf-0.8],[x,yf+0.3,zf-17],0.6,0.6,56,X1);box(x,yf+0.3,zf-17,1.4,0.3,1.4,73,0.08);box(x,yf+0.35,zf,2.2,0.35,1.6,34,0.06);}
box(C-1,yf+23,zf-4.4,31,0.2,2.1,34,0.04);for(const x of[C-30,C-15,C,C+15,C+28])cap(x,yf+22.8,zf-6.3,x,yf+19.4,zf-1,0.2,56);
for(let x=C-31;x<=C+29;x+=5)cap(x,yf+23.2,zf-6.3,x,yf+25.7,zf-6.3,0.16,54);cap(C-31,yf+25.7,zf-6.3,C+29,yf+25.7,zf-6.3,0.18,54);cap(C-31,yf+24.5,zf-6.3,C+29,yf+24.5,zf-6.3,0.12,54);
for(const s of[-0.6,0.6])cap(C+22+s,yf+0.2,zf-10,C+22+s,yf+23.6,zf-6.7,0.16,5);for(let k=0;k<12;k++){const f=(k+0.5)/12;cap(C+21.4,yf+0.2+23.4*f,zf-10+3.3*f,C+22.6,yf+0.2+23.4*f,zf-10+3.3*f,0.11,5);}
const GR=[],root={N:24,x:C-12,y:16,w:0.22,ph:0,m:54,sp:6};GR.push(root);
const mesh=(p,N,be,m,sp)=>{const R=N*0.42,Dd=p.N*0.42+R+0.6,g={N,x:p.x+Dd*Math.cos(be),y:p.y+Dd*Math.sin(be),w:-p.w*p.N/N,ph:be+Math.PI+(be-p.ph)*p.N/N,m,sp};GR.push(g);return g;};
const g2=mesh(root,12,0.35,56,4),g3=mesh(g2,16,-0.5,54,5),g4=mesh(g3,10,0.9,96,4),g5=mesh(g2,20,1.75,54,6),g6=mesh(g5,8,0.25,96,4),g7=mesh(root,14,2.3,56,5),g8=mesh(g7,10,1.2,96,4),g9=mesh(g6,12,0.1,56,4),g10=mesh(g9,8,0.213,54,4);
G.dyn=[];
for(const g of GR){const R=g.N*0.42,cy=yf+g.y;cap(g.x,cy,zf+0.6,g.x,cy,zg+1.5,0.55,73);ball(g.x,cy,zg+1.6,0.72,54);box(g.x,cy,zf+1.1,1.5,1.5,0.5,73,0.2);
const ny=[0.8,24,47.5].reduce((a,b)=>Math.abs(b-g.y)<Math.abs(a-g.y)?b:a);if(Math.abs(ny-g.y)>1.5)beam(g.x,g.y,g.x,ny,0.5);
G.dyn.push({cx:g.x,cy,cz:zg,ax:2,sp:g.w,amp:0,bb:[g.x-R-2,g.x+R+2,cy-R-2,cy+R+2,zg-2,zg+2],fn:()=>gear2(g.x,cy,zg,R,0.7,g.N,2,g.m,g.ph,g.sp)});}
const dcx=root.x,dcy=yf+root.y,zd=zg+3.1;
prim(dcx-15,dcx+15,dcy-15,dcy+15,zd-1.5,zd+1.5,22,(x,y,z)=>Math.max(Math.abs(Math.hypot(x-dcx,y-dcy)-12.7)-0.85,Math.abs(z-zd)-0.22));
for(let k=0;k<12;k++){const a=k*0.5236,mx=dcx+12.7*Math.cos(a),my=dcy+12.7*Math.sin(a);if(k%3===0)box(mx,my,zd+0.3,0.5,0.5,0.14,54,0.05);else ball(mx,my,zd+0.25,0.34,36);}
for(const a of[0.785,2.356,3.927,5.498])cap(dcx+12.7*Math.cos(a),dcy+12.7*Math.sin(a),zd,dcx+12.7*Math.cos(a),dcy+12.7*Math.sin(a),zf+0.8,0.22,56);
G.dyn.push({cx:dcx,cy:dcy,cz:zg+2.5,ax:2,sp:-0.35,amp:0,bb:[dcx-12.5,dcx+12.5,dcy-12.5,dcy+12.5,zg+1.4,zg+3.4],fn:()=>{alimb([dcx,dcy-2.4,zg+2.6],[dcx,dcy+11,zg+2.6],0.2,0.4,36,X1);ball(dcx,dcy,zg+2.6,0.8,54);}});
G.dyn.push({cx:dcx,cy:dcy,cz:zg+2.2,ax:2,sp:-0.35/12,amp:0,bb:[dcx-9,dcx+9,dcy-9,dcy+9,zg+1.4,zg+3],fn:()=>{alimb([dcx,dcy-1.8,zg+2.15],[dcx,dcy+7.4,zg+2.15],0.2,0.62,36,X1);}});
const px=g10.x,py=yf+g10.y+4.6,pz=zg+2.6;box(px,py+0.5,(zf+pz)/2+0.2,0.9,0.7,(pz-zf)/2+0.4,56,0.1);
G.dyn.push({cx:px,cy:py,cz:pz,ax:2,sp:1.6,amp:0.2,bb:[px-6,px+6,yf+4,py+3,zg-1.5,pz+1.8],fn:()=>{cap(px,py,pz,px,yf+12,pz,0.3,73);ell(px,yf+10,pz,3.1,3.1,0.8,54);ell(px,yf+10,pz+0.5,1.6,1.6,0.6,96);ball(px,py,pz,0.8,56);
cap(px,py,pz-0.4,px-3.7,py-2.2,zg,0.34,56);cap(px,py,pz-0.4,px+3.7,py-2.2,zg,0.34,56);box(px-3.7,py-2.8,zg,0.4,0.8,0.5,73,0.05);box(px+3.7,py-2.8,zg,0.4,0.8,0.5,73,0.05);}});
for(const q of[[C-22,7,14],[C+8,15,22]]){const wz=zf-5;alimb([q[0],yf+47.5,zf],[q[0],yf+47.5,wz-1],0.5,0.5,56,X1);ell(q[0],yf+46.4,wz,1.4,1.4,0.4,73);cap(q[0],yf+q[2],wz,q[0],yf+46,wz,0.14,73);
cyl(q[0],wz,yf+q[1],yf+q[2],1.5,1.5,56);cyl(q[0],wz,yf+q[1]-0.3,yf+q[1],1.65,1.65,54);cyl(q[0],wz,yf+q[2],yf+q[2]+0.3,1.65,1.65,54);}
{const bx=C+1,bz=zf;beam(bx-5,47.5,bx-5,58.5,0.6);beam(bx+5,47.5,bx+5,58.5,0.6);beam(bx-6,58.5,bx+6,58.5,0.6);cap(bx,yf+58,bz,bx,yf+56.4,bz,0.3,56);
prim(bx-5,bx+5,yf+49,yf+57,bz-5,bz+5,54,(x,y,z)=>{const q=(y-(yf+49.8))/6.4,r=Math.hypot(x-bx,z-bz),rad=1.3+2.2*Math.pow(1-Math.min(1,Math.max(0,q)),1.7)+(q<0.08?0.35:0);return Math.max(r-rad,yf+49.8-y,y-(yf+56.2))*0.8;});
ball(bx,yf+49.6,bz,0.75,56);cap(bx+4.6,yf+53,bz+0.9,bx+2.9,yf+51,bz+0.9,0.22,56);box(bx+2.6,yf+50.8,bz+0.9,0.5,0.4,0.4,73,0.08);}
{const wx=C+22,wz=C+18;box(wx,yf+2.6,wz,4.2,0.22,1.7,34,0.04);for(const a of[-3.8,3.8])for(const b of[-1.3,1.3])cap(wx+a,yf,wz+b,wx+a,yf+2.5,wz+b,0.22,5);box(wx-3,yf+3.3,wz-0.6,0.5,0.5,0.7,56,0.06);box(wx-3,yf+3.9,wz-0.2,0.5,0.2,0.3,73,0.04);
gear2(wx-0.6,yf+3,wz+0.3,1.7,0.2,8,1,54,0,4);gear2(wx+1.6,yf+3.05,wz-0.5,1.26,0.2,6,1,96,0.4,3);cyl(wx+3.2,wz+0.6,yf+2.8,yf+3.7,0.42,0.42,96);cyl(wx+3.2,wz+0.6,yf+3.7,yf+4.4,0.42,0.06,96);box(wx+0.2,yf+2.9,wz-1,1.2,0.05,0.5,22,0.02,0.2);
cap(wx+3.4,yf+2.8,wz-1,wx+3.4,yf+5.4,wz-1,0.12,56);ball(wx+3.4,yf+5.9,wz-1,0.5,10);L.push([wx+3.4,yf+5.9,wz-1,1,W[0],W[1],W[2]]);
const hm=hero(wx-1,wz+5,-1.5708,{legs:56,boot:5,body:5,arm:22,belt:54,hands:[[1.3,-1.3,3.6],[0.9,1.4,2.9]]});ell(wx-1,hm.y+6.1,wz+5,1.32,0.7,1.32,88);cap(hm.hands[0][0],hm.hands[0][1],hm.hands[0][2],hm.hands[0][0]-0.2,hm.hands[0][1]+1.8,hm.hands[0][2]-0.5,0.14,73);box(wx-1,hm.y+2.9,wz+3.98,0.7,1.1,0.12,34,0.03);}
gear2(C-26,yf+0.7,C+22,5.88,0.6,14,1,56,0,5);gear2(C-25,yf+1.95,C+22.6,4.2,0.6,10,1,96,0.3,4);gear2(C-17,yf+0.6,C+29,3.36,0.5,8,1,54,0.2,4);
box(C-34,yf+1.3,C+8,1.3,1.3,1.3,34,0.08,0.2);box(C-33.6,yf+3.6,C+8.3,1,1,1,34,0.08,0.7);barrel(C-34.5,C+13,yf,2.6);barrel(C+35,C+6,yf,2.6);box(C+34,yf+1.1,C+11,1.1,1.1,1.1,34,0.08,0.4);
lamp(this,C-37,C+36,7,10,1.3,W);lamp(this,C+37,C+36,7,10,1.3,W);lamp(this,C-37,C-24,7,10,1.1,W);lamp(this,C+37,C-24,7,10,1.1,W);
for(let x=C-36;x<=C+36;x+=8){if(Math.abs(x-C)<5)continue;cap(x,yf,C+39,x,yf+2.6,C+39,0.2,54);ball(x,yf+2.8,C+39,0.3,54);}cap(C-36,yf+2.4,C+39,C-8,yf+2.4,C+39,0.16,54);cap(C+8,yf+2.4,C+39,C+36,yf+2.4,C+39,0.16,54);
L.push([dcx,dcy,zg+8,0.7,W[0],W[1],W[2]],[C+10,yf+34,zg+8,0.7,W[0],W[1],W[2]]);
}};
}
