// Lighthouse rock: undefined
// A scene for the generator in engine/gen/genmain.js. It must stay self-contained: the generator hands this function to a
// Web Worker as text, so it can use only what it takes from the kit `K`.
export default function (K) {
const {NU,C,G0,HT,G,pk,mu,h3,n2,n3,prim,sm,hAt,ball,cap,leafM,foot,cyl,box,gable,steps,hull,ring,crag}=K;
function hull2(bx,bY,bz,ra,sc,m){const c=Math.cos(ra),s=Math.sin(ra),R=8*sc;prim(bx-R,bx+R,bY-4*sc,bY+4*sc,bz-R,bz+R,m,(x,y,z)=>{const u=((x-bx)*c+(z-bz)*s)/sc,w=((z-bz)*c-(x-bx)*s)/sc,v=(y-bY)/sc;return Math.max((Math.hypot(u/5.2,v/1.9,w/2.2)-1)*1.9,-(Math.hypot(u/4.75,(v-0.45)/1.9,w/1.85)-1)*1.85,v-0.9)*sc;});}
return {name:'Lighthouse rock',water:[30,84,130],ry0:0.785,focus:[-2,20,0],bg:[10,14,28],LD:[-0.5,0.62,0.6],amb:[0.42,0.5,0.7],sun:[1.14,0.9,0.7],level:G0,pv:[3,0.2,1.5],pcol:[230,240,244],pn:26,foot,shallow:true,
h:(x,z)=>{const r=Math.hypot(x-(C-4),z-(C-2)),m=Math.max(0,24*(1-(r/27)**2))*(0.7+0.6*n2(x*0.11,z*0.11));let h=G0-7+2*n2(x*0.1+5,z*0.1)+Math.min(m,15+0.6*n2(x*0.3,z*0.3));
const ls=Math.hypot(x-(C+16),z-(C+13));if(ls<6.5)h+=(G0+2.5-h)*sm(6.5,3.5,ls);
return h>G0+0.5?Math.floor(h/2)*2+0.7*n2(x*0.4,z*0.4)+0.5*n2(x*1.3,z*1.3):h;},
bot:(x,z)=>G0-12-2*n2(x*0.2,z*0.2)-n2(x*0.8,z*0.8),
top:(sx,sy,sz,j,hv,ny)=>sy<G0+1.3?35:(sy>G0+7&&ny>0.8)?((G.P[mu(sx,sz)]&&hv>0.18)?13:1):82,side:(sx,sy)=>sy<G0+1.3?35:82,
fix:(mm,sx,sy,sz,nx,ny,nz,hv,j)=>{if(mm===7&&ny>0.5&&HT[j]>G0-2.2&&hv<0.75)return 33;if(mm===35&&n3(sx*0.3,sy*0.3,sz*0.3)>0.58)return 42;
if(mm===82||mm===3){if(sy<G0+1.3)return n3(sx*0.3,sy*0.3,sz*0.3)>0.58?42:35;if(ny>0.6&&n3(sx*0.25,sy*0.25,sz*0.25)>0.6)return 18;if(n3(sx*0.5+3,sy*0.5,sz*0.5)>0.74)return 83;}
if(mm===34&&sy<G0+0.9&&ny<0.4)return 5;return mm;},
scatter:(mm,sx,sy,sz,hv,a)=>{if(mm===1){if(hv>0.95)a(sx,sy+1.1,sz,hv>0.975?66:8);}else if(mm===35&&hv>0.93)a(sx,sy+0.1,sz,22);else if(mm===18&&hv>0.97)a(sx,sy+0.4,sz,8);},
init(){G.P=new Uint8Array(NU*NU);const ln=(a,b,c,d)=>{for(let f=0;f<=1;f+=0.01){const w=1.2*Math.sin(f*6.28),x=Math.round(a+(c-a)*f+w),z=Math.round(b+(d-b)*f-w);for(let p=-1;p<=0;p++)for(let q=-1;q<=0;q++)G.P[mu(x+p,z+q)]=1;}};
ln(C+7,C+7,C+0.5,C+2.5);ln(C+7,C+7,C+4,C+9);ln(C+0.5,C+2.5,C+4,C+9);},
build(){const cx=C-4,cz=C-2,by=hAt(cx,cz);G.lby=by;G.lx=cx;G.lz=cz;this.lights=[[cx,by+33,cz,2.4,1,0.85,0.5]];this.beam=[cx-C,cz-C];this.waves=[cx-C,cz-C];this.birds=[cx-C,by+36-G0,cz-C,6];
this.beamShaft=[cx,by+33.2,cz,1.5,21,34];
cyl(cx,cz,by-2.5,by+0.6,7,6.6,4);cyl(cx,cz,by+0.6,by+1.4,6.2,6,4);cyl(cx,cz,by+1.4,by+30,5,3.3,39);
const rAt=y=>5-1.7*(y-by-1.4)/28.6;
const win=(a,y,lit)=>{const r=rAt(y),px=cx+r*Math.cos(a),pz=cz+r*Math.sin(a);box(px,y,pz,0.85,1.3,0.28,22,0.06,a+1.5708);box(px+0.14*Math.cos(a),y,pz+0.14*Math.sin(a),0.5,0.95,0.3,lit?11:36,0.02,a+1.5708);box(px+0.2*Math.cos(a),y-1.45,pz+0.2*Math.sin(a),1,0.14,0.42,22,0.03,a+1.5708);
if(lit)this.lights.push([px+2*Math.cos(a),y,pz+2*Math.sin(a),0.6,1,0.7,0.35]);};
win(0.785,by+9.5,true);win(2.4,by+13,false);win(-0.6,by+17.5,false);win(0.785,by+22,true);win(3.7,by+24.5,false);win(-2.2,by+9,false);win(4.6,by+15,true);
{const a=0.785,r=5.6,px=cx+r*Math.cos(a),pz=cz+r*Math.sin(a);box(px-0.5*Math.cos(a),by+3.4,pz-0.5*Math.sin(a),1.5,2.5,0.5,22,0.15,a+1.5708);box(px-0.3*Math.cos(a),by+3.1,pz-0.3*Math.sin(a),1,2.1,0.5,85,0.05,a+1.5708);
box(px+1*Math.cos(a),by+0.9,pz+1*Math.sin(a),1.7,0.3,1,4,0.08,a+1.5708);box(px+1.9*Math.cos(a),by+0.4,pz+1.9*Math.sin(a),2,0.3,1,4,0.08,a+1.5708);
ball(px-0.2*Math.cos(a),by+6.6,pz-0.2*Math.sin(a),0.45,10);this.lights.push([px+1.5*Math.cos(a),by+6.4,pz+1.5*Math.sin(a),0.8,1,0.8,0.45]);}
for(let k=0;k<12;k++){const a=k*0.5236;box(cx+4.2*Math.cos(a),by+28.9,cz+4.2*Math.sin(a),0.3,0.75,0.75,4,0.05,a+1.5708);}
cyl(cx,cz,by+29.6,by+30.3,5.7,5.7,24);
for(let k=0;k<16;k++){const a=k*0.3927;cap(cx+5.35*Math.cos(a),by+30.3,cz+5.35*Math.sin(a),cx+5.35*Math.cos(a),by+32.7,cz+5.35*Math.sin(a),0.2,24);}
ring(cx,by+31.5,cz,5.35,0.16,24);ring(cx,by+32.7,cz,5.35,0.2,24);
cyl(cx,cz,by+30.3,by+31.3,2.95,2.95,22);cyl(cx,cz,by+31.3,by+35,2.55,2.55,10);for(let k=0;k<8;k++){const a=k*0.7854+0.39;cap(cx+2.65*Math.cos(a),by+31.3,cz+2.65*Math.sin(a),cx+2.65*Math.cos(a),by+35,cz+2.65*Math.sin(a),0.2,24);}
ring(cx,by+33.1,cz,2.65,0.14,24);cyl(cx,cz,by+35,by+35.7,3.4,3.4,24);cyl(cx,cz,by+35.7,by+40,3.5,0.3,90);ball(cx,by+40.3,cz,0.55,54);cap(cx,by+40.3,cz,cx,by+44,cz,0.16,24);
box(cx+0.9,by+42.2,cz,0.9,0.1,0.1,24,0.02);box(cx+1.5,by+43.3,cz,1.2,0.5,0.1,23,0.03);
box(cx-5.6,by+3,cz-4.4,2.6,2.6,2.1,22,0.1,0.66);box(cx-5.9,by+5.9,cz-4.7,3.1,0.3,2.6,24,0.05,0.66);box(cx-7.5,by+2.4,cz-2.9,0.6,1.6,0.25,85,0.04,0.66);
const hx=cx+12,hz=cz+5,hb=hAt(hx,hz);box(hx,hb-2.5,hz,4.9,3.5,4.1,4,0.2);box(hx,hb+3,hz,4,2.4,3.2,22,0.1);for(const a of[-4,4])for(const b of[-3.2,3.2])cap(hx+a,hb+0.8,hz+b,hx+a,hb+5.4,hz+b,0.32,5);
gable(hx,hb+5.3,hz,4.9,3.9,25);cap(hx,hb+10.25,hz-4,hx,hb+10.25,hz+4,0.3,24);box(hx+2,hb+8.9,hz-1.5,0.75,2,0.75,4,0.05);cyl(hx+2,hz-1.5,hb+10.9,hb+11.7,0.5,0.4,25);
this.emit=[[hx+2-C,hb+12-G0,hz-1.5-C,7,pk(150,150,165),pk(96,98,120)]];
box(hx-1.2,hb+2.6,hz+3.25,1,1.8,0.25,22,0.05);box(hx-1.2,hb+2.4,hz+3.36,0.72,1.5,0.22,85,0.03);box(hx-1.2,hb+5,hz+4,1.5,0.14,0.95,25,0.03);box(hx-1.2,hb+0.5,hz+4.1,1.3,0.3,0.7,4,0.06);
const wz=(x,y,z,ra)=>{box(x,y,z,0.95,0.95,0.24,22,0.05,ra);const ox=ra?0.12:0,oz=ra?0:0.12;box(x+ox,y,z+oz,0.66,0.66,0.24,11,0.02,ra);box(x+ox*2,y,z+oz*2,0.07,0.66,0.2,22,0,ra);box(x+ox*2,y,z+oz*2,0.66,0.07,0.2,22,0,ra);
if(ra){box(x+0.05,y,z-1.3,0.28,0.9,0.12,85,0.02,ra);box(x+0.05,y,z+1.3,0.28,0.9,0.12,85,0.02,ra);}else{box(x-1.3,y,z+0.05,0.28,0.9,0.12,85,0.02);box(x+1.3,y,z+0.05,0.28,0.9,0.12,85,0.02);}};
wz(hx+2.2,hb+3.5,hz+3.25,0);wz(hx+4.05,hb+3.5,hz,1.5708);wz(hx-4.05,hb+3.5,hz+0.5,1.5708);
this.lights.push([hx+2.2,hb+3.5,hz+5.5,0.9,1,0.7,0.35],[hx+6.2,hb+3.5,hz,0.7,1,0.7,0.35]);
cyl(hx-5,hz+2.4,hb+0.2,hb+2.5,0.9,0.9,5);ring(hx-5,hb+0.9,hz+2.4,0.92,0.1,56);ring(hx-5,hb+1.9,hz+2.4,0.92,0.1,56);
for(let i=0;i<4;i++)for(let j=0;j<3-(i>2?1:0);j++)cap(hx-6.3+i*0.72,hb+0.5+j*0.68,hz-3.2,hx-6.3+i*0.72,hb+0.5+j*0.68,hz-1.2,0.33,(i+j)%2?5:34);
box(hx+1.6,hb+1.1,hz+4.6,1.3,0.12,0.42,34,0.03);box(hx+0.6,hb+0.6,hz+4.6,0.12,0.5,0.35,5,0.02);box(hx+2.6,hb+0.6,hz+4.6,0.12,0.5,0.35,5,0.02);
{const a=[cx-9.5,cz+5.5],b=[cx-4.5,cz+10.5],ya=hAt(a[0],a[1]),yb=hAt(b[0],b[1]),ra=Math.atan2(b[1]-a[1],b[0]-a[0]);cap(a[0],ya-0.5,a[1],a[0],ya+4.6,a[1],0.25,5);cap(b[0],yb-0.5,b[1],b[0],yb+4.6,b[1],0.25,5);cap(a[0],ya+4.4,a[1],b[0],yb+4.4,b[1],0.12,86);
[23,22,88,57,22].forEach((m,k)=>{const f=0.14+k*0.18,x=a[0]+(b[0]-a[0])*f,z=a[1]+(b[1]-a[1])*f,y=ya+(yb-ya)*f+4.3;box(x,y-0.75-(k%2)*0.25,z,0.55,0.7+(k%2)*0.25,0.08,m,0.02,ra);});}
for(let k=0;k<9;k++){const x=hx-3.6+k*0.85,z=hz+6.6,b=hAt(x,z);if(b<hb-1)continue;box(x,b+0.85,z,0.17,0.95,0.09,22,0.02);}cap(hx-3.6,hAt(hx-3.6,hz+6.6)+1.2,hz+6.6,hx+3.2,hAt(hx+3.2,hz+6.6)+1.2,hz+6.6,0.1,22);
for(let k=3;k<26;k++){if(k===15||k===16||k===17)continue;const a=k*0.2417,x=cx+13.2*Math.cos(a),z=cz+11.8*Math.sin(a),b=hAt(x,z);if(b<by-1.2)continue;box(x,b+0.5,z,0.75,0.55,0.5,4,0.15,a+1.5708);if(k%2)box(x+0.2,b+1.4,z,0.7,0.45,0.48,4,0.15,a+1.6);}
steps(C+17,C+13,G0+2.4,cx+8,cz+10,by+0.3,12,1.7,4);
for(let k=0;k<5;k++){const f=k/4,x=C+17.8+(cx+8.6-C-17.8)*f+0.9,z=C+13+(cz+10-C-13)*f+1.9,y=G0+2.4+(by+0.3-G0-2.4)*f;cap(x,y-0.5,z,x,y+2.4,z,0.22,5);if(k<4){const f2=(k+1)/4,x2=C+17.8+(cx+8.6-C-17.8)*f2+0.9,z2=C+13+(cz+10-C-13)*f2+1.9,y2=G0+2.4+(by+0.3-G0-2.4)*f2;cap(x,y+2.2,z,(x+x2)/2,(y+y2)/2+1.7,(z+z2)/2,0.13,86);cap((x+x2)/2,(y+y2)/2+1.7,(z+z2)/2,x2,y2+2.2,z2,0.13,86);}}
const jy=G0+2.1,jz=C+13;for(let i=0;i<22;i++)box(C+19.6+i*0.93,jy,jz,0.4,0.2,2.1+(i%5===0?0.25:0),34,0.04);
cap(C+19,jy-0.45,jz-1.6,C+39.5,jy-0.45,jz-1.6,0.28,5);cap(C+19,jy-0.45,jz+1.6,C+39.5,jy-0.45,jz+1.6,0.28,5);
for(let i=0;i<5;i++){const x=C+20.5+i*4.7;for(const s of[-1.95,1.95]){cap(x,G0-6,jz+s,x,jy+1.1,jz+s,0.48,5);ball(x,jy+1.2,jz+s,0.52,5);}cap(x,jy-0.6,jz-1.9,x,G0-1.6,jz+1.9,0.18,5);cap(x,G0-1.6,jz-1.9,x,jy-0.6,jz+1.9,0.18,5);}
for(const s of[-0.45,0.45])cap(C+30+s,jy+0.6,jz+2.35,C+30+s,G0-2,jz+2.7,0.14,5);for(let k=0;k<5;k++)cap(C+29.55,jy-0.2-k*0.75,jz+2.4+k*0.06,C+30.45,jy-0.2-k*0.75,jz+2.4+k*0.06,0.11,5);
box(C+33,jy+1.2,jz-0.8,1,1,1,34,0.06,0.3);box(C+33.1,jy+3,jz-0.7,0.75,0.75,0.75,34,0.06,0.9);box(C+35.3,jy+1,jz+0.7,0.8,0.8,0.8,34,0.06,0.7);
for(const q of[[C+27.5,jz-1],[C+24.6,jz+0.9]]){cyl(q[0],q[1],jy+0.2,jy+2.5,0.85,0.85,5);ring(q[0],jy+0.9,q[1],0.88,0.09,56);ring(q[0],jy+1.9,q[1],0.88,0.09,56);cyl(q[0],q[1],jy+2.5,jy+2.62,0.7,0.7,34);}
for(const q of[[C+22.3,jz-1.1,0.2],[C+23.2,jz+1,1.1],[C+22.4,jz+0.2,0.6]])box(q[0],jy+0.75+(q[2]>0.5?0:0),q[1],0.75,0.5,0.55,87,0.15,q[2]);
ring(C+37.2,jy+0.4,jz+0.9,0.7,0.2,86);ring(C+37.2,jy+0.75,jz+0.9,0.55,0.18,86);
cap(C+39,G0-2,jz-1.4,C+39,jy+5.6,jz-1.4,0.3,5);ball(C+39,jy+6.5,jz-1.4,0.75,10);this.lights.push([C+39,jy+6.5,jz-1.4,1.1,1,0.8,0.45]);
cap(C+26,jy,jz-2.1,C+26,jy+5.5,jz-2.1,0.3,5);cap(C+26,jy+5.4,jz-2.1,C+26,jy+6,jz-5.6,0.24,5);cap(C+26,jy+6,jz-5.6,C+26,jy+2.4,jz-5.6,0.08,86);ball(C+26,jy+1.9,jz-5.6,0.6,23);
{const lx=C+15.5,lz=C+9.5,b=hAt(lx,lz);cap(lx,b-0.4,lz,lx,b+3.6,lz,0.22,5);cap(lx+3,b-0.4,lz-1.6,lx+3,b+3.6,lz-1.6,0.22,5);cap(lx,b+3.5,lz,lx+3,b+3.5,lz-1.6,0.16,5);box(lx+1.5,b+2.1,lz-0.8,1.5,1.3,0.07,87,0.02,-0.49);
for(const q of[[C+14.2,C+14.6],[C+18.6,C+15.4]]){const bb=hAt(q[0],q[1]);cyl(q[0],q[1],bb-0.3,bb+1.3,0.5,0.42,56);cyl(q[0],q[1],bb+1.3,bb+1.6,0.65,0.65,56);}}
hull(C+31,G0+0.4,C+19,0,34);for(const u of[-2.4,0,2.4])box(C+31+u,G0+0.85,C+19,0.32,0.11,1.55-Math.abs(u)*0.12,5,0.02);cap(C+28.5,G0+1.2,C+17.6,C+34.5,G0+1.2,C+18.2,0.13,34);box(C+35.2,G0+1.2,C+18.27,0.7,0.06,0.3,34,0.02,0.1);cap(C+28,G0+1.2,C+20.3,C+34,G0+1.2,C+19.8,0.13,34);box(C+27.3,G0+1.2,C+20.36,0.7,0.06,0.3,34,0.02,-0.08);
cap(C+26.2,G0+1,C+19,C+24.6,jy+0.3,jz+1.95,0.09,86);
{const fx=C+9,fz=C+33,fa=0.45,c=Math.cos(fa),s=Math.sin(fa),Q=(u,w)=>[fx+u*c-w*s,fz+u*s+w*c];hull2(fx,G0+0.7,fz,fa,1.45,88);
let p=Q(-3.4,0);box(p[0],G0+2.3,p[1],1.5,1.25,1.25,22,0.08,fa);box(p[0],G0+3.7,p[1],1.8,0.16,1.5,23,0.04,fa);p=Q(-1.86,0);box(p[0],G0+2.5,p[1],0.1,0.5,0.7,36,0.02,fa);
p=Q(0.6,0);cap(p[0],G0+0.6,p[1],p[0],G0+10.5,p[1],0.28,5);const q=Q(5.4,0);cap(p[0],G0+3.2,p[1],q[0],G0+3.5,q[1],0.2,5);cap(p[0]+0.3*c,G0+3.75,p[1]+0.3*s,q[0],G0+4,q[1],0.5,57);ball(p[0],G0+11,p[1],0.5,10);this.lights.push([p[0],G0+11,p[1],0.7,1,0.8,0.45]);
cap(p[0],G0+10.2,p[1],q[0]+1.5*c,G0+1.8,q[1]+1.5*s,0.07,86);for(const u of[-2,1,3.4]){const f=Q(u,2.95-Math.abs(u)*0.22);ball(f[0],G0+1,f[1],0.5,23);}
for(const u of[-0.6,2]){const f=Q(u,0);box(f[0],G0+1.1,f[1],0.3,0.1,2.2,5,0.02,fa);}
const bw=Q(7.2,0);cap(bw[0],G0+1.6,bw[1],(bw[0]+C+14.2)/2,G0+0.2,(bw[1]+C+14.6)/2,0.09,86);cap((bw[0]+C+14.2)/2,G0+0.2,(bw[1]+C+14.6)/2,C+14.2,hAt(C+14.2,C+14.6)+1.2,C+14.6,0.09,86);}
const ux=C+2,uz=C+38;cyl(ux,uz,G0-0.7,G0+1.2,1.9,1.5,23);cyl(ux,uz,G0+1.2,G0+1.7,1.5,1.3,22);for(let k=0;k<3;k++){const a=k*2.094;cap(ux+1.1*Math.cos(a),G0+1.7,uz+1.1*Math.sin(a),ux,G0+5,uz,0.16,24);}ball(ux,G0+5.4,uz,0.5,11);this.lights.push([ux,G0+5.4,uz,0.6,1,0.6,0.3]);
[[cx-12,by-2,cz-8,3,6,2.6],[cx-9.5,by-3,cz+13,2.4,5,2.4],[cx+10,by-4,cz-12.5,2.6,5,2.3],[cx-14,by-5,cz+3,2.4,4,2.6],[cx+3,by-4,cz-14.5,3,4.4,2.2],[cx+16.5,by-5.5,cz-3,2.2,3.6,2.4]].forEach((q,k)=>crag(q[0],q[1],q[2],q[3],q[4],q[5],82,k*7));
const st=[[C-30,C+24,3.6,9],[C-34,C-20,3,13],[C+24,C-30,3.3,8],[C-14,C+35,2.5,5],[C+36,C-12,2.2,7],[C-31,C-27,2,7],[C+29,C-35,1.8,4],[C-37,C+6,1.7,4]];
st.forEach((q,k)=>{crag(q[0],G0-3+q[3]*0.5,q[1],q[2],q[3]*0.5+3.2,q[2]*0.85,82,k*11+3);if(k<4){const ty=G0+q[3]*0.92;ball(q[0]+0.4,ty+0.5,q[1],0.45,22);ball(q[0]+0.75,ty+0.95,q[1]+0.1,0.28,22);}});
{const tx=cx-8,tz=cz-7,tb=hAt(tx,tz);let px=tx,py=tb-0.5,pz=tz;for(let i=0;i<6;i++){const nx=px-0.45-i*0.3,ny=py+1.5-i*0.08,nz=pz-0.3-i*0.14;cap(px,py,pz,nx,ny,nz,0.75-i*0.09,5);px=nx;py=ny;pz=nz;}
cap(px+2.2,py-3,pz+1,px+0.4,py+0.5,pz+2.4,0.3,5);leafM(px-1.4,py+1,pz-0.8,3.1,6);leafM(px-4.2,py+0.2,pz-1.8,2.4,6);leafM(px+0.6,py+1,pz+2.4,2,6);leafM(px-2.8,py+1.7,pz+1,1.9,6);}
for(let i=0;i<9;i++){const a=1.9+h3(i,111,1)*4.2,d=9+h3(i,111,2)*4.5,x=cx+d*Math.cos(a),z=cz+d*Math.sin(a),b=hAt(x,z);if(b<by-0.6||G.P[mu(x,z)]||Math.hypot(x-hx,z-hz)<7)continue;leafM(x,b+0.5,z,1.1+h3(i,111,3)*0.9,6);}
}};
}
