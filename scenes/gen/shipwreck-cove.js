// Shipwreck cove: undefined
// A scene for the generator in engine/gen/genmain.js. It must stay self-contained: the generator hands this function to a
// Web Worker as text, so it can use only what it takes from the kit `K`.
export default function (K) {
const {NU,C,G0,HT,G,mu,h3,n2,n3,prim,sm,hAt,sdBox,ball,cap,ell,leafM,alimb,tree2,foot,box,palm,hull,ring,crag,carveW,barrel}=K;
return {name:'Shipwreck cove',water:[34,120,140],ry0:0.9,focus:[8,14,10],bg:[10,16,26],LD:[-0.5,0.66,0.55],amb:[0.46,0.52,0.66],sun:[1.22,1.02,0.76],level:G0,pv:[2,0.2,1],pcol:[230,240,244],pn:22,foot,shallow:true,wc:[[92,204,196],[24,100,150]],
h:(x,z)=>{const r=Math.hypot(x-(C+10),z-(C+10)),back=((C-x)+(C-z))/2;let h=G0-6+9.5*sm(14,30,r)*sm(-10,12,back)+1.2*n2(x*0.1,z*0.1)+0.35*n2(x*0.5,z*0.5)+4*Math.exp(-((x-(C+8))**2+(z-(C+10))**2)/130);
h-=1.6*Math.exp(-((x-(C-15))**2+(z-(C-1))**2)/5);h+=Math.floor(sm(12,26,back+7*n2(x*0.08,z*0.08)-4)*3.3)*6;return h;},
bot:(x,z)=>G0-13-2*n2(x*0.2,z*0.2)-n2(x*0.8,z*0.8),
top:(sx,sy,sz,j,hv)=>sy<G0+0.7?58:sy>G0+6.5?1:((G.P[mu(sx,sz)]&&hv>0.25)?46:20),side:()=>82,
fix:(mm,sx,sy,sz,nx,ny,nz,hv,j)=>{if(mm===7&&ny>0.5&&HT[j]>G0-1.5&&hv<0.6)return 33;
if((mm===93||mm===59||mm===5)&&sy<G0+2.4&&n3(sx*0.35,sy*0.35,sz*0.35)>0.56)return 42;
if(mm===82||mm===3){if(sy<G0+0.9)return 35;if(ny>0.6&&n3(sx*0.25,sy*0.25,sz*0.25)>0.58)return 18;if(n3(sx*0.5+3,sy*0.5,sz*0.5)>0.76)return 83;}return mm;},
scatter:(mm,sx,sy,sz,hv,a,ny)=>{if(mm===1){if(hv>0.95)a(sx,sy+1.1,sz,hv>0.975?66:8);}else if(mm===58&&hv>0.985)a(sx,sy+0.12,sz,62);else if(mm===20&&hv>0.988)a(sx,sy+0.12,sz,22);
else if(mm===93&&sy<G0+3&&hv>0.95)a(sx,sy,sz,22);else if(mm===82&&ny<0.25&&ny>-0.3&&sy>G0+9&&hv<0.02){const n=4+Math.floor(hv*400);for(let q=1;q<=n;q++)a(sx,sy-q*0.7,sz,6);}},
init(){G.P=new Uint8Array(NU*NU);const ln=(a,b,c,d)=>{for(let f=0;f<=1;f+=0.01){const w=1.6*Math.sin(f*7),x=Math.round(a+(c-a)*f+w),z=Math.round(b+(d-b)*f-w);for(let p=-1;p<=0;p++)for(let q=-1;q<=0;q++)G.P[mu(x+p,z+q)]=1;}};
ln(C+2,C-13,C-15,C-2);ln(C-15,C-2,C-19,C-11);ln(C-15,C-2,C-12,C+8);ln(C-11,C-9,C-15,C-2);},
build(){this.lights=[];const wx=C+8,wz=C+10,wy=G0+4.6,c=Math.cos(0.75),s=Math.sin(0.75),cr=Math.cos(0.3),sr=Math.sin(0.3),SC=1.5;
const L=(fn,m,R)=>{R=R||26;prim(wx-R,wx+R,wy-12,wy+30,wz-R,wz+R,m,(x,y,z)=>{const dx=x-wx,dy=y-wy,dz=z-wz,u=dx*c+dz*s,w0=dz*c-dx*s;return fn(u/SC,(dy*cr+w0*sr)/SC,(w0*cr-dy*sr)/SC,x,y,z)*SC;});};
const W2=(u,v,w)=>{u*=SC;v*=SC;w*=SC;const dy=v*cr-w*sr,w0=v*sr+w*cr;return[wx+u*c-w0*s,wy+dy,wz+u*s+w0*c];};
const LC=(a,b,r,m)=>{const p=W2(a[0],a[1],a[2]),q=W2(b[0],b[1],b[2]);cap(p[0],p[1],p[2],q[0],q[1],q[2],r*SC,m);};
const LBl=(u,v,w,r,m)=>{const p=W2(u,v,w);ball(p[0],p[1],p[2],r*SC,m);};
const LB=(u0,v0,w0,bu,bv,bw,m)=>{const p=W2(u0,v0,w0),R=Math.hypot(bu,bv,bw)*SC+2;prim(p[0]-R,p[0]+R,p[1]-R,p[1]+R,p[2]-R,p[2]+R,m,(x,y,z)=>{const dx=x-wx,dy=y-wy,dz=z-wz,u=dx*c+dz*s,ww=dz*c-dx*s;return sdBox(u/SC-u0,(dy*cr+ww*sr)/SC-v0,(ww*cr-dy*sr)/SC-w0,bu,bv,bw)*SC-0.06;});};
const outer=(u,v,w)=>(Math.hypot(u/13,v/5,w/4.3)-1)*4.3,sheer=u=>2.2+0.011*u*u,gap=(u,x,y,z)=>Math.abs(u-1.5)-1.3-2.2*(n3(x*0.4,y*0.4,z*0.4)-0.5);
L((u,v,w,x,y,z)=>{let d=Math.max(outer(u,v,w),-(Math.hypot(u/12.4,(v-0.7)/5,w/3.75)-1)*3.75,v-sheer(u),-11.4-u,-gap(u,x,y,z));
if(u>2.6&&v>-1.8&&v<sheer(u)-0.55){const f=u/2.3-Math.floor(u/2.3);if(f>0.26)d=Math.max(d,0.45);}return d;},93);
L((u,v,w)=>Math.max(sdBox(u+11.2,v+0.6,w,0.3,3,4.4),outer(u,v,w)),93);
L((u,v,w,x,y,z)=>Math.max(sdBox(u,v+4.95,w,12.4,0.55,0.28),-gap(u,x,y,z)),5);LC([12.3,-3,0],[13.6,3.8,0],0.4,5);
L((u,v,w,x,y,z)=>Math.max(Math.abs(v-1.2)-0.22,(Math.hypot(u/12.4,w/3.75)-1)*3,u+0.2+1.4*(n3(x*0.5,y*0.5,z*0.5)-0.5),-11.2-u),34);
LB(-4,1.5,0,1.2,0.12,1.1,5);LB(-4,1.58,0,0.9,0.1,0.8,36);
LB(-8.6,2.6,0,2.7,1.4,3.3,93);LB(-8.6,4.1,0,2.95,0.18,3.55,34);LB(-5.85,2.6,0,0.12,1.1,0.7,85);
for(let k=0;k<3;k++)LB(-5.2+k*0.55,1.65+(2-k)*0.5,2.1,0.3,0.25+(2-k)*0.25,0.9,5);
LB(-11.3,2.9,0,0.14,0.9,3.1,54);for(const w of[-2.1,-0.7,0.7,2.1])LB(-11.48,2.9,w,0.1,0.55,0.48,11);
for(const w of[-3.4,3.4]){for(let k=0;k<6;k++)LC([-11.1+k*1.05,4.3,w],[-11.1+k*1.05,5.5,w],0.13,5);LC([-11.3,5.5,w],[-5.7,5.5,w],0.15,5);}
for(let k=0;k<6;k++)LC([-11.35,4.3,-3.4+k*1.36],[-11.35,5.5,-3.4+k*1.36],0.13,5);LC([-11.35,5.5,-3.4],[-11.35,5.5,3.4],0.15,5);
LC([-11.4,4.2,0],[-12.1,6.7,0],0.14,56);LBl(-12.1,7.2,0,0.55,10);
L((u,v,w)=>Math.hypot(Math.hypot(v-5.75,w)-0.9,u+6.6)-0.13,5,20);for(let k=0;k<4;k++){const a=k*0.7854;LC([-6.6,5.75-1.1*Math.cos(a),-1.1*Math.sin(a)],[-6.6,5.75+1.1*Math.cos(a),1.1*Math.sin(a)],0.08,5);}LB(-6.9,4.9,0,0.2,0.7,0.2,5);
LC([-3,1.2,0],[-3.4,17,0],0.42,5);L((u,v,w)=>Math.max(Math.hypot(u+3.3,w)-1.45,Math.abs(v-13)-0.14),34,22);L((u,v,w)=>Math.max(Math.abs(Math.hypot(u+3.3,w)-1.45)-0.1,Math.abs(v-13.6)-0.55),5,22);
LC([-3.3,11,-5.2],[-3.3,11,5.2],0.3,5);LC([-3.4,15,-3],[-3.4,15,3],0.22,5);
L((u,v,w,x,y,z)=>Math.max(sdBox(u+3.75,v-7.6,w,0.2,3.3,4.6),(n3(x*0.33,y*0.33,z*0.33)-(0.68-0.045*(10.9-v)))*4),57);
L((u,v,w,x,y,z)=>Math.max(sdBox(u+3.8,v-13.6,w,0.18,1.3,2.6),(n3(x*0.4+9,y*0.4,z*0.4)-0.5)*4),57);
for(const w of[-3.9,3.9])for(const u of[-6,-4.4,-1.4])LC([-3.4,12.9,0],[u,2.3,w],0.07,86);
LB(-2.5,17.3,0,0.9,0.35,0.06,23);
LC([5.5,-2.5,0],[5.8,5.4,0.4],0.5,5);LC([5.8,5.4,0.4],[6.3,6.4,0.2],0.3,5);
LC([12.6,2.6,0],[18.2,5.2,0],0.32,5);LC([11.6,2.3,2.3],[12.3,-3.4,3.3],0.13,56);LC([12.3,-3.4,3.3],[12.3,-5.2,3.3],0.2,56);LC([11.4,-4.6,3.3],[13.2,-4.6,3.3],0.18,56);
for(const w of[2.5,-2.5]){LB(-1.8,1.75,w,0.7,0.3,0.5,5);LC([-1.8,2.25,w*0.6],[-1.8,2.35,w*1.72],0.36,56);}
for(const q of[[-0.4,1.7,0.6],[0.1,1.7,0.6],[-0.15,1.7,1.05],[-0.15,2.2,0.75]])LBl(q[0]-2.4,q[1],q[2]-0.2,0.3,56);
LB(1.1,-2.7,0.9,0.8,0.8,0.8,34);LB(1.5,-1.2,0.5,0.55,0.55,0.55,34);LC([2,-3.4,-1.2],[2,-1.9,-1.2],0.62,5);
{let p=W2(-6.5,-1.2,4.1);carveW(p[0],p[1],p[2],2.3,93,59);p=W2(-7.5,0.2,-4);carveW(p[0],p[1],p[2],1.9,93,59);p=W2(8,-0.5,3.4);carveW(p[0],p[1],p[2],1.6,93,59);}
const sl=W2(-12.1,7.2,0),sw=W2(-13.2,2.9,0),mt=W2(-3.4,17,0);this.lights.push([sl[0],sl[1],sl[2],1.2,1,0.8,0.45],[sw[0],sw[1],sw[2],1,1,0.7,0.35]);this.birds=[mt[0]-C,mt[1]+3-G0,mt[2]-C,5];this.waves=[wx-C,wz-C];
{const a=[C-9,hAt(C-9,C-17)+0.7,C-17],b=[C+12,hAt(C+12,C-27)+0.9,C-27];cap(a[0],a[1],a[2],b[0],b[1],b[2],0.6,5);cap(a[0]+6,a[1]+0.5,a[2]-6.5,a[0]+10,a[1]+0.5,a[2]+1,0.3,5);alimb([a[0]+8,a[1]+0.75,a[2]-2.6],[a[0]+12,a[1]+0.3,a[2]-0.4],2.6,0.09,57,[1,0,0]);}
palm(C-19,C+9,13,1);palm(C+9,C-19,15,2);palm(C-7,C-9,11,3);palm(C-25,C-3,12,4);palm(C+19,C-23,10,5);
const kx=C-17,kz=C-3,kb=hAt(kx,kz);box(kx,kb+0.9,kz,1.6,0.95,1.05,34,0.1,0.5);box(kx,kb+0.9,kz,1.72,0.14,1.17,54,0.03,0.5);alimb([kx-0.9,kb+1.9,kz-0.5],[kx-1.5,kb+3.5,kz-0.85],1.7,0.14,34,[1,0,0]);
for(let k=0;k<26;k++){const a=h3(k,121,1)*6.28,d=h3(k,121,2)*(k<12?1.1:3.4),x=kx+d*Math.cos(a),z=kz+d*Math.sin(a);ball(x,(k<12?kb+1.95:hAt(x,z)+0.15)+h3(k,121,3)*0.3,z,0.26+h3(k,121,4)*0.12,54);}
ball(kx+0.3,kb+2.4,kz,0.3,10);ball(kx-0.5,kb+2.3,kz+0.4,0.24,61);ball(kx+0.6,kb+2.2,kz-0.3,0.22,31);this.lights.push([kx,kb+3.2,kz,1,1,0.85,0.4]);
cap(kx+3.2,hAt(kx+3.2,kz+2)-0.6,kz+2,kx+3.9,hAt(kx+3.2,kz+2)+3.8,kz+2.3,0.16,5);box(kx+3.15,hAt(kx+3.2,kz+2)-0.2,kz+1.98,0.5,0.6,0.08,56,0.03,0.3);
barrel(C-12,C+3,hAt(C-12,C+3)-0.2,2.3);barrel(C-10.4,C+4.4,hAt(C-10.4,C+4.4)-0.2,2.3);cap(C-14.5,hAt(C-14.5,C+5.5)+0.75,C+5.5,C-12.4,hAt(C-12.4,C+7)+0.75,C+7,0.8,5);
box(C-9,hAt(C-9,C+7)+0.8,C+7,1.1,0.95,1.1,34,0.08,0.9);box(C-8.6,hAt(C-9,C+7)+2.4,C+6.8,0.7,0.6,0.7,34,0.08,0.3);ring(C-6.5,hAt(C-6.5,C+5)+0.3,C+5,0.75,0.22,86);ring(C-6.5,hAt(C-6.5,C+5)+0.68,C+5,0.6,0.2,86);
{const p1=[C-15,C-12],p2=[C-11,C-8],y1=hAt(p1[0],p1[1]),y2=hAt(p2[0],p2[1]);cap(p1[0],y1-0.5,p1[1],p1[0],y1+4.2,p1[1],0.24,5);cap(p2[0],y2-0.5,p2[1],p2[0],y2+4.2,p2[1],0.24,5);cap(p1[0],y1+4.1,p1[1],p2[0],y2+4.1,p2[1],0.2,5);
alimb([(p1[0]+p2[0])/2,(y1+y2)/2+4.1,(p1[1]+p2[1])/2],[(p1[0]+p2[0])/2+3,(y1+y2)/2+0.3,(p1[1]+p2[1])/2-3],2.9,0.09,57,[1,0,0]);
box(C-12.2,(y1+y2)/2+0.35,C-11.2,1.6,0.22,0.7,23,0.12,0.785);box(C-9.6,hAt(C-9.6,C-11)+0.6,C-11,0.6,0.6,0.6,34,0.06,0.2);ball(C-9.6,hAt(C-9.6,C-11)+1.6,C-11,0.42,10);this.lights.push([C-9.6,hAt(C-9.6,C-11)+1.8,C-11,1,1,0.8,0.45]);}
{const bx=C+2,bz=C-15,bb=hAt(bx,bz)+0.8,ra=2.3,cc=Math.cos(ra),ss=Math.sin(ra);hull(bx,bb,bz,ra,34);for(const u of[-2.4,0,2.4])box(bx+u*cc,bb+0.45,bz+u*ss,0.32,0.11,1.5-Math.abs(u)*0.12,5,0.02,ra);cap(bx-3*cc+1,bb+0.9,bz-3*ss+1.4,bx+3.4*cc+1.2,bb+0.6,bz+3.4*ss+1.5,0.13,34);cap(bx+3,bb-0.3,bz+3.4,bx+7.5,bb-0.5,bz+1.2,0.13,34);}
const ax=C-13,az=C+11,ab=hAt(ax,az);cap(ax,ab,az,ax+0.9,ab+4.6,az,0.3,56);cap(ax-1.8,ab+0.5,az,ax+2,ab+0.2,az,0.32,56);cap(ax-1.8,ab+0.5,az,ax-2.3,ab+1.6,az,0.26,56);cap(ax+2,ab+0.2,az,ax+2.6,ab+1.3,az,0.26,56);cap(ax-0.4,ab+4.1,az,ax+2.2,ab+4.4,az,0.24,56);ring(ax+0.95,ab+5.1,az,0.5,0.14,56);
const cvx=C-22.5,cvz=C-15.5,cvb=hAt(C-19,C-12);ell(cvx+1.6,cvb+2.8,cvz+1.6,3.6,3.9,3.6,36);cap(cvx+4.6,cvb-0.5,cvz+0.2,cvx+4.6,cvb+4.6,cvz+0.2,0.34,5);cap(cvx+0.2,cvb-0.5,cvz+4.6,cvx+0.2,cvb+4.6,cvz+4.6,0.34,5);cap(cvx+5,cvb+4.7,cvz-0.2,cvx-0.2,cvb+4.7,cvz+5,0.34,5);
ball(cvx+2.6,cvb+2.6,cvz+2.6,0.5,11);ball(cvx+1.6,cvb+0.8,cvz+2.4,0.3,10);this.lights.push([cvx+4.4,cvb+2.8,cvz+4.4,1.1,1,0.6,0.3]);leafM(cvx+3.4,cvb+6.4,cvz+3.4,2.2,6);leafM(cvx+0.6,cvb+6.8,cvz+5,1.6,6);
tree2(C-29,C-27,15,6,41);tree2(C-35,C-13,13,5,42);tree2(C-14,C-35,12,5,43);for(let i=0;i<8;i++){const x=C-40+h3(i,131,1)*30,z=C-40+h3(i,131,2)*30,b=hAt(x,z);if(b<G0+7)continue;leafM(x,b+0.6,z,1.2+h3(i,131,3)*1.2,6);}
[[C+26,C+30,2.6,5],[C+34,C+16,2,4],[C+20,C+36,1.8,3],[C+36,C+34,2.4,6],[C+30,C-2,1.6,3],[C+37,C+2,1.4,2.4],[C-4,C+36,1.5,2.6]].forEach((q,k)=>crag(q[0],G0-3+q[3]*0.5,q[1],q[2],q[3]*0.5+3,q[2]*0.85,82,k*13+5));
for(let i=0;i<7;i++){const x=C+16+h3(i,141,1)*22,z=C-6+h3(i,141,2)*38;if(hAt(x,z)>G0-1.5)continue;box(x,G0+0.03,z,1.2+h3(i,141,3),0.12,0.28,34,0.03,h3(i,141,4)*3);}
cap(C+24,G0-0.05,C+22,C+25.6,G0-0.05,C+23,0.72,5);cap(C+15,G0-0.2,C+19,C+17.6,G0+0.5,C+20.2,0.5,56);
for(let i=0;i<10;i++){const x=C-28+h3(i,151,1)*40,z=C-28+h3(i,151,2)*40,b=hAt(x,z);if(b<G0+0.8||b>G0+5.5||G.P[mu(x,z)])continue;box(x,b+0.3,z,0.7+h3(i,151,3),0.5+h3(i,151,4)*0.4,0.6+h3(i,151,5)*0.6,3,0.5,i);}
cap(C-2,hAt(C-2,C+3)+0.5,C+3,C+2.5,hAt(C+2.5,C+1)+0.5,C+1,0.5,5);cap(C-20,hAt(C-20,C+18)+0.4,C+18,C-16.5,hAt(C-16.5,C+20)+0.4,C+20,0.4,5);
}};
}
