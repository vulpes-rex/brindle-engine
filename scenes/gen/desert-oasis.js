// Desert oasis: undefined
// A scene for the generator in engine/gen/genmain.js. It must stay self-contained: the generator hands this function to a
// Web Worker as text, so it can use only what it takes from the kit `K`.
export default function (K) {
const {NU,C,G0,G,mu,h3,n2,n3,prim,sm,hAt,sdBox,ball,cap,ell,leafM,alimb,foot,cyl,box,palm,steps,lamp,ring,crag}=K;
function camel2(x,z,ra,sit,k){const b=hAt(x,z)-(sit?2.3:0),c=Math.cos(ra),s=Math.sin(ra),P=(u,v)=>[x+u*c-v*s,z+u*s+v*c];let p=P(-1.8,0),q=P(1.8,0);
cap(p[0],b+3.8,p[1],q[0],b+3.9,q[1],1.3,43);ell(x,b+5.25,z,1.25,0.95,1.1,43);box(x,b+4.9,z,1.05,0.85,1.38,23,0.25,ra);box(x,b+5.1,z,1.12,0.12,1.44,54,0.04,ra);
for(const v of[-1.55,1.55]){p=P(-0.2,v);box(p[0],b+4.2,p[1],0.8,0.7,0.35,34,0.1,ra);}p=P(-1.2,0);q=P(-1.2,0);cap(P(-1.3,-1.1)[0],b+5.6,P(-1.3,-1.1)[1],P(-1.3,1.1)[0],b+5.6,P(-1.3,1.1)[1],0.38,88);
p=P(2.6,0);q=P(3.3,0);cap(p[0],b+4.2,p[1],q[0],b+5.6,q[1],0.58,43);p=P(3.9,0);cap(q[0],b+5.6,q[1],p[0],b+6.9,p[1],0.5,43);q=P(4.5,0);ell(q[0],b+7.1,q[1],0.75,0.55,0.55,43);p=P(5.2,0);ball(p[0],b+6.9,p[1],0.4,43);
p=P(-3.1,0);q=P(-3.5,0);cap(p[0],b+4.1,p[1],q[0],b+2.6,q[1],0.2,43);
for(const u of[-1.6,1.6])for(const v of[-0.7,0.7]){p=P(u,v);if(sit){q=P(u+1.4,v*1.3);cap(p[0],b+2.7,p[1],q[0],b+2.6,q[1],0.42,43);}else{q=P(u+(u>0?0.25:-0.25),v);cap(p[0],b+3.2,p[1],q[0],b+1.6,q[1],0.45,43);cap(q[0],b+1.6,q[1],p[0],b-0.3,p[1],0.36,43);}}}
function column(x,z,y,h,brk){cyl(x,z,y-0.4,y+0.5,0.95,0.9,40);cyl(x,z,y+0.5,y+h,0.66,0.56,40);if(!brk){cyl(x,z,y+h,y+h+0.5,0.72,0.95,40);box(x,y+h+0.7,z,0.95,0.2,0.95,40,0.04);}}
function amph(x,z,y){ell(x,y+0.9,z,0.62,0.9,0.62,25);cyl(x,z,y+1.6,y+2.2,0.26,0.34,25);}
return {name:'Desert oasis',water:[40,150,160],ry0:2.5,focus:[0,16,0],bg:[20,14,22],LD:[-0.55,0.66,0.5],amb:[0.5,0.48,0.6],sun:[1.26,1.06,0.77],level:G0-1.6,pv:[2.5,0.1,1],pcol:[240,214,160],pn:26,foot,shallow:true,wc:[[96,206,190],[36,140,156]],
h:(x,z)=>{let h=G0+2.5*n2(x*0.06,z*0.06)+0.6*Math.sin((x+z*0.5)*0.5)+0.3*n2(x*0.6,z*0.6);const r1=Math.hypot(x-(C-16),z-(C-16))/(18+7*n2(x*0.09,z*0.09));if(r1<1)h+=Math.floor((1-r1)*3.4+0.75)*7;
const r2=Math.hypot(x-(C+28),z-(C-26))/(8+3*n2(x*0.15,z*0.15));if(r2<1)h+=Math.floor((1-r2)*2+0.8)*7;return(G0-5.5)+(h-(G0-5.5))*sm(0.8,1.3,G.pd(x,z));},
bot:(x,z)=>G0-12-3*n2(x*0.2,z*0.2)-n2(x*0.8,z*0.8),
top:(sx,sy,sz,j,hv)=>{const pd=G.pd(sx,sz);if(pd<1.4)return sy<G0-1?32:1;if(sy>G0+19&&Math.hypot(sx-(C-16),sz-(C-16))<9)return 95;if(sy>G0+5)return 21;return(G.P[mu(sx,sz)]&&hv>0.2)?46:20;},side:()=>21,
fix:(mm,sx,sy,sz,nx,ny,nz,hv)=>{if(mm===7&&ny>0.5&&hv<0.03)return 16;return mm;},
scatter:(mm,sx,sy,sz,hv,a)=>{if(mm===1){if(hv>0.92)for(let q=1;q<5;q++)a(sx,sy+q*0.7,sz,14);else if(hv<0.03)a(sx,sy+1,sz,hv<0.015?66:8);}else if(mm===32&&hv<0.25)for(let q=1;q<6;q++)a(sx,sy+q*0.7,sz,14);
else if(mm===20&&hv>0.992){a(sx,sy+0.5,sz,45);a(sx+0.4,sy+1,sz,45);a(sx-0.3,sy+0.9,sz+0.3,45);a(sx,sy+1.5,sz,45);}},
init(){G.pd=(x,z)=>Math.hypot(x-(C+12),z-(C+14))/(9+3*n2(x*0.15+20,z*0.15));G.P=new Uint8Array(NU*NU);
const ln=(a,b,c,d)=>{for(let f=0;f<=1;f+=0.008){const w=2*Math.sin(f*6.28),x=Math.round(a+(c-a)*f+w),z=Math.round(b+(d-b)*f-w);for(let p=-1;p<=0;p++)for(let q=-1;q<=0;q++)G.P[mu(x+p,z+q)]=1;}};
ln(C+25,C+6,C-6,C+24);ln(C+25,C+6,C+3,C+3);ln(C-6,C+24,C+2,C+2);ln(C+25,C+6,C+40,C+20);ln(C+25,C+6,C+11,C+1);},
build(){this.lights=[];const L=this.lights,W=[1,0.8,0.45];
for(let k=0;k<7;k++){if(k===4)continue;const a=k*0.9+0.4;palm(C+12+13.5*Math.cos(a),C+14+13.5*Math.sin(a),10+((k*5)%7)*1.4,k+1);}
for(let i=0;i<9;i++){const a=h3(i,161,1)*6.28,d=11+h3(i,161,2)*3,x=C+12+d*Math.cos(a),z=C+14+d*Math.sin(a);leafM(x,hAt(x,z)+0.6,z,1.1+h3(i,161,3)*1.1,6);}
for(let i=0;i<5;i++){const a=i*1.3+0.2,x=C+12+10.4*Math.cos(a),z=C+14+10.4*Math.sin(a);box(x,hAt(x,z)+0.2,z,0.8+h3(i,162,1)*0.7,0.5,0.7,21,0.5,i);}
const tx=C+25,tz=C-6,tb=hAt(tx,tz);G.tcx=tx;G.tcz=tz;cyl(tx,tz,tb-0.5,tb+10,7.5,0.3,26);ring(tx,tb+0.9,tz,7.25,0.36,23);cap(tx,tb+10,tz,tx,tb+13,tz,0.14,5);box(tx+0.9,tb+12.4,tz,0.9,0.42,0.07,23,0.02);ball(tx,tb+10.2,tz,0.5,54);
box(tx,tb+2.3,tz+5.5,1.7,2.5,1.7,36,0.3);ball(tx,tb+2,tz+5.2,0.8,11);L.push([tx,tb+2.4,tz+8,1.2,1,0.72,0.38]);
alimb([tx-0.4,tb+5.2,tz+6.2],[tx-2.9,tb+0.3,tz+7.6],1.2,0.09,57,[1,0,0]);alimb([tx+0.4,tb+5.2,tz+6.2],[tx+2.9,tb+0.3,tz+7.6],1.2,0.09,57,[1,0,0]);
for(let k=0;k<7;k++){const a=k*0.898+0.9;if(Math.abs(a-1.57)<0.5)continue;const x0=tx+5.8*Math.cos(a),z0=tz+5.8*Math.sin(a),x1=tx+10.6*Math.cos(a),z1=tz+10.6*Math.sin(a),g=hAt(x1,z1);cap(x0,tb+3.2,z0,x1,g+0.1,z1,0.09,86);cap(x1,g-0.3,z1,x1+0.2,g+0.7,z1,0.16,5);}
box(tx,tb+0.28,tz+11.4,3.3,0.14,2.1,94,0.05);box(tx-5,tb+0.26,tz+8.6,1.8,0.12,1.3,94,0.05,0.6);
[[-1.9,10.6,23],[1.8,10.4,88],[2.2,12.3,54],[-2.1,12.4,22]].forEach(q=>box(tx+q[0],tb+0.65,tz+q[1],0.6,0.26,0.6,q[2],0.24,q[0]));
cyl(tx,tz+11.4,tb+0.3,tb+1,1,1,34);ball(tx+0.1,tb+1.45,tz+11.3,0.42,54);cap(tx+0.4,tb+1.5,tz+11.3,tx+0.95,tb+1.75,tz+11.3,0.1,54);ball(tx-0.6,tb+1.15,tz+11.8,0.16,22);ball(tx+0.5,tb+1.15,tz+12,0.16,22);
{const bx=tx-7.5,bz=tz+9.5,bb=hAt(bx,bz);for(let k=0;k<3;k++){const a=k*2.094;cap(bx+1.1*Math.cos(a),bb-0.2,bz+1.1*Math.sin(a),bx,bb+1.7,bz,0.13,56);}ell(bx,bb+1.9,bz,0.95,0.4,0.95,56);ball(bx,bb+2.15,bz,0.55,11);L.push([bx,bb+2.6,bz,1.1,1,0.6,0.3]);}
const t2x=C+35,t2z=C+20,t2b=hAt(t2x,t2z);cyl(t2x,t2z,t2b-0.5,t2b+6.5,4.8,0.3,26);ring(t2x,t2b+0.8,t2z,4.6,0.3,88);box(t2x-3.4,t2b+1.6,t2z+1,1.1,1.7,1.1,36,0.3,0.5);ball(t2x,t2b+6.7,t2z,0.4,54);
const sx=C+10,sz=C-4,sb=hAt(sx,sz);box(sx,sb+5.2,sz,3.9,0.14,2.9,26,0.05,0.3);box(sx,sb+4.9,sz,4,0.3,3,23,0.02,0.3);
for(const a of[-3.3,3.3])for(const b of[-2.4,2.4]){const px=sx+a*Math.cos(0.3)-b*Math.sin(0.3),pz=sz+a*Math.sin(0.3)+b*Math.cos(0.3);cap(px,hAt(px,pz)-0.5,pz,px,sb+5,pz,0.26,5);}
box(sx,sb+1.5,sz,2.6,0.16,1.3,34,0.04,0.3);for(const a of[-2.2,2.2])for(const b of[-1,1])cap(sx+a,sb-0.2,sz+b,sx+a,sb+1.5,sz+b,0.16,5);
amph(sx-1.6,sz-0.4,sb+1.5);amph(sx-0.5,sz+0.2,sb+1.5);[[0.6,-0.3,23],[1,0.2,54],[1.5,-0.2,28],[1.9,0.4,23],[1.2,0.6,54],[0.7,0.5,28]].forEach(q=>ball(sx+q[0],sb+1.95,sz+q[1],0.3,q[2]));
ell(sx+4.6,sb+0.7,sz+2.6,1,0.75,0.8,57);ell(sx+5.6,sb+0.6,sz+1.6,0.9,0.65,0.8,57);ell(sx+5,sb+1.6,sz+2.2,0.8,0.55,0.7,57);
for(let k=0;k<4;k++)amph(sx-5.2-k*0.2,sz+2-k*1.5,hAt(sx-5.2,sz+2-k*1.5)-0.2);
for(const a of[-2.6,2.6]){const px=sx+a,pz=sz+2.9;cap(px,sb+4.8,pz,px,sb+3.8,pz,0.06,86);ball(px,sb+3.4,pz,0.42,10);L.push([px,sb+3.4,pz+1,0.8,W[0],W[1],W[2]]);}
box(tx-9,tb+1,tz+3,1.2,1.2,1.2,34,0.08,0.4);box(tx-9.5,tb+3.2,tz+3.2,0.9,0.9,0.9,34,0.08,0.9);
lamp(this,tx+8.5,tz+9,6,10,1.3,W);lamp(this,C+8,C+0.5,5,10,1,W);lamp(this,C-2,C+30,5,10,1,W);lamp(this,C+34,C+12,5,10,1,W);
const wx=C-6,wz=C+27,wb=hAt(wx,wz);prim(wx-6,wx+6,wb-2,wb+5,wz-6,wz+6,4,(x,y,z)=>Math.max(Math.abs(Math.hypot(x-wx,z-wz)-2.5)-0.85,Math.abs(y-wb-1.2)-1.7));cyl(wx,wz,wb-1,wb+1.6,1.7,1.7,36);
cap(wx-3.1,wb,wz,wx-3.1,wb+6.6,wz,0.4,5);cap(wx+3.1,wb,wz,wx+3.1,wb+6.6,wz,0.4,5);cap(wx-3.5,wb+5.4,wz,wx+4.4,wb+5.4,wz,0.3,5);cap(wx+4.4,wb+5.4,wz,wx+4.4,wb+4.6,wz+0.9,0.14,5);box(wx,wb+7,wz,3.9,0.14,1.9,25,0.04);box(wx,wb+7.3,wz,3.5,0.14,1.3,25,0.04);
cap(wx,wb+5.2,wz,wx,wb+3.4,wz,0.07,86);cyl(wx,wz,wb+2.6,wb+3.5,0.55,0.6,34);cyl(wx+2.2,wz+2.4,wb+2.9,wb+3.7,0.5,0.55,34);
box(wx-5.6,wb+0.6,wz+3,2.2,0.6,0.85,34,0.06,0.5);box(wx-5.6,wb+1.05,wz+3,1.85,0.2,0.55,7,0,0.5);
camel2(C+4,C+33,0.5,false,1);camel2(C+13,C+35,-0.4,true,2);camel2(C+30,C+2,2.4,false,3);cap(C+0.5,hAt(C+0.5,C+30.5)-0.4,C+30.5,C+0.5,hAt(C+0.5,C+30.5)+3,C+30.5,0.26,5);cap(C+0.5,hAt(C+0.5,C+30.5)+2.6,C+30.5,C+8,hAt(C+4,C+33)+6.6,C+35.2,0.06,86);
{const cx=C+23,cz=C+33,cb=hAt(cx,cz);box(cx,cb+2,cz,2.6,0.16,1.5,34,0.04,0.35);for(const s of[-1.5,1.5]){const px=cx-s*Math.sin(0.35),pz=cz+s*Math.cos(0.35);box(cx-s*Math.sin(0.35)*1.0,cb+2.6,cz+s*Math.cos(0.35),2.6,0.55,0.1,34,0.03,0.35);
prim(px-3,px+3,cb-1,cb+4,pz-3,pz+3,5,(x,y,z)=>{const u=(x-px)*Math.cos(0.35)+(z-pz)*Math.sin(0.35),v=(z-pz)*Math.cos(0.35)-(x-px)*Math.sin(0.35),r=Math.hypot(u,y-cb-1.5),an=Math.atan2(y-cb-1.5,u),sp=0.7854,am=((an%sp)+sp)%sp-sp/2;return Math.max(Math.min(Math.abs(r-1.5)-0.16,Math.max(Math.abs(r*Math.sin(am))-0.1,r-1.5),r-0.3),Math.abs(v+s*0.38)-0.14);});}
cap(cx+2.6*Math.cos(0.35),cb+2,cz+2.6*Math.sin(0.35),cx+5.6*Math.cos(0.35),cb+0.4,cz+5.6*Math.sin(0.35),0.14,5);ell(cx-0.6,cb+2.9,cz,0.9,0.6,0.7,57);box(cx+1,cb+2.8,cz+0.4,0.6,0.6,0.6,34,0.06,0.5);amph(cx-1.6,cz-0.3,cb+2.1);}
const ct=[[C-30,C+10,6],[C-22,C+34,5],[C+34,C+32,7],[C+4,C-36,5],[C+38,C+6,4.5],[C-36,C+37,5.5],[C-38,C+24,4],[C+18,C-36,5.5]];ct.forEach((q,k)=>{const b=hAt(q[0],q[1])-0.5,h=q[2];cap(q[0],b,q[1],q[0],b+h,q[1],1.05,28);cap(q[0],b+h*0.45,q[1],q[0]+2.3,b+h*0.5,q[1],0.65,28);cap(q[0]+2.3,b+h*0.5,q[1],q[0]+2.3,b+h*0.9,q[1],0.65,28);
if(k%2===0){cap(q[0],b+h*0.6,q[1],q[0]-2,b+h*0.65,q[1],0.55,28);cap(q[0]-2,b+h*0.65,q[1],q[0]-2,b+h*0.95,q[1],0.55,28);ball(q[0]-2,b+h*0.95+0.6,q[1],0.34,66);}ball(q[0],b+h+1.05,q[1],0.4,66);});
for(let i=0;i<14;i++){const x=C-38+h3(i,71,1)*76,z=C-38+h3(i,71,2)*76;if(G.pd(x,z)<1.6||G.P[mu(x,z)])continue;const b=hAt(x,z);if(b>G0+5)continue;box(x,b+0.3,z,0.7+h3(i,71,3)*1.2,0.5+h3(i,71,4)*0.7,0.6+h3(i,71,5),21,0.6,i);}
[[C-34,C+15,6],[C-31,C+19,9],[C+37,C-7,7],[C+1,C-38,6]].forEach((q,k)=>{const b=hAt(q[0],q[1]);crag(q[0],b+q[2]*0.5-1,q[1],1.5,q[2]*0.5+1,1.5,21,k*9+2);ell(q[0],b+q[2]+0.3,q[1],2.3,0.9,2.1,21);});
{const ax=C-28,az=C+31,ab=hAt(ax,az),ar=0.7,c=Math.cos(ar),s=Math.sin(ar);prim(ax-14,ax+14,ab-2,ab+19,az-12,az+12,21,(x,y,z)=>{const u=(x-ax)*c+(z-az)*s,v=(z-az)*c-(x-ax)*s,w=y-ab;return Math.max(sdBox(u,w-6.5,v,8.6-w*0.14,8,1.9)-1+1.6*(n3(x*0.3,y*0.3,z*0.3)-0.5),-(Math.hypot(u/5.2,(w-2.2)/7.2)-1)*5)*0.75;});}
const mcx=C-16,mcz=C-16,y3=hAt(mcx,mcz),Q=0.7071;
const edges=(dx,dz)=>{const e=[];let prev=hAt(mcx,mcz);for(let r=0.5;r<34;r+=0.25){const h=hAt(mcx+dx*r,mcz+dz*r);if(h<prev-3)e.push(r);prev=h;}return e.length>=3?e:[7,13.5,20];};
const PT=(dx,dz,r)=>[mcx+dx*r,mcz+dz*r],flight=(dx,dz,r0,r1,n,w)=>{const a=PT(dx,dz,r0),b=PT(dx,dz,r1),ya=hAt(a[0],a[1]),yb=hAt(b[0],b[1]);steps(a[0],a[1],ya+0.2,b[0],b[1],yb+0.3,n,w,40);
for(const s of[-1,1]){const ox=-dz*(w+0.45)*s,oz=dx*(w+0.45)*s;steps(a[0]+ox,a[1]+oz,ya+1.2,b[0]+ox,b[1]+oz,yb+1.3,n,0.32,40);}};
for(let k=0;k<8;k++){const a=k*0.7854+0.39,x=mcx+4.9*Math.cos(a),z=mcz+4.9*Math.sin(a),yb=hAt(x,z),brk=k===2||k===5;if(yb<y3-3)continue;column(x,z,yb,brk?2+k*0.5:7.2,brk);
if(k!==1&&k!==2&&k!==4&&k!==5){const a2=a+0.7854,x2=mcx+4.9*Math.cos(a2),z2=mcz+4.9*Math.sin(a2);if(hAt(x2,z2)>y3-3)box((x+x2)/2,yb+8.5,(z+z2)/2,2.3,0.45,0.7,40,0.06,Math.atan2(z2-z,x2-x));}}
cyl(mcx,mcz,y3-0.4,y3+0.7,1.7,1.6,40);cyl(mcx,mcz,y3+0.7,y3+10,1.05,0.6,40);cyl(mcx,mcz,y3+10,y3+11.6,0.6,0.06,54);
cap(mcx+2.2,y3+0.65,mcz-2,mcx+3.6,y3+0.65,mcz-2.9,0.62,40);cap(mcx-3.2,y3+0.65,mcz+1.2,mcx-2.2,y3+0.65,mcz+2.6,0.62,40);
const e1=edges(Q,Q),e2=edges(-Q,Q),e3=edges(Q,-Q);
flight(Q,Q,e1[2]+5.2,e1[2]-1,10,2);flight(-Q,Q,e2[1]+3.8,e2[1]-0.9,8,1.6);flight(Q,-Q,e3[0]+3.6,e3[0]-0.9,8,1.5);
{const t=[-Q,Q],r=[Q,Q],F=PT(Q,Q,e1[1]-1),fx=F[0],fz=F[1],ra=2.356,g=PT(Q,Q,e1[1]+1.8),y0=hAt(g[0],g[1]);const Fp=(o,d)=>[fx+t[0]*o+r[0]*d,fz+t[1]*o+r[1]*d];
prim(fx-9,fx+9,y0-1,y0+11,fz-9,fz+9,40,(x,y,z)=>{const px=x-fx,pz=z-fz,o=px*t[0]+pz*t[1],dr=px*r[0]+pz*r[1],w=y-y0;return Math.max(sdBox(o,w-4.6,dr,5.4,4.8,1.2)-0.15,-sdBox(o,w-2.6,dr-1.2,1.3,2.75,1.1));});
let p=Fp(0,0.15);box(p[0],y0+2.6,p[1],1.3,2.7,0.12,36,0,ra);p=Fp(0,1.45);box(p[0],y0+5.75,p[1],1.9,0.3,0.4,40,0.05,ra);
for(const o of[-4.2,-2.3,2.3,4.2]){p=Fp(o,1.9);cyl(p[0],p[1],y0-0.4,y0+0.5,0.8,0.75,40);cyl(p[0],p[1],y0+0.5,y0+6.3,0.55,0.48,40);cyl(p[0],p[1],y0+6.3,y0+6.8,0.55,0.8,40);}
p=Fp(0,1.5);box(p[0],y0+7.3,p[1],5.6,0.5,1.5,40,0.08,ra);box(p[0],y0+8.2,p[1],4.4,0.4,1.3,40,0.08,ra);box(p[0],y0+8.95,p[1],3,0.35,1.2,40,0.08,ra);box(p[0],y0+9.6,p[1],1.5,0.3,1.1,40,0.08,ra);
for(const o of[-3.25,3.25]){p=Fp(o,3.1);cap(p[0],y0-0.4,p[1],p[0],y0+3.2,p[1],0.2,56);ell(p[0],y0+3.4,p[1],0.5,0.25,0.5,56);ball(p[0],y0+3.75,p[1],0.42,11);L.push([p[0]+1,y0+3.9,p[1]+1,0.9,1,0.6,0.3]);}
p=Fp(0,0.6);ball(p[0],y0+1.6,p[1],0.45,11);}
{const w1=PT(-0.8,0.6,(e2[0]+e2[1])/2),yw=hAt(w1[0],w1[1]);box(w1[0],yw+2,w1[1],0.5,2.2,3.2,40,0.1,0.4);box(w1[0]-0.4,yw+3.4,w1[1]+1,0.5,0.9,0.7,36,0.05,0.4);const w2=PT(-0.3,0.95,(e2[0]+e2[1])/2);box(w2[0],hAt(w2[0],w2[1])+1,w2[1],0.5,1.2,2,40,0.1,1.9);
const w3=PT(0.95,0.3,(e1[0]+e1[1])/2),y4=hAt(w3[0],w3[1]);cap(w3[0],y4+0.65,w3[1],w3[0]+1.6,y4+0.65,w3[1]+1.4,0.62,40);}
const b2=hAt(C+28,C-26);column(C+28,C-26,b2,5,false);column(C+25.5,C-24,b2,2.4,true);
{const bx=C-37,bz=C-1,bb=hAt(bx,bz);ball(bx,bb+0.5,bz,0.6,22);ball(bx+0.5,bb+0.35,bz+0.2,0.36,22);cap(bx-1,bb+0.25,bz-0.3,bx-4,bb+0.25,bz-1,0.16,22);for(let k=0;k<4;k++)cap(bx-1.4-k*0.7,bb+0.25,bz-0.4-k*0.16,bx-1.5-k*0.7,bb+1.2,bz+0.5-k*0.16,0.13,22);}
for(const q of[[C+20,C-18],[C-12,C+36]]){const b=hAt(q[0],q[1]);cap(q[0],b-0.4,q[1],q[0],b+7,q[1],0.2,5);box(q[0]+1,b+6,q[1],1,0.75,0.07,23,0.02);}
}};
}
