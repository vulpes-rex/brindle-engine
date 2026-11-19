// The scene generator: signed-distance scenes -> splats, lights and a walk map. One self-contained function, because it is
// handed to a Web Worker as text. Built-in scenes are picked by index (9 Brindlebrook, 10 Underhall). A game can also bring
// its own: SI is then { src, data }, where src is the text of a self-contained function (tools, data) => scene (see README).
export function genMain(SI,progress){
const RS=2,NU=160,HU=60,N=NU*RS,H=HU*RS,C=80,G0=16,NN=N*N;
const GS=(typeof self!=='undefined')?self:globalThis;
const D=GS.__D||(GS.__D=new Float32Array(N*N*H)),MT=GS.__M||(GS.__M=new Uint8Array(N*N*H)),HT=new Float32Array(NN),DRm=new Float32Array(NN),YB=new Float32Array(NN);
D.fill(4);MT.fill(0);
let PMAT=0,rs=12345,G={},S=null,LD=[-0.5,0.68,0.54];
const pk=(r,g,b)=>(r|0)|((g|0)<<8)|((b|0)<<16);
const mu=(x,z)=>Math.max(0,Math.min(NU-1,Math.floor(z)))*NU+Math.max(0,Math.min(NU-1,Math.floor(x)));
const rnd=()=>{rs=(Math.imul(rs,1664525)+1013904223)>>>0;return rs/4294967296;};
function h3(x,y,z){let n=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(z|0,1274126177)^974634777;n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967296;}
function n2(x,z){const xi=Math.floor(x),zi=Math.floor(z);let fx=x-xi,fz=z-zi;fx=fx*fx*(3-2*fx);fz=fz*fz*(3-2*fz);const a=h3(xi,91,zi),b=h3(xi+1,91,zi),c=h3(xi,91,zi+1),d=h3(xi+1,91,zi+1);return a+(b-a)*fx+(c-a)*fz+(a-b-c+d)*fx*fz;}
function n3(x,y,z){const xi=Math.floor(x),yi=Math.floor(y),zi=Math.floor(z);let fx=x-xi,fy=y-yi,fz=z-zi;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);fz=fz*fz*(3-2*fz);const l=(a,b,q)=>a+(b-a)*q;
return l(l(l(h3(xi,yi,zi),h3(xi+1,yi,zi),fx),l(h3(xi,yi+1,zi),h3(xi+1,yi+1,zi),fx),fy),l(l(h3(xi,yi,zi+1),h3(xi+1,yi,zi+1),fx),l(h3(xi,yi+1,zi+1),h3(xi+1,yi+1,zi+1),fx),fy),fz);}
function Dg(x,y,z){x=Math.floor(x*RS);y=Math.floor(y*RS);z=Math.floor(z*RS);return(x<0||z<0||y<0||x>=N||z>=N||y>=H)?4:D[(y*N+z)*N+x];}
function Mg(x,y,z){x=Math.floor(x*RS);y=Math.floor(y*RS);z=Math.floor(z*RS);return(x<0||z<0||y<0||x>=N||z>=N||y>=H)?0:MT[(y*N+z)*N+x];}
function mi(x,z){x=Math.floor(x*RS);z=Math.floor(z*RS);return Math.max(0,Math.min(N-1,z))*N+Math.max(0,Math.min(N-1,x));}
function prim(x0,x1,y0,y1,z0,z1,m,fn){x0=Math.max(0,Math.floor(x0*RS));y0=Math.max(0,Math.floor(y0*RS));z0=Math.max(0,Math.floor(z0*RS));x1=Math.min(N-1,Math.ceil(x1*RS));y1=Math.min(H-1,Math.ceil(y1*RS));z1=Math.min(N-1,Math.ceil(z1*RS));
for(let y=y0;y<=y1;y++)for(let z=z0;z<=z1;z++)for(let x=x0;x<=x1;x++){const i=(y*N+z)*N+x;PMAT=0;const d=fn((x+0.5)/RS,(y+0.5)/RS,(z+0.5)/RS);if(d<D[i]){D[i]=d;MT[i]=PMAT||m;}}}
const sm=(a,b,v)=>{v=(v-a)/(b-a);v=v<0?0:v>1?1:v;return v*v*(3-2*v);};
const hAt=(x,z)=>HT[mi(x,z)];
const seam=(u,b)=>b>2.6&&Math.abs((((u%4.3)+4.3)%4.3)-2.15)>1.88;
function sdBox(x,y,z,bx,by,bz){const qx=Math.abs(x)-bx,qy=Math.abs(y)-by,qz=Math.abs(z)-bz;return Math.hypot(Math.max(qx,0),Math.max(qy,0),Math.max(qz,0))+Math.min(Math.max(qx,qy,qz),0);}
function ball(cx,cy,cz,r,m){prim(cx-r-2,cx+r+2,cy-r-2,cy+r+2,cz-r-2,cz+r+2,m,(x,y,z)=>Math.hypot(x-cx,y-cy,z-cz)-r);}
function cap(ax,ay,az,bx,by,bz,r,m){const dx=bx-ax,dy=by-ay,dz=bz-az,ll=dx*dx+dy*dy+dz*dz||1;prim(Math.min(ax,bx)-r-2,Math.max(ax,bx)+r+2,Math.min(ay,by)-r-2,Math.max(ay,by)+r+2,Math.min(az,bz)-r-2,Math.max(az,bz)+r+2,m,(x,y,z)=>{let h=((x-ax)*dx+(y-ay)*dy+(z-az)*dz)/ll;h=h<0?0:h>1?1:h;return Math.hypot(x-ax-dx*h,y-ay-dy*h,z-az-dz*h)-r;});}
function abox(cx,cy,cz,bx,by,bz,m,rd,ra){const c=Math.cos(ra||0),s=Math.sin(ra||0),R=Math.hypot(bx,bz)+2,ar=m===70||m===71;rd=rd||0;prim(cx-R,cx+R,cy-by-2,cy+by+2,cz-R,cz+R,m,(x,y,z)=>{const u=(x-cx)*c+(z-cz)*s,v=(z-cz)*c-(x-cx)*s,w=y-cy;let d=sdBox(u,w,v,bx-rd,by-rd,bz-rd)-rd;if(ar&&d<0.6&&d>-0.8&&(seam(u,bx)||seam(w,by)||seam(v,bz))){PMAT=72;d+=0.3;}return d;});}
function ell(cx,cy,cz,rx,ry2,rz,m){const R=Math.max(rx,ry2,rz)+2;prim(cx-R,cx+R,cy-R,cy+R,cz-R,cz+R,m,(x,y,z)=>(Math.hypot((x-cx)/rx,(y-cy)/ry2,(z-cz)/rz)-1)*Math.min(rx,ry2,rz));}
function leafM(cx,cy,cz,r,m){prim(cx-r-3,cx+r+3,cy-r-3,cy+r+3,cz-r-3,cz+r+3,m,(x,y,z)=>(Math.hypot(x-cx,(y-cy)*1.25,z-cz)-r+3*(n3(x*0.3,y*0.3,z*0.3)-0.5)+0.9*(n3(x*0.9,y*0.9,z*0.9)-0.5))*0.65);}
function alimb(a,b,w,t,m,xr){let d=[b[0]-a[0],b[1]-a[1],b[2]-a[2]];const L=Math.hypot(d[0],d[1],d[2]),ar=m===70||m===71;d=[d[0]/L,d[1]/L,d[2]/L];const rf=Math.abs(d[1])>0.9?xr:[0,1,0];
let e1=[d[1]*rf[2]-d[2]*rf[1],d[2]*rf[0]-d[0]*rf[2],d[0]*rf[1]-d[1]*rf[0]];const l1=Math.hypot(e1[0],e1[1],e1[2]);e1=[e1[0]/l1,e1[1]/l1,e1[2]/l1];const e2=[d[1]*e1[2]-d[2]*e1[1],d[2]*e1[0]-d[0]*e1[2],d[0]*e1[1]-d[1]*e1[0]];
const cx=(a[0]+b[0])/2,cy=(a[1]+b[1])/2,cz=(a[2]+b[2])/2,R=L/2+Math.max(w,t)+2;prim(cx-R,cx+R,cy-R,cy+R,cz-R,cz+R,m,(x,y,z)=>{const p=x-cx,q=y-cy,r=z-cz,u=p*e1[0]+q*e1[1]+r*e1[2],v=p*d[0]+q*d[1]+r*d[2],s=p*e2[0]+q*e2[1]+r*e2[2];let dd=sdBox(u,v,s,w-0.25,L/2-0.25,t-0.25)-0.25;if(ar&&dd<0.6&&dd>-0.8&&(seam(v,L/2)||seam(u,w)||seam(s,t))){PMAT=72;dd+=0.3;}return dd;});}
function carve(cx,cy,cz,r){const x0=Math.max(0,Math.floor((cx-r-2)*RS)),x1=Math.min(N-1,Math.ceil((cx+r+2)*RS)),y0=Math.max(0,Math.floor((cy-r-2)*RS)),y1=Math.min(H-1,Math.ceil((cy+r+2)*RS)),z0=Math.max(0,Math.floor((cz-r-2)*RS)),z1=Math.min(N-1,Math.ceil((cz+r+2)*RS));
for(let y=y0;y<=y1;y++)for(let z=z0;z<=z1;z++)for(let x=x0;x<=x1;x++){const i=(y*N+z)*N+x,m0=MT[i];if(m0!==70&&m0!==71&&m0!==56&&m0!==72&&m0!==75)continue;const X=(x+0.5)/RS,Y=(y+0.5)/RS,Z=(z+0.5)/RS,s=Math.hypot(X-cx,Y-cy,Z-cz)-r+1.6*(n3(X*0.6,Y*0.6,Z*0.6)-0.5);if(-s>D[i]){D[i]=-s;MT[i]=75;}}}
function tree2(x,z,hh,cr,k){const by=hAt(x,z)-0.5,segs=Math.ceil(hh/3);let px=x,pz=z,py=by,dx=(h3(k,9,1)-0.5)*0.6,dz=(h3(k,9,2)-0.5)*0.6;
for(let j=0;j<5;j++){const ra=j*1.257+k;cap(x,by+3,z,x+2.2*Math.cos(ra),by+0.8,z+2.2*Math.sin(ra),0.8,5);cap(x+2.2*Math.cos(ra),by+0.8,z+2.2*Math.sin(ra),x+4.4*Math.cos(ra+0.3),by-0.2,z+4.4*Math.sin(ra+0.3),0.55,5);}
for(let i=0;i<segs;i++){const nx=px+dx*3,nz=pz+dz*3,ny=py+3;cap(px,py,pz,nx,ny,nz,1.7-0.9*i/segs,5);px=nx;py=ny;pz=nz;dx+=(h3(k,i,3)-0.5)*0.6;dz+=(h3(k,i,4)-0.5)*0.6;
if(i>=segs*0.4&&h3(k,i,5)>0.3){const ba=h3(k,i,6)*6.28,mx=px+2.8*Math.cos(ba),mz=pz+2.8*Math.sin(ba),ex=px+5.4*Math.cos(ba+0.3),ez=pz+5.4*Math.sin(ba+0.3);cap(px,py,pz,mx,py+2,mz,0.65,5);cap(mx,py+2,mz,ex,py+3.2,ez,0.45,5);leafM(ex,py+4,ez,cr*0.6,6);}}
leafM(px,py+1,pz,cr,6);leafM(px+cr*0.6,py-1,pz-cr*0.4,cr*0.7,6);leafM(px-cr*0.5,py+0.5,pz+cr*0.5,cr*0.62,6);}

const foot=(x,z)=>Math.max(Math.abs(x-C),Math.abs(z-C))-42+2.5*n2(x*0.13+3,z*0.13+8);
function cyl(cx,cz,y0,y1,r0,r1,m){const R=Math.max(r0,r1)+3;prim(cx-R,cx+R,y0-3,y1+3,cz-R,cz+R,m,(x,y,z)=>{const q=(y-y0)/(y1-y0),r=r0+(r1-r0)*(q<0?0:q>1?1:q);return Math.max(Math.hypot(x-cx,z-cz)-r,y0-y,y-y1)*0.9;});}
function box(cx,cy,cz,bx,by,bz,m,rd,ra){const c=Math.cos(ra||0),s=Math.sin(ra||0),R=Math.hypot(bx,bz)+3;prim(cx-R,cx+R,cy-by-3,cy+by+3,cz-R,cz+R,m,(x,y,z)=>{const u=(x-cx)*c+(z-cz)*s,v=(z-cz)*c-(x-cx)*s;return sdBox(u,y-cy,v,bx,by,bz)-(rd||0);});}
function gable(cx,yb,cz,hw,len,m){prim(cx-hw-3,cx+hw+3,yb-2,yb+hw+3,cz-len-3,cz+len+3,m,(x,y,z)=>Math.max((Math.abs(x-cx)+(y-yb))*0.707-hw*0.707,Math.abs(z-cz)-len,yb-y));}
function shroom(x,z,hh,R,m,k){let px=x,pz=z,py=hAt(x,z)-1;const la=h3(k,31,1)*6.28,ln=0.25+h3(k,31,2)*0.5;for(let i=0;i<4;i++){const nx=px+Math.cos(la)*ln*(i+1)*0.5,nz=pz+Math.sin(la)*ln*(i+1)*0.5,ny=py+hh/4;cap(px,py,pz,nx,ny,nz,Math.max(0.7,R*0.24-0.1*i),30);px=nx;py=ny;pz=nz;}
const cy=py-R*0.1;prim(px-R-3,px+R+3,cy-R,cy+R,pz-R-3,pz+R+3,m,(X,Y,Z)=>{const u=X-px,v=Y-cy,w=Z-pz,k1=Math.hypot(u/R,v/(R*0.62),w/R),k2=Math.hypot(u/(R*0.86),(v+0.4)/(R*0.44),w/(R*0.86));return Math.max((k1-1)*R*0.62,-0.12*R-v,-(k2-1)*R*0.44);});
cyl(px,pz,cy-0.1*R,cy+0.05*R,R*0.78,R*0.78,31);return[px,cy,pz];}
function palm(x,z,hh,k){let px=x,pz=z,py=hAt(x,z)-0.5;const la=h3(k,41,1)*6.28;for(let i=0;i<5;i++){const st=0.4+i*0.4,nx=px+Math.cos(la)*st,nz=pz+Math.sin(la)*st,ny=py+hh/5;cap(px,py,pz,nx,ny,nz,1.25-0.1*i,38);px=nx;py=ny;pz=nz;}
for(let f=0;f<8;f++){const fa=f*0.785+k,c=Math.cos(fa),s=Math.sin(fa);cap(px,py,pz,px+4.2*c,py+1.6,pz+4.2*s,0.8,27);cap(px+4.2*c,py+1.6,pz+4.2*s,px+8*c,py-2.2,pz+8*s,0.65,27);}
ball(px+0.9,py-0.9,pz+0.3,0.8,5);ball(px-0.6,py-1,pz-0.7,0.8,5);}
function steps(x0,z0,y0,x1,z1,y1,n,w,m){const ra=Math.atan2(z1-z0,x1-x0),L=Math.hypot(x1-x0,z1-z0)/n;for(let i=0;i<n;i++){const f=(i+0.5)/n;box(x0+(x1-x0)*f,y0+(y1-y0)*f-1.6,z0+(z1-z0)*f,L/2+0.3,1.85,w,m,0.05,ra);}}
function plank(x0,z0,x1,z1,y,w){const ra=Math.atan2(z1-z0,x1-x0),L=Math.hypot(x1-x0,z1-z0);box((x0+x1)/2,y,(z0+z1)/2,L/2+0.6,0.3,w,34,0,ra);for(const p of[[x0,z0],[x1,z1]]){const g=Math.min(hAt(p[0],p[1]),y)-2;cap(p[0],g,p[1],p[0],y+0.3,p[1],0.45,5);}}
function lamp(sc,x,z,hh,m,int,col){const b=hAt(x,z);cap(x,b-0.5,z,x,b+hh,z,0.35,5);ball(x,b+hh+0.8,z,0.8,m);sc.lights.push([x,b+hh+0.8,z,int,col[0],col[1],col[2]]);}
function tree(x,z,hh,cr,k,lm){const by=hAt(x,z)-0.5,segs=Math.ceil(hh/3);let px=x,pz=z,py=by,dx=(h3(k,9,1)-0.5)*0.6,dz=(h3(k,9,2)-0.5)*0.6;
for(let j=0;j<4;j++){const ra=j*1.57+k;cap(x,by+2.5,z,x+3.2*Math.cos(ra),by,z+3.2*Math.sin(ra),0.8,5);}
for(let i=0;i<segs;i++){const nx=px+dx*3,nz=pz+dz*3,ny=py+3;cap(px,py,pz,nx,ny,nz,1.6-0.8*i/segs,5);px=nx;py=ny;pz=nz;dx+=(h3(k,i,3)-0.5)*0.6;dz+=(h3(k,i,4)-0.5)*0.6;
if(i>=segs*0.4&&h3(k,i,5)>0.3){const ba=h3(k,i,6)*6.28,ex=px+5*Math.cos(ba),ez=pz+5*Math.sin(ba),ey=py+3;cap(px,py,pz,ex,ey,ez,0.7,5);if(cr)leafM(ex,ey+1,ez,cr*0.6,lm);}}
if(cr){leafM(px,py+1,pz,cr,lm);leafM(px+cr*0.6,py-1,pz-cr*0.4,cr*0.7,lm);}}
function camel(x,z,ra){const b=hAt(x,z),c=Math.cos(ra),s=Math.sin(ra),P=(u,v)=>[x+u*c-v*s,z+u*s+v*c];let p=P(-1.7,0),q=P(1.7,0);cap(p[0],b+3.7,p[1],q[0],b+3.7,q[1],1.3,43);ell(x,b+5.1,z,1.2,0.9,1.1,43);box(x,b+5.2,z,0.9,0.5,1.25,23,0.2,ra);
p=P(2.5,0);q=P(3.7,0);cap(p[0],b+4.2,p[1],q[0],b+6.5,q[1],0.55,43);p=P(4.4,0);ball(p[0],b+6.7,p[1],0.75,43);for(const u of[-1.6,1.6])for(const v of[-0.7,0.7]){p=P(u,v);cap(p[0],b-0.3,p[1],p[0],b+3,p[1],0.42,43);}}
function hull(bx,bY,bz,ra,m){const c=Math.cos(ra),s=Math.sin(ra);prim(bx-8,bx+8,bY-4,bY+4,bz-8,bz+8,m,(x,y,z)=>{const u=(x-bx)*c+(z-bz)*s,w=(z-bz)*c-(x-bx)*s,v=y-bY;return Math.max((Math.hypot(u/5.2,v/1.9,w/2.2)-1)*1.9,-(Math.hypot(u/4.6,(v-0.5)/1.9,w/1.7)-1)*1.7,v-0.9);});}
const SCENES=[
{name:'Lighthouse rock',cap:'A sea stack with a striped lighthouse and sweeping beam, a keeper’s hut, stairs down to a jetty, boats, a buoy and gulls.',bg:[10,14,28],LD:[-0.5,0.62,0.6],amb:[0.42,0.5,0.7],sun:[1.1,0.86,0.66],level:G0,pv:[3,0.2,1.5],pcol:[230,240,244],pn:30,foot,
h:(x,z)=>{const r=Math.hypot(x-(C-4),z-(C-2)),m=Math.max(0,24*(1-(r/27)**2))*(0.7+0.6*n2(x*0.11,z*0.11));const h=G0-7+2*n2(x*0.1+5,z*0.1)+Math.min(m,15+0.6*n2(x*0.3,z*0.3));return h>G0+0.5?Math.floor(h/2)*2+0.8*n2(x*0.4,z*0.4):h;},
bot:(x,z)=>G0-12-2*n2(x*0.2,z*0.2),
top:(sx,sy,sz,j,hv,ny)=>sy<G0+1.4?35:(sy>G0+7&&ny>0.8)?1:3,side:(sx,sy)=>sy<G0+1.4?35:3,
fix:(mm,sx,sy,sz,nx,ny,nz,hv,j)=>{if(mm===7&&ny>0.5&&HT[j]>G0-2.4&&hv<0.7)return 33;if(mm===35&&n3(sx*0.3,sy*0.3,sz*0.3)>0.6)return 42;if(mm===3&&ny>0.6&&n3(sx*0.25,sy*0.25,sz*0.25)>0.62)return 18;return mm;},
scatter:(mm,sx,sy,sz,hv,a)=>{if(mm===1){if(hv<0.3)a(sx,sy+0.8+hv*3,sz,15);if(hv>0.97)a(sx,sy+1.8,sz,8);}},
build(){const cx=C-4,cz=C-2,by=hAt(cx,cz);G.lby=by;this.lights=[[cx,by+33,cz,2.4,1,0.85,0.5]];this.beam=[cx-C,cz-C];this.waves=[cx-C,cz-C];this.birds=[cx-C,by+36-G0,cz-C,5];
cyl(cx,cz,by-2,by+1,6.3,5.8,4);cyl(cx,cz,by+1,by+30,5,3.3,39);cyl(cx,cz,by+29.2,by+30,5.6,5.6,4);cyl(cx,cz,by+30,by+31,5.2,5.2,24);cyl(cx,cz,by+31,by+35,2.4,2.4,10);cyl(cx,cz,by+35,by+36,3.5,3.5,24);cyl(cx,cz,by+36,by+40,3.5,0.2,23);
cap(cx,by+40,cz,cx,by+43.5,cz,0.25,24);box(cx+1.5,by+42.4,cz,1.3,0.6,0.2,23);
for(let k=0;k<12;k++){const a=k*0.5236;cap(cx+4.8*Math.cos(a),by+31,cz+4.8*Math.sin(a),cx+4.8*Math.cos(a),by+33,cz+4.8*Math.sin(a),0.28,24);}
prim(cx-8,cx+8,by+31,by+35,cz-8,cz+8,24,(x,y,z)=>Math.max(Math.abs(Math.hypot(x-cx,z-cz)-4.8)-0.25,Math.abs(y-by-33)-0.25));
box(cx+3.3,by+3.4,cz+3.3,1.2,2.2,1.2,36,0.2,0.785);box(cx+4.6,by+0.6,cz+4.6,1.8,0.6,1.8,4,0.1,0.785);
box(cx+2.9,by+14,cz+2.9,0.8,1.2,0.8,36,0.1,0.785);box(cx-2.5,by+22,cz+2.5,0.7,1.1,0.7,36,0.1,-0.785);box(cx-3.2,by+8,cz+3.2,0.8,1.2,0.8,36,0.1,-0.785);box(cx+2.6,by+23,cz-2.6,0.7,1.1,0.7,36,0.1,-0.785);box(cx-3,by+12,cz-3,0.8,1.2,0.8,36,0.1,0.785);
const hx=cx+12,hz=cz+5,hb=hAt(hx,hz);box(hx,hb-1.5,hz,4.8,2.6,4,4,0.2);box(hx,hb+3,hz,4,2.4,3.2,22,0.1);gable(hx,hb+5.3,hz,4.9,3.9,25);box(hx+2,hb+8.6,hz-1.5,0.7,1.7,0.7,4);
box(hx-1.2,hb+2.7,hz+3.2,0.9,1.6,0.35,36);box(hx+2.2,hb+3.5,hz+3.25,0.8,0.8,0.3,11);box(hx+4.05,hb+3.5,hz,0.3,0.8,0.8,11);this.lights.push([hx+2.2,hb+3.5,hz+5.5,0.9,1,0.7,0.35]);
this.emit=[[hx+2-C,hb+10.5-G0,hz-1.5-C,7,pk(150,150,165),pk(96,98,120)]];
for(let k=0;k<5;k++){box(hx-6.5+k*0.2,hb+0.6+k*0.5,hz-2.5,0.45,0.45,1.6,5,0.1);}
for(let k=3;k<14;k++){if(k===8||k===9)continue;const a=k*0.449,x=cx+13*Math.cos(a),z=cz+11.5*Math.sin(a),b=hAt(x,z);if(b<by-1.2)continue;box(x,b+0.9,z,1.6,1.1,0.6,4,0.15,a+1.57);}
steps(C+17,C+13,G0+1.7,cx+8,cz+10,by+0.3,7,1.7,4);
box(C+28,G0+1.7,C+13,11,0.4,2,34);for(let i=0;i<4;i++)for(const s of[-1.9,1.9]){const x=C+20+i*6.2,z=C+13+s;cap(x,G0-6,z,x,G0+2.8,z,0.5,5);}
box(C+33,G0+3.1,C+12.2,1,1,1,34,0.1,0.3);box(C+35.4,G0+2.9,C+13.8,0.8,0.8,0.8,34,0.1,0.8);cyl(C+30,C+14,G0+2.1,G0+4.3,0.95,0.95,5);cyl(C+24.5,C+12,G0+2.1,G0+4,0.85,0.85,5);
cap(C+38.6,G0-2,C+11,C+38.6,G0+5.4,C+11,0.5,5);ball(C+38.6,G0+6.3,C+11,0.8,10);this.lights.push([C+38.6,G0+6.3,C+11,1.1,1,0.8,0.45]);
hull(C+31,G0+0.4,C+19,0,34);box(C+31,G0+0.9,C+19,0.5,0.25,1.7,5);hull(C+12,G0+0.4,C+30,0.9,23);
const ux=C+2,uz=C+37;cyl(ux,uz,G0-0.6,G0+1.5,1.8,1.3,23);cap(ux,G0+1.5,uz,ux,G0+4.2,uz,0.3,24);ball(ux,G0+4.7,uz,0.55,11);this.lights.push([ux,G0+4.7,uz,0.5,1,0.6,0.3]);
box(cx-12,G0+5,cz-8,2.6,8,2.3,3,1.2,0.4);box(cx-9,G0+4,cz+14,2,6,2,3,1,1.1);box(cx+10,G0+3,cz-13,2.2,6,2,3,1.1,2);
const st=[[C-30,C+24,3.5,7],[C-34,C-20,2.8,11],[C+24,C-30,3.2,6],[C-14,C+35,2.4,4],[C+36,C-12,2,5],[C-31,C-25,1.8,6],[C+29,C-34,1.6,3]];for(let k=0;k<st.length;k++){const q=st[k];box(q[0],G0-3+q[3]/2,q[1],q[2],q[3]/2+3,q[2]*0.8,3,1.3,k*0.7);}
}},
{name:'Desert oasis',cap:'Stepped mesas with carved stairs, a colonnade and a cliff doorway, a rock arch, a palm-ringed pool, a camp with camels and a well.',bg:[20,14,22],LD:[-0.55,0.66,0.5],amb:[0.5,0.48,0.6],sun:[1.25,1.05,0.76],level:G0-1.6,pv:[2.5,0.1,1],pcol:[240,214,160],pn:30,foot,
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
}},
{name:'Mushroom hollow',cap:'A night swamp of giant glowing mushrooms, with a hut on stilts, a lantern-lit boardwalk, mossy trees, a punt and drifting spores.',bg:[8,10,22],LD:[0.4,0.75,0.45],amb:[0.24,0.32,0.5],sun:[0.36,0.46,0.7],level:G0-1,pv:[0.3,1.2,0.2],pcol:[110,240,220],pn:50,foot,
h:(x,z)=>G0-4.3+6.5*n2(x*0.07+4,z*0.07+1)+2.5*Math.exp(-((x-(C-8))**2+(z-(C-4))**2)/200),
bot:(x,z)=>G0-12-3*n2(x*0.2,z*0.2),
top:(sx,sy)=>sy<G0-0.3?32:41,side:(sx,sy,sz,j)=>sy>HT[j]-3?2:3,
fix:(mm,sx,sy,sz,nx,ny,nz,hv)=>{if(mm===7&&ny>0.5){if(hv<0.012)return 31;if(hv<0.07)return 16;}if(mm===37&&n3(sx*0.45,sy*0.45,sz*0.45)>0.66)return 31;if((mm===3||mm===5)&&ny>0.5&&n3(sx*0.25,sy*0.25,sz*0.25)>0.5)return 18;return mm;},
scatter:(mm,sx,sy,sz,hv,a,ny)=>{if(mm===41){if(hv<0.14)a(sx,sy+0.8+hv*3,sz,15);if(hv>0.994){a(sx,sy+0.8,sz,30);a(sx,sy+1.6,sz,31);}}else if(mm===32&&hv<0.12)for(let q=1;q<5;q++)a(sx,sy+q*0.8,sz,14);else if(mm===48&&ny<-0.4&&hv<0.12){const n=2+Math.floor(hv*50);for(let q=1;q<=n;q++)a(sx,sy-q*0.8,sz,18);}},
build(){this.lights=[];const big=[[C-8,C-4,26,10,29],[C+20,C+20,16,7,37],[C-26,C+20,12,6,37],[C+4,C-28,18,7.5,29],[C-28,C-22,10,5,37],[C+32,C-2,9,4.5,29],[C-34,C-2,15,3.2,37],[C+30,C+34,13,3,37],[C-12,C+34,11,3.4,29]];
big.forEach((q,k)=>{const p=shroom(q[0],q[1],q[2],q[3],q[4],k+1);this.lights.push([p[0],p[1]-2,p[2],q[4]===37?1.5:1.0,0.3,0.95,0.85]);if(q[3]>5){const b=hAt(q[0],q[1]);for(let r=0;r<5;r++){const a=r*1.257+k;cap(q[0],b+2,q[1],q[0]+(q[3]*0.45)*Math.cos(a),b-0.8,q[1]+(q[3]*0.45)*Math.sin(a),0.7,30);}}});
const mx=C-8,mz=C-4,mB=hAt(mx,mz);for(let k=0;k<6;k++){const a=k*1.05+0.4;ell(mx+3*Math.cos(a),mB+4+k*3,mz+3*Math.sin(a),2.3,0.5,2.3,47);}
box(mx+0.8,mB+2,mz+2.2,1,1.8,0.6,5,0.2,0.3);ball(mx+2,mB+7.5,mz+1.6,0.8,11);ball(mx-1.6,mB+11,mz+1.9,0.7,11);this.lights.push([mx+2.5,mB+7.5,mz+3.5,0.9,1,0.7,0.35]);
for(let i=0;i<18;i++){const x=C-36+h3(i,51,1)*72,z=C-36+h3(i,51,2)*72,hh=hAt(x,z);if(hh<G0-0.5)continue;const sh=2+h3(i,51,3)*2.5,R=1.5+h3(i,51,4);cap(x,hh-0.5,z,x,hh+sh,z,0.5,30);ell(x,hh+sh+0.3,z,R,R*0.55,R,i%2?29:37);if(i%3===0){cap(x+1.6,hh-0.5,z+0.8,x+1.8,hh+sh*0.6,z+0.9,0.4,30);ell(x+1.8,hh+sh*0.6+0.3,z+0.9,R*0.7,R*0.4,R*0.7,i%2?37:29);}}
const hx=C+14,hz=C-14,pb=G0+8;box(hx,pb,hz,5.2,0.4,4.6,34);for(const a of[-4.3,4.3])for(const b of[-3.8,3.8])cap(hx+a,hAt(hx+a,hz+b)-1,hz+b,hx+a,pb,hz+b,0.5,5);
box(hx,pb+3,hz,3.4,2.6,3,5,0.1);cyl(hx,hz,pb+5.4,pb+10.5,5.6,0.3,18);box(hx+1.4,pb+3.2,hz+3.05,0.8,0.8,0.3,11);box(hx-1.4,pb+2.3,hz+3.05,0.8,1.6,0.3,36);box(hx+3.45,pb+3.2,hz,0.3,0.8,0.8,11);this.lights.push([hx+1.4,pb+3.2,hz+5.5,1,1,0.7,0.35]);
box(hx-2,pb+8.8,hz-1.5,0.6,1.8,0.6,4);this.emit=[[hx-2-C,pb+11-G0,hz-1.5-C,6,pk(90,104,130),pk(54,64,92)]];
for(const a of[-4.4,4.4])cap(hx+a,pb,hz+4.4,hx+a,pb+2.2,hz+4.4,0.25,5);cap(hx-4.4,pb+2.2,hz+4.4,hx+4.4,pb+2.2,hz+4.4,0.22,5);
cap(hx-5.2,hAt(hx-6,hz+3.6)-0.5,hz+3.2,hx-4.6,pb,hz+3.2,0.3,5);cap(hx-5.2,hAt(hx-6,hz+3.6)-0.5,hz+4.6,hx-4.6,pb,hz+4.6,0.3,5);
cap(hx+5.6,pb+4.4,hz+3.4,hx+5.6,pb+2.6,hz+3.4,0.2,5);ball(hx+5.6,pb+2,hz+3.4,0.8,10);this.lights.push([hx+5.6,pb+2,hz+3.4,0.9,1,0.8,0.45]);
const bw=[[C+7,C-9],[C+1,C+2],[C+3,C+14],[C+13,C+25],[C+26,C+30]],by2=G0+1.3;for(let k=0;k<bw.length-1;k++)plank(bw[k][0],bw[k][1],bw[k+1][0],bw[k+1][1],by2,1.5);
for(const k of[1,3]){const p=bw[k];cap(p[0]+1.4,by2,p[1]-1.4,p[0]+1.4,by2+5,p[1]-1.4,0.3,5);ball(p[0]+1.4,by2+5.8,p[1]-1.4,0.75,10);this.lights.push([p[0]+1.4,by2+5.8,p[1]-1.4,1,1,0.8,0.45]);}
cap(C-4,G0-0.6,C+24,C+14,G0-0.2,C+32,1.5,5);
tree(C-34,C+34,17,5,11,48);tree(C+34,C-30,15,4.5,12,48);tree(C-18,C-36,14,4.5,13,48);tree(C+36,C+12,12,0,14,48);
let lx=C,lz=C,lv=1e9;for(let z=C-30;z<=C+30;z+=2)for(let x=C-30;x<=C+30;x+=2){const d=Math.min(...big.map(q=>Math.hypot(q[0]-x,q[1]-z))),v=hAt(x,z)+(d<12?9:0)+(Math.hypot(x-hx,z-hz)<12?9:0);if(v<lv){lv=v;lx=x;lz=z;}}
hull(lx,G0-0.6,lz,0.6,34);cap(lx-2,G0-0.2,lz-1.5,lx+5,G0+5,lz+3,0.22,5);
for(let f=0;f<=1;f+=0.09){const x=C-30+60*f,z=C+6+10*Math.sin(f*5);if(hAt(x,z)<G0-1.6)cyl(x,z,G0-2.5,G0-0.4,1.4,1.15,3);}
for(let i=0;i<4;i++){const x=C-30+h3(i,81,1)*60,z=C-30+h3(i,81,2)*60,b=hAt(x,z);if(b<G0-0.5)continue;cyl(x,z,b-0.5,b+2.4,1.7,1.4,5);cyl(x,z,b+2.4,b+2.7,1.4,1.4,34);ball(x+1.2,b+3,z,0.45,31);}
for(let i=0;i<7;i++){const x=C-34+h3(i,61,1)*68,z=C-34+h3(i,61,2)*68;box(x,hAt(x,z)+0.6,z,1.4+h3(i,61,3)*1.5,1+h3(i,61,4),1.2+h3(i,61,5),3,0.9,i);}
}}];
function gear(cx,cy,cz,R,th,teeth,ax,m){prim(cx-R-3,cx+R+3,cy-R-3,cy+R+3,cz-R-3,cz+R+3,m,(x,y,z)=>{let a,b,w;if(ax===1){a=x-cx;b=z-cz;w=y-cy;}else if(ax===2){a=x-cx;b=y-cy;w=z-cz;}else{a=z-cz;b=y-cy;w=x-cx;}
const r=Math.hypot(a,b),an=Math.atan2(b,a),rr=R+(Math.sin(an*teeth)>0?0.8:-0.2),sp=6.2832/5,am=((an%sp)+sp)%sp-sp/2,ds=Math.abs(r*Math.sin(am))-0.7;
return Math.max(Math.min(Math.max(r-rr,(R-2.4)-r),r-1.8,Math.max(ds,r-R+1)),Math.abs(w)-th)*0.8;});}
function pine(x,z,hh,k){const b=hAt(x,z)-0.5;cap(x,b,z,x,b+hh*0.45,z,0.8,5);for(let i=0;i<4;i++){const y0=b+hh*(0.22+i*0.19),r=hh*0.3*(1-i*0.2);cyl(x,z,y0,y0+hh*0.3,r,0.2,52);}}
function pyr(cx,yb,cz,R,sl,m){prim(cx-R-3,cx+R+3,yb-2,yb+R/sl+3,cz-R-3,cz+R+3,m,(x,y,z)=>Math.max((Math.max(Math.abs(x-cx),Math.abs(z-cz))+(y-yb)*sl-R)*0.6,yb-y));}
function slan(sc,x,z){const b=hAt(x,z);cyl(x,z,b-0.5,b+2.4,0.6,0.5,4);box(x,b+3.1,z,0.9,0.7,0.9,11,0.05);pyr(x,b+3.8,z,1.5,1.2,4);sc.lights.push([x,b+3.1,z,0.9,1,0.7,0.35]);}
SCENES.push(
{name:'Shipwreck cove',cap:'A broken hull with exposed ribs and a torn sail in a rocky cove, with a treasure chest, a cave, palms and a beached rowboat.',bg:[10,16,26],LD:[-0.5,0.66,0.55],amb:[0.46,0.52,0.66],sun:[1.2,1.0,0.75],level:G0,pv:[2,0.2,1],pcol:[230,240,244],pn:24,foot,
h:(x,z)=>{const r=Math.hypot(x-(C+10),z-(C+10)),back=((C-x)+(C-z))/2;let h=G0-6+9.5*sm(14,30,r)*sm(-10,12,back)+1.5*n2(x*0.1,z*0.1)+4*Math.exp(-((x-(C+7))**2+(z-(C+9))**2)/120);h+=Math.floor(sm(12,26,back+7*n2(x*0.08,z*0.08)-4)*3.3)*6;return h;},
bot:(x,z)=>G0-13-2*n2(x*0.2,z*0.2),
top:(sx,sy)=>sy<G0+0.7?58:sy>G0+6.5?1:20,side:()=>3,
fix:(mm,sx,sy,sz,nx,ny,nz,hv,j)=>{if(mm===7&&ny>0.5&&HT[j]>G0-1.6&&hv<0.6)return 33;if(mm===59&&sy<G0+2.5&&n3(sx*0.35,sy*0.35,sz*0.35)>0.6)return 42;if(mm===3&&ny>0.6&&n3(sx*0.25,sy*0.25,sz*0.25)>0.6)return 18;return mm;},
scatter:(mm,sx,sy,sz,hv,a)=>{if(mm===1){if(hv<0.35)a(sx,sy+0.8+hv*3,sz,15);if(hv>0.96)a(sx,sy+1.8,sz,8);}else if(mm===58&&hv>0.99)a(sx,sy+0.5,sz,62);},
build(){this.lights=[];const wx=C+8,wz=C+10,wy=G0+4.6,c=Math.cos(0.75),s=Math.sin(0.75),cr=Math.cos(0.3),sr=Math.sin(0.3);
const SC=1.5,L=(fn,m)=>prim(wx-26,wx+26,wy-12,wy+22,wz-26,wz+26,m,(x,y,z)=>{const dx=x-wx,dy=y-wy,dz=z-wz,u=dx*c+dz*s,w0=dz*c-dx*s;return fn(u/SC,(dy*cr+w0*sr)/SC,(w0*cr-dy*sr)/SC,x,y,z)*SC;});
const W2=(u,v,w)=>{u*=SC;v*=SC;w*=SC;const dy=v*cr-w*sr,w0=v*sr+w*cr;return[wx+u*c-w0*s,wy+dy,wz+u*s+w0*c];};
L((u,v,w,x,y,z)=>{let d=Math.max((Math.hypot(u/13,v/5,w/4.2)-1)*4.2,-(Math.hypot(u/12.3,(v-0.8)/5,w/3.6)-1)*3.6,v-2.2);d=Math.max(d,-(Math.abs(u-1.5)-1.4-2*(n3(x*0.4,y*0.4,z*0.4)-0.5)));if(u>3&&v>-1.4){const f=u/2.4-Math.floor(u/2.4);if(f>0.3)d=Math.max(d,0.5);}return d;},59);
L((u,v,w)=>Math.max(Math.abs(v-1.2)-0.3,(Math.hypot(u/12.3,w/3.6)-1)*3,u+0.3),34);
L((u,v,w)=>sdBox(u+8.2,v-3.5,w,2.8,1.5,2.9)-0.1,59);L((u,v,w)=>sdBox(u+8.2,v-5.2,w,3.2,0.3,3.2),34);
L((u,v,w)=>Math.min(sdBox(u+5.35,v-3.6,w-1.3,0.2,0.6,0.6),sdBox(u+5.35,v-3.6,w+1.3,0.2,0.6,0.6)),11);
let p=W2(-3,1.2,0),q=W2(-3.6,17,0);cap(p[0],p[1],p[2],q[0],q[1],q[2],0.9,5);let a=W2(-3.5,13,-5),b=W2(-3.5,13,5);cap(a[0],a[1],a[2],b[0],b[1],b[2],0.4,5);
L((u,v,w,x,y,z)=>Math.max(sdBox(u+3.9,v-9.3,w,0.25,3.4,4.4),(n3(x*0.33,y*0.33,z*0.33)-0.6)*4),57);
const lp=W2(-5.2,3.6,0);this.lights.push([lp[0],lp[1],lp[2],1.1,1,0.7,0.35]);this.birds=[q[0]-C,q[1]+3-G0,q[2]-C,4];this.waves=[wx-C,wz-C];
cap(C-8,hAt(C-8,C-16)+0.6,C-16,C+8,hAt(C+8,C-24)+0.8,C-24,0.6,5);
palm(C-19,C+9,13,1);palm(C+9,C-19,15,2);palm(C-7,C-9,11,3);
const kx=C-17,kz=C-3,kb=hAt(kx,kz);box(kx,kb+0.9,kz,1.7,1.1,1.1,34,0.1,0.5);box(kx-0.5,kb+2.3,kz-0.6,1.7,0.3,1.1,5,0.1,0.5);ball(kx,kb+2,kz,0.7,54);ball(kx+0.8,kb+2,kz+0.3,0.6,54);ball(kx+2.2,kb+0.4,kz+1.2,0.6,54);ball(kx+0.2,kb+2.5,kz,0.45,10);this.lights.push([kx,kb+3,kz,0.9,1,0.85,0.4]);
lamp(this,kx-4,kz+3,5,10,1.1,[1,0.8,0.45]);
cyl(C-12,C+3,hAt(C-12,C+3)-0.4,hAt(C-12,C+3)+2.2,1,1,5);box(C-9,hAt(C-9,C+6)+0.5,C+6,1.2,1,1.2,34,0.1,0.9);cyl(C-3,C-13,hAt(C-3,C-13)-0.2,hAt(C-3,C-13)+2,0.95,0.95,5);
hull(C+2,hAt(C+2,C-15)+0.8,C-15,2.3,34);
const ax=C-13,az=C+10,ab=hAt(ax,az);cap(ax,ab,az,ax+0.8,ab+4.5,az,0.35,56);cap(ax-1.6,ab+0.6,az,ax+1.8,ab+0.2,az,0.35,56);cap(ax-0.6,ab+4,az,ax+2,ab+4.3,az,0.3,56);
const cvx=C-23,cvz=C-16,cvb=hAt(C-19,C-12);ell(cvx+2,cvb+3,cvz+2,3.4,3.6,3.4,36);ball(cvx+3.2,cvb+3,cvz+3.2,0.6,11);this.lights.push([cvx+4.5,cvb+3,cvz+4.5,1,1,0.6,0.3]);
const rk=[[C+26,C+30,2.6,5],[C+34,C+16,2,4],[C+20,C+36,1.8,3],[C+36,C+34,2.4,6],[C+30,C-2,1.6,3]];rk.forEach((r2,k)=>box(r2[0],G0-3+r2[3]/2,r2[1],r2[2],r2[3]/2+3,r2[2]*0.8,3,1.2,k));
}},
{name:'Clockwork observatory',cap:'A copper-domed observatory with a telescope, turning brass gears, a spinning orrery, a clock tower and steam.',bg:[14,10,26],LD:[-0.45,0.68,0.58],amb:[0.4,0.42,0.62],sun:[1.05,0.86,0.7],level:null,pv:[0.2,0.6,0.1],pcol:[255,220,150],pn:30,foot,
h:(x,z)=>{const r=Math.hypot(x-(C-4),z-(C-4));let h=G0+2*n2(x*0.07,z*0.07);if(r<25)h=Math.max(h,G0+3.5);if(r<15)h=G0+6.5;if(Math.hypot(x-(C+25),z-(C+21))<8)h=Math.max(h,G0+3);return h;},
bot:(x,z)=>G0-9-12*Math.max(0,1-(Math.hypot(x-C,z-C)/50)**2)-4*n2(x*0.15,z*0.15),
top:(sx,sy,sz,j,hv)=>sy>G0+2.8?4:1,side:(sx,sy,sz,j)=>sy>G0+2?4:sy>HT[j]-3?2:3,
fix:(mm,sx,sy,sz)=>{if(mm===55){const a=Math.atan2(sz-(C-4),sx-(C-4))*8/6.2832;if(a-Math.floor(a)<0.1)return 54;}if(mm===22){const y=sy-(G0+6.5);if((y>0.4&&y<1.3)||(y>8.6&&y<9.6))return 54;}return mm;},
scatter:(mm,sx,sy,sz,hv,a)=>{if(mm===1){if(hv<0.3)a(sx,sy+0.8+hv*3,sz,15);if(hv>0.97)a(sx,sy+1.8,sz,8);}},
build(){this.lights=[];const cx=C-4,cz=C-4,by=G0+6.5;
cyl(cx,cz,by-1,by+10,9,9,22);prim(cx-13,cx+13,by+8,by+23,cz-13,cz+13,55,(x,y,z)=>{const u=x-cx,v=y-by-10,w=z-cz,rr=Math.hypot(u,v,w),sl=(u*0.707+w*0.707);return Math.max(rr-9.6,-(rr-8.8),-v,-Math.max(Math.abs(u*0.707-w*0.707)-1.5,-sl-1));});
cyl(cx,cz,by+9.6,by+10.6,10.1,10.1,54);
const ta=[cx+2,by+12,cz+2],tb2=[cx+11,by+20,cz+11];cap(ta[0],ta[1],ta[2],tb2[0],tb2[1],tb2[2],1.5,54);cap(tb2[0],tb2[1],tb2[2],tb2[0]+0.9,tb2[1]+0.8,tb2[2]+0.9,1.9,56);ball(tb2[0]+1.5,tb2[1]+1.35,tb2[2]+1.5,1.3,61);cyl(cx+1,cz+1,by+10,by+13,2.2,1.6,56);
box(cx+6.2,by+2.5,cz+6.2,1.3,2.5,1.3,36,0.3,0.785);box(cx+7.4,by+0.4,cz+7.4,2,0.5,2,4,0.1,0.785);
for(const a of[-0.4,2.0,3.5,5.1]){ball(cx+8.8*Math.cos(a),by+5.5,cz+8.8*Math.sin(a),1,11);this.lights.push([cx+11*Math.cos(a),by+5.5,cz+11*Math.sin(a),0.7,1,0.7,0.35]);}
steps(C+16.5,C+16.5,G0+1,C+12,C+12,G0+3.7,3,2.2,4);steps(C+8.6,C+8.6,G0+4,C+5.6,C+5.6,G0+6.7,3,2,4);
cap(cx-9,by+1,cz+2,cx-13,by+1,cz+2,0.6,54);cap(cx-13,by+1,cz+2,cx-13,G0+3,cz+2,0.6,54);ball(cx-13,by+1,cz+2,0.9,54);cap(cx-13,G0+4,cz+2,cx-13,G0+4,cz+12,0.6,54);ball(cx-13,G0+4,cz+12,0.9,56);
cyl(cx-6,cz-11,by-1,by+15,1.2,1,56);cyl(cx-6,cz-11,by+15,by+16,1.5,1.5,54);this.emit=[[cx-6-C,by+17-G0,cz-11-C,8,pk(210,214,230),pk(130,134,160)]];
const kx=C-30,kz=C+22,kb=hAt(kx,kz);box(kx,kb+8,kz,2.6,9,2.6,22,0.1);box(kx,kb-0.2,kz,3.1,1,3.1,4,0.1);pyr(kx,kb+17,kz,3.6,0.9,24);ball(kx,kb+21.2,kz,0.5,54);ell(kx+2.7,kb+13,kz,0.35,1.7,1.7,11);ell(kx,kb+13,kz+2.7,1.7,1.7,0.35,11);box(kx,kb+2,kz+2.6,0.9,1.8,0.3,36);this.lights.push([kx+4.5,kb+13,kz+4.5,1,1,0.75,0.4]);
lamp(this,C+19,C+12,6,10,1,[1,0.8,0.45]);lamp(this,C+10,C+21,6,10,1,[1,0.8,0.45]);lamp(this,C-22,C-28,6,10,1,[1,0.8,0.45]);lamp(this,C+32,C-20,6,10,1,[1,0.8,0.45]);
tree(C+30,C-30,15,6,21,63);tree(C-34,C-8,13,5,22,63);tree(C-10,C+36,12,5,23,63);tree(C+36,C+2,10,4.5,24,6);
for(let i=0;i<8;i++){const x=C-38+h3(i,91,1)*76,z=C-38+h3(i,91,2)*76;if(Math.hypot(x-cx,z-cz)<27)continue;box(x,hAt(x,z)+0.5,z,1+h3(i,91,3)*1.2,0.8,0.9+h3(i,91,4),3,0.8,i);}
const gy=G0+6.5+4.2,ox=C+25,oz=C+21,oy=G0+3;this.lights.push([ox,oy+8,oz,1.4,1,0.85,0.5]);
G.dyn=[{cx:cx,cy:gy,cz:cz+11.5,ax:2,sp:0.5,fn:()=>gear(cx,gy,cz+11.5,7,0.7,14,2,54)},
{cx:cx+11.2,cy:gy-1.4,cz:cz+11.5,ax:2,sp:-0.875,fn:()=>gear(cx+11.2,gy-1.4,cz+11.5,4,0.7,8,2,56)},
{cx:cx-11.5,cy:gy+1,cz:cz-3,ax:3,sp:-0.6,fn:()=>gear(cx-11.5,gy+1,cz-3,5.5,0.7,11,3,54)},
{cx:ox,cy:oy,cz:oz,ax:1,sp:0.45,fn:()=>{gear(ox,oy+0.8,oz,6.2,0.5,12,1,54);cap(ox,oy+0.8,oz,ox,oy+8,oz,0.5,56);ball(ox,oy+8.8,oz,1.5,10);cap(ox,oy+5,oz,ox+5.5,oy+5,oz,0.3,54);ball(ox+5.5,oy+5,oz,1,23);cap(ox,oy+6.5,oz,ox-3.5,oy+6.5,oz+2.5,0.3,54);ball(ox-3.5,oy+6.5,oz+2.5,0.75,55);cap(ox,oy+3.5,oz,ox-2,oy+3.5,oz-6.5,0.3,54);ball(ox-2,oy+3.5,oz-6.5,1.2,61);}}];
}},
{name:'Frozen shrine',cap:'A two-tiered shrine above a frozen lake, with a red gate, stone lanterns, snowy pines, an icefall and falling snow.',bg:[8,12,24],LD:[0.45,0.7,0.5],amb:[0.38,0.46,0.66],sun:[0.82,0.88,1.02],level:G0-1,pv:[0.8,-3.5,0.4],pcol:[240,244,250],pn:80,foot,
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
}});

function ring(cx,cy,cz,R,th,m){prim(cx-R-2,cx+R+2,cy-th-2,cy+th+2,cz-R-2,cz+R+2,m,(x,y,z)=>Math.hypot(Math.hypot(x-cx,z-cz)-R,y-cy)-th);}
function hull2(bx,bY,bz,ra,sc,m){const c=Math.cos(ra),s=Math.sin(ra),R=8*sc;prim(bx-R,bx+R,bY-4*sc,bY+4*sc,bz-R,bz+R,m,(x,y,z)=>{const u=((x-bx)*c+(z-bz)*s)/sc,w=((z-bz)*c-(x-bx)*s)/sc,v=(y-bY)/sc;return Math.max((Math.hypot(u/5.2,v/1.9,w/2.2)-1)*1.9,-(Math.hypot(u/4.75,(v-0.45)/1.9,w/1.85)-1)*1.85,v-0.9)*sc;});}
function crag(cx,cy,cz,rx,ry2,rz,m,k){const R=Math.max(rx,ry2,rz)+3;prim(cx-R,cx+R,cy-R,cy+R,cz-R,cz+R,m,(x,y,z)=>((Math.hypot((x-cx)/rx,(y-cy)/ry2,(z-cz)/rz)-1)*Math.min(rx,ry2,rz)+2.2*(n3(x*0.3+k,y*0.45,z*0.3)-0.5)+0.8*(n3(x*0.9,y*0.9+k,z*0.9)-0.5))*0.7);}
SCENES[0]={name:'Lighthouse rock',ry0:0.785,focus:[-2,20,0],bg:[10,14,28],LD:[-0.5,0.62,0.6],amb:[0.42,0.5,0.7],sun:[1.14,0.9,0.7],level:G0,pv:[3,0.2,1.5],pcol:[230,240,244],pn:26,foot,shallow:true,
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

function carveW(cx,cy,cz,r,m0,m1){const x0=Math.max(0,Math.floor((cx-r-2)*RS)),x1=Math.min(N-1,Math.ceil((cx+r+2)*RS)),y0=Math.max(0,Math.floor((cy-r-2)*RS)),y1=Math.min(H-1,Math.ceil((cy+r+2)*RS)),z0=Math.max(0,Math.floor((cz-r-2)*RS)),z1=Math.min(N-1,Math.ceil((cz+r+2)*RS));
for(let y=y0;y<=y1;y++)for(let z=z0;z<=z1;z++)for(let x=x0;x<=x1;x++){const i=(y*N+z)*N+x;if(MT[i]!==m0)continue;const X=(x+0.5)/RS,Y=(y+0.5)/RS,Z=(z+0.5)/RS,s=Math.hypot(X-cx,Y-cy,Z-cz)-r+1.4*(n3(X*0.7,Y*0.7,Z*0.7)-0.5);if(-s>D[i]){D[i]=-s;MT[i]=m1;}}}
function barrel(x,z,y,h){cyl(x,z,y,y+h,0.85,0.85,5);ring(x,y+h*0.25,z,0.88,0.09,56);ring(x,y+h*0.75,z,0.88,0.09,56);cyl(x,z,y+h,y+h+0.1,0.7,0.7,34);}
SCENES[3]={name:'Shipwreck cove',ry0:0.9,focus:[8,14,10],bg:[10,16,26],LD:[-0.5,0.66,0.55],amb:[0.46,0.52,0.66],sun:[1.22,1.02,0.76],level:G0,pv:[2,0.2,1],pcol:[230,240,244],pn:22,foot,shallow:true,wc:[[92,204,196],[24,100,150]],
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

function camel2(x,z,ra,sit,k){const b=hAt(x,z)-(sit?2.3:0),c=Math.cos(ra),s=Math.sin(ra),P=(u,v)=>[x+u*c-v*s,z+u*s+v*c];let p=P(-1.8,0),q=P(1.8,0);
cap(p[0],b+3.8,p[1],q[0],b+3.9,q[1],1.3,43);ell(x,b+5.25,z,1.25,0.95,1.1,43);box(x,b+4.9,z,1.05,0.85,1.38,23,0.25,ra);box(x,b+5.1,z,1.12,0.12,1.44,54,0.04,ra);
for(const v of[-1.55,1.55]){p=P(-0.2,v);box(p[0],b+4.2,p[1],0.8,0.7,0.35,34,0.1,ra);}p=P(-1.2,0);q=P(-1.2,0);cap(P(-1.3,-1.1)[0],b+5.6,P(-1.3,-1.1)[1],P(-1.3,1.1)[0],b+5.6,P(-1.3,1.1)[1],0.38,88);
p=P(2.6,0);q=P(3.3,0);cap(p[0],b+4.2,p[1],q[0],b+5.6,q[1],0.58,43);p=P(3.9,0);cap(q[0],b+5.6,q[1],p[0],b+6.9,p[1],0.5,43);q=P(4.5,0);ell(q[0],b+7.1,q[1],0.75,0.55,0.55,43);p=P(5.2,0);ball(p[0],b+6.9,p[1],0.4,43);
p=P(-3.1,0);q=P(-3.5,0);cap(p[0],b+4.1,p[1],q[0],b+2.6,q[1],0.2,43);
for(const u of[-1.6,1.6])for(const v of[-0.7,0.7]){p=P(u,v);if(sit){q=P(u+1.4,v*1.3);cap(p[0],b+2.7,p[1],q[0],b+2.6,q[1],0.42,43);}else{q=P(u+(u>0?0.25:-0.25),v);cap(p[0],b+3.2,p[1],q[0],b+1.6,q[1],0.45,43);cap(q[0],b+1.6,q[1],p[0],b-0.3,p[1],0.36,43);}}}
function column(x,z,y,h,brk){cyl(x,z,y-0.4,y+0.5,0.95,0.9,40);cyl(x,z,y+0.5,y+h,0.66,0.56,40);if(!brk){cyl(x,z,y+h,y+h+0.5,0.72,0.95,40);box(x,y+h+0.7,z,0.95,0.2,0.95,40,0.04);}}
function amph(x,z,y){ell(x,y+0.9,z,0.62,0.9,0.62,25);cyl(x,z,y+1.6,y+2.2,0.26,0.34,25);}
SCENES[1]={name:'Desert oasis',ry0:2.5,focus:[0,16,0],bg:[20,14,22],LD:[-0.55,0.66,0.5],amb:[0.5,0.48,0.6],sun:[1.26,1.06,0.77],level:G0-1.6,pv:[2.5,0.1,1],pcol:[240,214,160],pn:26,foot,shallow:true,wc:[[96,206,190],[36,140,156]],
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

SCENES.push(
{name:'Overgrown mecha',ry0:2.6,focus:[-3,20,-3],bg:[8,14,18],LD:[-0.5,0.68,0.54],amb:[0.42,0.52,0.56],sun:[1.25,1.1,0.8],level:G0-1.6,pv:[0,0,0],pcol:[0,0,0],pn:0,foot,vines:true,flies:70,
h:(x,z)=>{const h=G0+0.5+2*n2(x*0.07,z*0.07)+0.5*n2(x*0.3,z*0.3)+1.5*Math.exp(-((x-(C-3))**2+(z-(C-3))**2)/300);return(G0-5)+(h-(G0-5))*sm(0.8,1.3,G.pd(x,z));},
bot:(x,z)=>G0-12-3*n2(x*0.2,z*0.2)-1.2*n2(x*0.7,z*0.7),
top:(sx,sy,sz)=>(G.pd(sx,sz)<1.3&&sy<G0-0.6)?32:1,side:(sx,sy,sz,j)=>sy>HT[j]-2.2?2:3,
fix:(mm,sx,sy,sz,nx,ny,nz,hv)=>{if((mm===70||mm===71||mm===56||mm===72||mm===73||mm===75)&&ny>0.45&&n3(sx*0.2,sy*0.2,sz*0.2)+0.25*n3(sx*0.8,sy*0.8,sz*0.8)>0.66)return 18;if((mm===3||mm===5)&&ny>0.5&&n3(sx*0.25,sy*0.25,sz*0.25)>0.5)return 18;if(mm===7&&ny>0.5&&hv<0.02)return 16;return mm;},
scatter:(mm,sx,sy,sz,hv,a)=>{if(mm===1&&hv>0.976)a(sx,sy+1.2,sz,8);else if(mm===18&&sy>G.gy+3&&hv>0.93)a(sx,sy+0.4,sz,66);else if(mm===32&&hv<0.1)for(let q=1;q<4;q++)a(sx,sy+q*0.7,sz,14);},
init(){G.pd=(x,z)=>Math.hypot(x-(C-24),z-(C+24))/(8+3*n2(x*0.15+20,z*0.15));},
build(){this.lights=[];
const O=[C-3,hAt(C-3,C-3)-0.5,C-3],cs=0.7071,sn=-0.7071,psi=-0.7854,xr=[cs,0,sn],K=1.35;G.gy=O[1];
const P=(x,y,z)=>[O[0]+(x*cs-z*sn)*K,O[1]+y*K,O[2]+(x*sn+z*cs)*K];
const B=(x,y,z,bx,by,bz,m,rd,yaw)=>{const p=P(x,y,z);abox(p[0],p[1],p[2],bx*K,by*K,bz*K,m,rd==null?0.25:rd,psi+(yaw||0));};
const Lm=(a,b,w,t,m)=>alimb(P(a[0],a[1],a[2]),P(b[0],b[1],b[2]),w*K,t*K,m,xr);
const Cp=(a,b,r,m)=>{const p=P(a[0],a[1],a[2]),q=P(b[0],b[1],b[2]);cap(p[0],p[1],p[2],q[0],q[1],q[2],r*K,m);};
const Bl=(x,y,z,r,m)=>{const p=P(x,y,z);ball(p[0],p[1],p[2],r*K,m);};
const lp=(a,b,f)=>[a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,a[2]+(b[2]-a[2])*f];
const AR=(a,b,w,t,m)=>{Lm(a,b,w-0.7,t-0.7,56);Lm(lp(a,b,0.13),lp(a,b,0.87),w,t,m);};
const J=(x,y,z,r)=>{Bl(x,y,z,r,56);Cp([x-r-0.3,y,z],[x+r+0.3,y,z],r*0.7,73);};
const CV=(x,y,z,r)=>{const p=P(x,y,z);carve(p[0],p[1],p[2],r*K);};
B(0,14,0,4.6,2.6,3.2,56);B(0,13.2,3.3,2,3.4,1,71);B(-4.6,12.2,3.2,2,3,0.6,70,0.2,0.25);B(4.6,12.2,3.2,2,3,0.6,70,0.2,-0.25);B(-6.4,12.6,0,0.6,3,3,70);B(6.4,12.6,0,0.6,3,3,70);B(0,12.6,-3.6,4,2.8,0.6,70);
J(-4.5,13.5,1.5,2.1);J(4.5,13,1.5,2.1);
Lm([0,16,0.5],[0,22,2.4],3.6,5.2,56);B(0,17.5,3.7,3.6,0.7,1,73,0.2);B(0,19.4,4.3,3.8,0.7,1,73,0.2);
Lm([0,22,2.4],[0,30.5,5.2],4.6,7.6,70);B(0,26.8,8.9,2.6,3,1,71,0.3);B(-4.9,27,8.2,2,2.6,1.2,70,0.3,0.2);B(4.9,27,8.2,2,2.6,1.2,70,0.3,-0.2);
for(let i=0;i<4;i++){B(-4.6,22.2+i*0.95,7.2,1.8,0.26,0.8,56,0.05);B(4.6,22.2+i*0.95,7.2,1.8,0.26,0.8,56,0.05);}
B(0,31.2,4.6,5.2,1,3.6,56);Cp([-1.3,31,6],[-1.3,33,6.8],0.35,73);Cp([1.3,31,6],[1.3,33,6.8],0.35,73);
B(0,34.2,7.2,2.1,1.9,2.6,70,0.3);B(-2.35,33.6,7.8,0.5,1.3,2,71,0.15);B(2.35,33.6,7.8,0.5,1.3,2,71,0.15);B(0,34.3,9.85,1.6,0.42,0.3,65,0.05);Bl(1.3,35.35,9.6,0.32,68);B(0,36.3,6.6,0.5,0.7,2.4,71,0.1);B(1.9,37.6,6,0.2,2.8,0.9,70,0.05);B(-1.9,36.8,6,0.2,2,0.7,70,0.05);B(0,32.5,9.1,1.3,0.7,0.9,56,0.1);
J(9,29.5,3.5,2.6);J(-9,29.5,3.5,2.6);
B(10.6,30.2,3.5,3.6,3.2,4.4,70,0.35,0.12);B(10.6,33.9,3.2,3.2,0.6,3.6,71,0.2,0.12);B(10.8,36.2,2,2.6,1.7,3,56,0.2);for(let i=0;i<3;i++)for(let j=0;j<2;j++)Bl(9.5+i*1.3,35.6+j*1.25,5.05,0.5,36);
for(const q of[[8.3,28.4],[12.9,28.4],[8.3,32],[12.9,32]])Bl(q[0],q[1],8,0.4,73);
B(-10.6,30.2,3.5,3.6,3.2,4.4,71,0.35,-0.12);B(-10.6,33.9,3.2,3.2,0.6,3.6,70,0.2,-0.12);
AR([10.8,27,3.5],[12.6,17.5,6.5],2.6,2.6,70);J(12.6,17,6.5,1.9);AR([12.6,16.5,6.6],[13.6,6.5,10.4],3.1,3.1,70);B(16.1,12,8.6,0.6,4.6,3.1,71,0.15);B(13.7,5.2,10.9,1.8,1,1.8,56);Cp([11.2,25,5.8],[12.7,19,8.2],0.3,73);
B(13.9,3.2,11.8,2,1.4,2.2,73,0.3);for(let i=0;i<4;i++){Cp([12.4+i,2.6,13.8],[12.4+i,0.9,15.6],0.5,56);Cp([12.4+i,0.9,15.6],[12.4+i,0.5,17],0.45,56);}Cp([11.6,3,12],[10.6,1.2,13.4],0.5,56);
AR([-10.8,27,3.5],[-12,21,4.4],2.6,2.6,70);
Cp([-12,20,4.5],[-12.5,14,6],0.3,56);Cp([-11.5,20,4],[-10.5,15,3],0.26,23);Cp([-12.5,20,5],[-14,16.5,5.5],0.26,73);Cp([-11.8,20,5],[-11.2,12.5,5.5],0.24,54);Cp([-12.6,20,3.8],[-13.4,17.5,2.8],0.26,56);
AR([-17,2.6,10],[-25,2.4,19],3.1,3.1,70);B(-26.4,2.4,20.6,2,1.4,2.2,73,0.3,0.73);
for(let i=0;i<4;i++){const bx=-27.6+0.75*(i-1.5),bz=22+0.66*(i-1.5),a=[bx,2.8,bz],b=[bx-1.05,4.2,bz+1.2],c=[bx-0.8,5.7,bz+0.9];Cp(a,b,0.5,56);Cp(b,c,0.45,56);}
AR([-4.5,13.5,1.5],[-6,16,12.6],3.5,3.5,70);Cp([-8.4,16.2,13.4],[-3.6,16.2,13.4],2,73);B(-6,17.6,15,2.8,2.6,1.6,71,0.4);AR([-6,15.5,13.5],[-6,3,15.4],3.5,3.7,70);B(-6,9.5,18.3,2.5,5,0.9,71,0.25);B(-6,10,11.2,2,3,1.2,56);J(-6,2.6,15.5,1.8);
B(-6,1.3,19.6,3,1.3,3,70,0.3);B(-6,1.3,14,2.6,1.3,2,56,0.3);B(-6,1.6,22.7,2.6,0.9,0.8,71,0.2);Cp([-7.7,14,4],[-8.1,15.6,11],0.3,73);
AR([4.5,13,1.5],[6,4.4,7.4],3.5,3.5,70);Cp([3.6,3.4,8],[8.4,3.4,8],2,73);B(6,3.2,10,2.8,2.4,1.4,71,0.4);AR([6,3.4,7],[6,3.2,-8],3.5,3.1,70);B(6,6.7,-1,2.5,0.8,5,71,0.25);B(6,3.6,-11.2,3,2.4,2.2,70,0.3);B(6,1.4,-12.4,2.6,1.2,1.4,56);
B(0,25,-3.4,5.4,5.4,2.8,56,0.3);Cp([-4.6,21,-5.6],[-4.6,29,-5.6],1.3,73);Cp([4.6,21,-5.6],[4.6,29,-5.6],1.3,73);
Cp([-3,28.5,-6],[-4.4,33,-9.6],1.7,70);Cp([-4.4,33,-9.6],[-4.9,34.6,-10.8],2.2,56);Cp([3,28.5,-6],[4.4,33,-9.6],1.7,70);Cp([4.4,33,-9.6],[4.9,34.6,-10.8],2.2,56);
B(3.8,30.5,-3.6,1.6,1.6,1.6,56);Lm([3.8,30,-4],[4.9,47,-9.2],0.9,0.9,73);Lm([4.0,33,-5],[4.4,39,-6.8],1.4,1.4,56);Lm([4.75,44.6,-8.5],[4.9,47,-9.2],1.4,1.4,56);
Lm([12,1.9,20],[20,1.9,24.6],1.3,1.5,56);Lm([20,2,24.6],[28,2,29.2],0.55,0.55,73);Lm([8.8,1.8,18.2],[12,1.9,20],1,1.2,70);B(15.5,3.2,22,0.8,1.3,0.9,73,0.1,0.52);Cp([14.5,3.7,21.4],[18,3.7,23.4],0.6,56);
CV(-13.5,32.5,6.5,3.2);CV(-12.2,19.8,4.6,2.2);CV(5.6,24.2,7.6,2.2);CV(-5.6,16.4,7.2,1.7);CV(12.2,29,8,1.4);CV(2,28.6,9.6,1.1);CV(-2.5,21,6.6,1.3);CV(6,6,2,1.5);CV(-22,3.4,15,1.6);
const db=[[20,-10,70],[-22,-8,71],[-8,26,70],[24,8,71],[-28,6,70],[10,-24,70],[-16,-18,71]];db.forEach((q,k)=>{const p=P(q[0],0,q[1]);abox(p[0],hAt(p[0],p[2])+0.4,p[2],2+h3(k,7,1)*2,0.5+h3(k,7,2)*0.8,1.4+h3(k,7,3)*1.5,q[2],0.25,k*1.1);});
const vp=P(0,34.3,11.5);this.lights.push([vp[0],vp[1],vp[2],0.8,1,0.35,0.2]);

let tp=P(-11,0,-13);tree2(tp[0],tp[2],36,8,31);tp=P(14,0,-15);tree2(tp[0],tp[2],26,7,32);tp=P(24,0,12);tree2(tp[0],tp[2],13,5,33);tp=P(-24,0,2);tree2(tp[0],tp[2],15,5,34);
Cp([-1,30,-3],[-2,36,-2],0.55,5);{const p=P(-2,37.5,-2);leafM(p[0],p[1],p[2],3.2,6);}
const root=(pts,r)=>{for(let i=0;i<pts.length-1;i++)Cp(pts[i],pts[i+1],r-0.04*i,5);};
root([[-9,33.4,2],[-7,26.4,8],[-5,18.4,9],[-9,9.4,9.4],[-11,0,12]],0.6);root([[9,33.8,3],[13.8,30,8.2],[15.7,20,8.6],[17,8,12.2],[19,0,14]],0.6);root([[-3,36.4,5],[2,36.6,8.6],[4,31,9.6],[2,23,9.9],[3,12.5,5.2],[1.5,0,8]],0.45);root([[-13,30,-2],[-13.8,34.2,3.6]],0.55);root([[0,31,-6.6],[-2,22,-6.8],[-4,10,-5],[-7,0,-8]],0.5);root([[6,8.4,-4],[9.2,5,-2],[11,0,-4]],0.45);
for(const q of[[-10,34.2,2,2.8],[-6,19.6,13,1.9],[0,16.6,5.6,2.4],[-21,4.2,14.5,1.9],[6,5.8,-3,2.2]]){const p=P(q[0],q[1],q[2]);leafM(p[0],p[1],p[2],q[3],6);}
for(let i=0;i<26;i++){const x=C-38+h3(i,101,1)*76,z=C-38+h3(i,101,2)*76;if(G.pd(x,z)<1.5||Math.hypot(x-O[0],z-O[2])<15)continue;leafM(x,hAt(x,z)+0.8,z,1.6+h3(i,101,3)*1.8,6);}
const lg=[C+22,C-30,C+36,C-22];cap(lg[0],hAt(lg[0],lg[1])+0.9,lg[1],lg[2],hAt(lg[2],lg[3])+1.1,lg[3],1.5,5);
for(let i=0;i<5;i++){const f=0.15+i*0.17,x=lg[0]+(lg[2]-lg[0])*f,z=lg[1]+(lg[3]-lg[1])*f,y=hAt(x,z)+2.3;cap(x,y,z,x,y+1.2,z,0.3,30);ell(x,y+1.5,z,0.9,0.5,0.9,29);}
for(let i=0;i<9;i++){const x=C-36+h3(i,102,1)*72,z=C-36+h3(i,102,2)*72;box(x,hAt(x,z)+0.5,z,1.2+h3(i,102,3)*1.4,0.9+h3(i,102,4),1+h3(i,102,5),3,0.7,i);}

this.shafts=[];for(const q of[[-8,-6,3.4,26],[5,4,2.6,20],[-14,9,3,22],[-2,15,2.4,16]]){const p=P(q[0],0,q[1]);this.shafts.push([p[0]+LD[0]*17,O[1]+LD[1]*17,p[2]+LD[2]*17,q[2],24,q[3]]);}
const e=P(1.3,35.35,10.2);this.glows=[[vp[0],vp[1],vp[2],3.4,150,50,30],[e[0],e[1],e[2],1.2,30,110,60]];
}});
function gear2(cx,cy,cz,R,th,teeth,ax,m,ph,nsp){const rim=Math.min(2.3,R*0.32),hub=Math.min(1.9,R*0.36),sp=6.2832/nsp,sw=Math.min(0.62,R*0.12);
prim(cx-R-2,cx+R+2,cy-R-2,cy+R+2,cz-R-2,cz+R+2,m,(x,y,z)=>{let a,b,w;if(ax===1){a=x-cx;b=z-cz;w=y-cy;}else if(ax===2){a=x-cx;b=y-cy;w=z-cz;}else{a=z-cz;b=y-cy;w=x-cx;}
const r=Math.hypot(a,b),an=Math.atan2(b,a)-ph,tt=2.5*Math.sin(an*teeth),rr=R+0.3+0.5*(tt>1?1:tt<-1?-1:tt),am=((an%sp)+sp)%sp-sp/2,ds=Math.abs(r*Math.sin(am))-sw,aw=Math.abs(w);
return Math.min(Math.max(Math.min(Math.max(r-rr,(R-rim)-r),r-hub,Math.max(ds,r-R+1)),aw-th),Math.max(r-hub*0.72,aw-th*1.7))*0.8;});}
function hero(x,z,fa,o){const y=hAt(x,z),c=Math.cos(fa),s=Math.sin(fa),P=(u,v)=>[x+u*c-v*s,z+u*s+v*c];let p,q;
for(const v of[-0.55,0.55]){p=P(0,v);cap(p[0],y+0.3,p[1],p[0],y+2,p[1],0.46,o.legs);q=P(0.25,v);ell(q[0],y+0.35,q[1],0.62,0.4,0.62,o.boot||5);}
if(o.robe){cyl(x,z,y+0.25,y+4.1,1.55,0.95,o.body);if(o.trim)ring(x,y+0.5,z,1.5,0.2,o.trim);}else cap(x,y+2.2,z,x,y+3.8,z,1.05,o.body);
if(o.belt)ring(x,y+2.5,z,o.robe?1.24:1.07,0.16,o.belt);
const hands=[];for(const v of[-1,1]){p=P(0,v*1.12);const hp=o.hands[v<0?0:1];q=P(hp[0],hp[1]);cap(p[0],y+3.9,p[1],q[0],y+hp[2],q[1],0.36,o.arm||o.body);ball(q[0],y+hp[2],q[1],0.4,102);hands.push([q[0],y+hp[2],q[1]]);}
ball(x,y+5.3,z,1.25,102);for(const v of[-0.45,0.45]){p=P(1.12,v);ball(p[0],y+5.4,p[1],0.17,36);}
return{y,P,hands};}
function pillar(x,z,y,h,brk){box(x,y+0.5,z,2.2,0.55,2.2,98,0.12);prim(x-3,x+3,y+1,y+h,z-3,z+3,98,(X,Y,Z)=>Math.max(Math.hypot(X-x,Z-z)-(1.6+0.13*Math.cos(8*Math.atan2(Z-z,X-x))),y+1-Y,Y-(y+h-(brk?1.4*n2(X*1.3,Z*1.3):0)))*0.85);if(!brk){box(x,y+h+0.35,z,1.95,0.35,1.95,98,0.1);box(x,y+h+1,z,2.3,0.35,2.3,98,0.1);}}
function torch(sc,x,y,z,dx,dz){cap(x,y,z,x+dx*1.3,y+0.9,z+dz*1.3,0.2,56);ell(x+dx*1.3,y+1.2,z+dz*1.3,0.5,0.3,0.5,56);ell(x+dx*1.3,y+2,z+dz*1.3,0.42,0.8,0.42,11);ball(x+dx*1.3,y+1.6,z+dz*1.3,0.45,10);sc.lights.push([x+dx*2.2,y+2.2,z+dz*2.2,1.5,1,0.62,0.3]);}
SCENES.push({name:'Great clockwork',ry0:2.85,focus:[0,24,2],bg:[12,10,14],LD:[-0.35,0.7,0.62],amb:[0.4,0.4,0.52],sun:[1.08,0.92,0.72],level:null,pv:[0.3,0.25,0.2],pcol:[255,220,150],pn:20,foot,tile:[[116,110,112],[100,94,98],[58,54,60]],
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
}});
SCENES.push({name:'Guardian’s hall',ry0:2.5,focus:[0,12,-2],bg:[8,10,14],LD:[0.35,0.7,-0.62],amb:[0.3,0.34,0.46],sun:[0.55,0.62,0.85],level:null,pv:[0.2,0.5,0.15],pcol:[255,190,120],pn:22,foot,tile:[[92,98,96],[80,86,88],[42,46,48]],swm:{23:50,11:90},
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
this.shafts=[];for(const wx of[C-14,C+4])this.shafts.push([wx-LD[0]*11,yf+10-LD[1]*11,C-31-LD[2]*11,1.3,11,18]);
}});

function gableR(cx,yb,cz,hw,len,m,ra,sl,th){const c=Math.cos(ra),s=Math.sin(ra),R=Math.hypot(hw,len)+3,k=1/Math.hypot(1,sl);
prim(cx-R,cx+R,yb-2,yb+hw*sl+3,cz-R,cz+R,m,(x,y,z)=>{const u=(x-cx)*c+(z-cz)*s,v=(z-cz)*c-(x-cx)*s,a=(Math.abs(u)*sl+(y-yb)-hw*sl)*k;return Math.max(a,th?-(a+th):yb-y,Math.abs(v)-len,yb-0.3-y);});}
function house(sc,o){const ra=o.ra||0,c=Math.cos(ra),s=Math.sin(ra),x=o.x,z=o.z,w=o.w,l=o.l,g=hAt(x,z),y0=g+0.3,wh=o.wh||10,yt=y0+wh,sl=o.sl||0.85,WM=o.wall||110,
L=(u,v)=>[x+u*c-v*s,z+u*s+v*c],
el=(side,off,pr,yc,hw,hh,th,m,rd)=>{const p=side<2?L((side?-1:1)*(w+pr),off):L(off,(side===2?1:-1)*(l+pr));if(side<2)box(p[0],yc,p[1],th,hh,hw,m,rd==null?0.04:rd,ra);else box(p[0],yc,p[1],hw,hh,th,m,rd==null?0.04:rd,ra);return p;};
box(x,g-0.5,z,w+0.6,1.3,l+0.6,4,0.1,ra);
box(x,y0+wh/2,z,w,wh/2,l,WM,0.03,ra);
gableR(x,yt-0.2,z,w,l,WM,ra,sl);
gableR(x,yt-1.6*sl+1.15*Math.hypot(1,sl)-0.2,z,w+1.6,l+1.5,o.roof,ra,sl,1.15);
{const a=L(0,-l-1.5),b=L(0,l+1.5);cap(a[0],yt+w*sl+1.25,a[1],b[0],yt+w*sl+1.25,b[1],0.55,111);}
for(const su of[-1,1])for(const sv of[-1,1]){const p=L(su*w,sv*l);box(p[0],y0+wh/2,p[1],0.5,wh/2,0.5,111,0.12,ra);}
for(const side of[0,1,2,3]){const half=side<2?l:w;el(side,0,0.05,yt-0.45,half,0.45,0.3,111);el(side,0,0.05,y0+0.45,half,0.45,0.3,111);}
for(const side of[2,3])el(side,0,0.05,yt+w*sl*0.45,0.42,w*sl*0.45,0.3,111);
for(const q of o.win||[]){const yc=y0+(q[2]||5.6);el(q[0],q[1],0.05,yc,1.55,1.75,0.4,111);el(q[0],q[1],0.12,yc,1.05,1.25,0.5,116,0.02);el(q[0],q[1],0.3,yc-1.95,1.8,0.22,0.5,111);
if(q[3]){el(q[0],q[1],0.75,yc-2.55,1.5,0.35,0.4,59);for(const d of[-1,0,1]){const p=side2(q[0],q[1]+d,1.0);ball(p[0],yc-1.95,p[1],0.55,d?66:42);}}}
function side2(side,off,pr){return side<2?L((side?-1:1)*(w+pr),off):L(off,(side===2?1:-1)*(l+pr));}
const doors=[];
for(const q of o.door||[]){el(q[0],q[1],0.05,y0+4.2,2.6,4.2,0.4,111);el(q[0],q[1],0.14,y0+3.9,2.0,3.9,0.5,117,0.02);el(q[0],q[1],1.5,g-0.1,2.6,0.4,1.4,13,0.06);
const k=side2(q[0],q[1]+1.3,0.75);ball(k[0],y0+3.6,k[1],0.3,54);doors.push(side2(q[0],q[1],4));}
if(o.chim){const p=L(o.chim[0],o.chim[1]),top=yt+w*sl+3.4;box(p[0],(yt+top)/2,p[1],0.9,(top-yt)/2,0.9,25,0.05,ra);box(p[0],top+0.2,p[1],1.2,0.25,1.2,4,0.05,ra);sc.emit.push([p[0]-C,top+0.9-G0,p[1]-C,7,pk(214,214,224),pk(150,150,170)]);}
return{g,y0,yt,L,doors};}
SCENES.push({name:'Brindlebrook',walk:true,gk:0.55,ry0:0,focus:[0,6,0],bg:[54,94,128],LD:[-0.5,0.7,-0.51],amb:[0.47,0.53,0.62],sun:[1.2,1.05,0.8],level:G0+0.3,shallow:true,wc:[[92,176,180],[38,100,146]],pv:[0.7,0.12,0.4],pcol:[255,244,200],pn:22,
foot:(x,z)=>Math.hypot(Math.max(Math.abs(x-C)-46,0),Math.max(Math.abs(z-C)-46,0))-14+2.2*n2(x*0.11+3,z*0.11+8),
h:(x,z)=>{const u=x-C,v=z-C;let h=G0+1+0.5*n2(x*0.05,z*0.05)+0.12*n2(x*0.31,z*0.31);
const f=(v-9.5)/6,t=Math.abs(u)<4.6?Math.round((f<0?0:f>1?1:f)*4)/4:(v>G.te(u)?1:0);
h+=3*t+t*4.6*Math.exp(-((u+38)*(u+38)+(v-40)*(v-40))/240);
const b=G.bl(x,z);if(b>0)h+=b*(12.5+3*n2(x*0.15,z*0.15)+1.5*n2(x*0.5,z*0.5));
return h-3.3*sm(1.22,0.5,G.pd(x,z));},
bot:(x,z)=>G0-8-2.6*n2(x*0.1,z*0.1)-1.2*n2(x*0.5,z*0.5),
top:(sx,sy,sz,j)=>{const u=sx-C,v=sz-C;if(sy<G0+0.95&&G.pd(sx,sz)<1.35)return 20;
if(G.bl(sx,sz)>0.3)return n2(sx*0.3,sz*0.3)>0.5?1:3;
const p=G.pt(sx,sz);if(p)return p;if(u>-24&&u<-12&&v>18&&v<29)return 121;return 1;},
side:(sx,sy,sz,j)=>{if(G.bl(sx,sz)>0.01&&sy>G0+4.6)return 82;if(DRm[j]<-2.2&&sy>G0-1)return 4;return sy>HT[j]-2.4?2:3;},
fix:(mm,sx,sy,sz,nx,ny,nz,hv)=>(mm===7&&ny>0.5&&hv<0.014&&G.pd(sx,sz)<0.8)?16:mm,
scatter:(mm,sx,sy,sz,hv,a)=>{if(mm===1){if(hv>0.993-0.1*G.fl(sx,sz))a(sx,sy+1,sz,8);}
else if(mm===20){if(hv>0.9&&sy>G0+0.25)for(let q=1;q<4;q++)a(sx,sy+q*0.6,sz,14);}
else if(mm===121){if(hv>0.45)a(sx,sy+0.5,sz,6);}},
init(){G.pd=(x,z)=>Math.hypot(x-(C+30),z-(C-28))/(10+2.2*n2(x*0.13+20,z*0.13));
G.te=u=>13+1.2*Math.sin(u*0.13)+0.8*Math.sin(u*0.37+1);
G.bl=(x,z)=>sm(0,1,(x-C-27+2*n2(z*0.2,3))/2.2)*sm(0,1,(z-C-36.5+2*n2(x*0.2,9))/2.2);
G.roads=[[0,-60,0,-14,3.3,115],[0,6,0,29,3.4,115],[-11,-6,-17.5,-6,2.4,115],[11,-4,17.5,-1.5,2.4,115],[0,-34,-16,-39,2,120],[2,-37,20,-42,1.9,120],[20,-42,36,-48,1.9,120],[36,-48,47,-45,1.9,120],[0,21,-24,31,2,120],[-24,31,-36,33,2,120],[0,21,24,27,2,120],[24,27,40,29,2.2,120],[9,-13,11,-21,2,120]];
G.pt=(x,z)=>{const u=x-C,v=z-C,nz=1.3*(n2(x*0.35,z*0.35)-0.5);if(Math.abs(u)<4.6&&v>9.5&&v<16.2)return 13;if(Math.hypot(u,v+5)<12.5+nz*1.4)return 115;
let best=0;for(const r of G.roads){const dx=r[2]-r[0],dz=r[3]-r[1];let f=((u-r[0])*dx+(v-r[1])*dz)/(dx*dx+dz*dz);f=f<0?0:f>1?1:f;if(Math.hypot(u-r[0]-dx*f,v-r[1]-dz*f)<r[4]+nz){if(r[5]===115)return 115;best=120;}}return best;};
G.beds=[[12,7,5],[-13,-17,4],[14,-12,3],[-7,24,4],[8,26,4],[-38,-14,4],[40,2,4],[-18,-28,3]];
G.fl=(x,z)=>{let s=0;for(const b of G.beds){const d=((x-C-b[0])*(x-C-b[0])+(z-C-b[1])*(z-C-b[1]))/(b[2]*b[2]);if(d<4)s+=Math.exp(-d);}return s>1?1:s;};},
build(){const LT=this.lights=[];this.emit=[];const sc=this,X1=[1,0,0],Y=(u,v)=>hAt(C+u,C+v);
house(sc,{x:C-27,z:C-6,w:7,l:9,roof:112,door:[[0,0]],win:[[0,-5.6],[0,5.6],[3,0,5.6,1],[2,0],[1,-4.5],[1,4.5]],chim:[-3,4]});
house(sc,{x:C+27,z:C-4,w:7,l:8,roof:113,door:[[1,2.5]],win:[[1,-3.8,5.6,1],[3,0],[2,0],[0,-3.8],[0,3.8]],chim:[3,-3]});
house(sc,{x:C-26,z:C-39,w:6,l:8,ra:-0.3,roof:112,wh:9,door:[[0,1]],win:[[0,-4.9],[3,0,5.4,1],[2,0],[1,0]],chim:[-2.5,-3]});
house(sc,{x:C,z:C+39,w:7,l:11,ra:Math.PI/2,roof:114,wh:11,door:[[1,0]],win:[[1,-6.6,5.8,1],[1,6.6,5.8,1],[0,-6],[0,6],[2,0],[3,0]],chim:[2.5,7]});
{const wx=C,wz=C-5,g=hAt(wx,wz);prim(wx-4,wx+4,g-1,g+3,wz-4,wz+4,4,(x,y,z)=>Math.max(Math.abs(Math.hypot(x-wx,z-wz)-2.5)-0.55,y-(g+2.2),g-0.8-y)*0.9);
cyl(wx,wz,g+0.2,g+1.5,2.2,2.2,64);for(const s of[-1,1])box(wx+s*2.75,g+4,wz,0.35,4,0.35,111,0.08);
box(wx,g+7.3,wz,3.3,0.3,0.35,111,0.05);gableR(wx,g+7.4,wz,2.5,3.8,112,Math.PI/2,0.75,0.9);cap(wx,g+7,wz,wx,g+3.6,wz,0.13,5);cyl(wx,wz,g+2.6,g+3.6,0.6,0.5,59);}
{const sx=C+15.5,sz=C-19,g=hAt(sx,sz);for(const a of[-1,1])for(const b of[-1,1])cap(sx+a*3.5,g-0.3,sz+b*2.3,sx+a*3.5,g+6.3,sz+b*2.3,0.3,5);
gableR(sx,g+6.2,sz,3.4,4.6,119,Math.PI/2,0.5,0.8);box(sx,g+1.5,sz-1.8,3.5,1.5,0.9,34,0.05);
for(let k=0;k<4;k++){ball(sx-2.6+k*0.75,g+3.45,sz-1.9,0.42,53);ball(sx+0.6+k*0.72,g+3.45,sz-1.8,0.42,47);}ball(sx-2.3,g+3.9,sz-1.9,0.42,53);ball(sx-1.5,g+3.9,sz-1.9,0.42,53);ball(sx+1,g+3.9,sz-1.8,0.42,47);
box(sx+5.4,g+1.1,sz+0.5,1.1,1.1,1.1,59,0.05);box(sx+5.2,g+3,sz+0.4,0.9,0.8,0.9,59,0.05,0.4);box(sx+5.6,g+1,sz-2.2,1,1,1,34,0.05,0.2);barrel(sx-5.2,sz+1.2,g-0.1,2.4);barrel(sx-5.6,sz-0.9,g-0.1,2.4);}
{const g=Y(0,-53);for(const s of[-1,1]){box(C+s*5.6,g+3.2,C-53,0.65,3.6,0.65,111,0.1);box(C+s*13.6,g+0.8,C-53,7,1.5,0.75,4,0.1);box(C+s*21,g+1.4,C-53,0.9,2.1,0.9,4,0.1);}
for(const s of[-1,1]){box(C+s*5.6,g+7,C-53,0.95,0.3,0.95,4,0.08);ball(C+s*5.6,g+8,C-53,0.75,11);LT.push([C+s*5.6,g+8,C-53,0.4,1,0.72,0.4]);}}
const fence=(pts)=>{for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],n=Math.max(1,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/3.2));for(let k=0;k<n;k++){const x0=C+a[0]+(b[0]-a[0])*k/n,z0=C+a[1]+(b[1]-a[1])*k/n,x1=C+a[0]+(b[0]-a[0])*(k+1)/n,z1=C+a[1]+(b[1]-a[1])*(k+1)/n,g0=hAt(x0,z0),g1=hAt(x1,z1);
cap(x0,g0-0.3,z0,x0,g0+2.4,z0,0.32,5);if(k===n-1)cap(x1,g1-0.3,z1,x1,g1+2.4,z1,0.32,5);cap(x0,g0+1.1,z0,x1,g1+1.1,z1,0.2,34);cap(x0,g0+2,z0,x1,g1+2,z1,0.2,34);}}};
fence([[-25,17.5],[-25,30],[-11,30],[-11,26]]);fence([[-11,19],[-11,17.5],[-25,17.5]]);fence([[-8,-18],[-8,-30]]);fence([[8,-20],[8,-33]]);fence([[-50,14],[-50,-2]]);fence([[30,14.5],[50,14.5]]);
for(const q of[[-9.5,-14.5],[9.5,4],[6.5,18.5]])lamp(sc,C+q[0],C+q[1],8,11,0.5,[1,0.72,0.4]);
for(const s of[-1,1]){box(C+s*5.4,Y(s*5.4,9)+1.1,C+9.4,0.75,1.5,0.75,4,0.1);box(C+s*5.4,Y(s*5.4,17)+1.1,C+16.6,0.75,1.5,0.75,4,0.1);}
{const g=Y(6,-41);cap(C+6,g-0.3,C-41,C+6,g+5.4,C-41,0.3,5);box(C+7.2,g+4.6,C-41,1.5,0.5,0.2,34,0.04);box(C+4.9,g+3.4,C-41,1.4,0.5,0.2,34,0.04);}
for(const q of[[24,-15.5,0.5],[42,-17,1.2]]){const x=C+q[0],z=C+q[1],g=hAt(x,z);box(x,g+1.25,z,1.9,0.2,0.65,34,0.05,q[2]);for(const s of[-1,1])box(x+s*1.4*Math.cos(q[2]),g+0.5,z+s*1.4*Math.sin(q[2]),0.22,0.7,0.5,5,0.04,q[2]);}
for(const q of[[-17.5,-18],[-16,-19.8],[33,6.5],[-16.5,-45],[13,33],[11.5,31.6]])barrel(C+q[0],C+q[1],Y(q[0],q[1])-0.1,2.3);
for(const q of[[34.5,8,0.2],[-15,-32.5,0.5],[-13.5,34,0.1]]){const g=Y(q[0],q[1]);box(C+q[0],g+1.05,C+q[1],1.1,1.1,1.1,59,0.05,q[2]);}
for(const q of[[-46,34],[-44,31.5],[-47.5,30.8],[-28,45]]){const g=Y(q[0],q[1]);ell(C+q[0],g+1.1,C+q[1],1.7,1.25,1.25,83);}
for(const q of[[21.5,-17,1.5,3],[41.5,-31,1.5,5],[23,-37.5,1.3,7],[38,-20.5,1.6,2],[-52,-12,2,4],[52,-26,1.7,8]]){const g=Y(q[0],q[1]);crag(C+q[0],g+q[2]*0.3,C+q[1],q[2]*1.2,q[2],q[2]*1.1,3,q[3]);}
for(const q of[[-36,6,2],[-17,4.5,1.7],[35.5,-13,1.8],[18,8.5,1.6],[-10,-25,1.6],[10,-45,1.8],[-36,-27,2],[-18,45,1.8],[17,46,1.9],[44,20,1.9],[-52,40,2],[26,-50,1.7],[52,-40,1.8],[45,-52,1.7]]){const g=Y(q[0],q[1]);ell(C+q[0],g+q[2]*0.55,C+q[1],q[2]*1.15,q[2],q[2]*1.15,6);}
let k=1;for(const q of[[-49,-26,13,6],[-47,7,14,6.3],[-50,-48,12,5.6],[-36,-55,11,5.2],[50,-9,13,6],[48,7,12,5.6],[47,-24,12,5.4],[55,-47,11,5],[-53,24,13,6],[-15,52,12,5.5],[19,21,12,5.6],[22,51,12,5.4],[52,23,12,5.6],[-52,52,11,5.2]])tree2(C+q[0],C+q[1],q[2],q[3],k++);
const mx=C-38,mz=C+40,m0=hAt(mx,mz)-0.4,ay=m0+19.5,sz=mz-5.7;
cyl(mx,mz,m0-0.6,m0+2,5.5,5.3,4);cyl(mx,mz,m0+2,m0+20,5,3.4,123);cyl(mx,mz,m0+20,m0+25.5,4.3,0.4,113);cyl(mx,mz,m0+19.6,m0+20.4,4.2,4.2,111);
box(mx,m0+3.9,mz-5,1.8,3.7,0.5,117,0.03);box(mx,m0+4.1,mz-4.8,2.3,4.1,0.4,111,0.03);box(mx,m0+12.5,mz-4.1,1.1,1.3,0.45,116,0.03);box(mx,m0+12.5,mz-4,1.5,1.7,0.4,111,0.03);cap(mx,ay,mz-2.5,mx,ay,sz+0.3,0.55,111);
const cx=C+48,cz=C-44,cg=hAt(cx,cz)-0.1;box(cx,cg+0.9,cz,1.3,0.9,1.8,59,0.05);for(const s of[-1,1])box(cx,cg+0.9,cz+s*1.15,1.38,0.95,0.24,54,0.05);box(cx-1.38,cg+1.45,cz,0.2,0.34,0.34,54,0.04);box(cx,cg+1.72,cz,0.95,0.14,1.45,10,0);
const dx=C+40,dz=C+36,dg=hAt(dx,C+29);box(dx,dg+5.4,dz,5.6,5.6,3.3,98,0.1);box(dx,dg+11.3,dz-0.2,6.3,0.5,3.6,4,0.08);for(const s of[-1,1])pillar(dx+s*4.9,dz-3.9,dg-0.4,9.6);
box(dx,dg+4.2,dz-3.45,2.7,4.2,0.4,36,0.02);box(dx,dg+9.3,dz-3.5,2.2,0.3,0.4,31,0.02);LT.push([dx,dg+9.3,dz-5,0.7,0.35,0.9,0.8]);
G.dyn=[{cx:mx,cy:ay,cz:sz,ax:2,sp:0.5,amp:0,bb:[mx-15,mx+15,ay-15,ay+15,sz-1.6,sz+1.6],fn:()=>{for(let q=0;q<4;q++){const a=q*1.5708+0.3,c=Math.cos(a),s=Math.sin(a);alimb([mx,ay,sz],[mx+12.6*c,ay+12.6*s,sz],0.36,0.32,111,X1);alimb([mx+3.2*c-1.75*s,ay+3.2*s+1.75*c,sz+0.1],[mx+12*c-1.75*s,ay+12*s+1.75*c,sz+0.1],0.3,1.5,122,X1);}ball(mx,ay,sz,1.05,111);}},
{cx:cx+1.35,cy:cg+1.8,cz:cz,ax:2,sp:0,amp:0,bb:[cx-2.2,cx+2.4,cg+1.3,cg+3.6,cz-2.6,cz+2.6],fn:()=>{box(cx,cg+2.25,cz,1.22,0.36,1.72,59,0.12);for(const s of[-1,1])box(cx,cg+2.25,cz+s*1.15,1.3,0.42,0.24,54,0.12);box(cx-1.4,cg+2.05,cz,0.2,0.26,0.34,54,0.04);}},
{cx:dx-2.6,cy:dg+4.2,cz:dz-4.1,ax:1,sp:0,amp:0,bb:[dx-3.4,dx+3.4,dg-0.6,dg+9,dz-5,dz-3.2],fn:()=>{box(dx,dg+4.1,dz-4.1,2.55,4.1,0.3,117,0.04);for(const h of[1.6,4.1,6.6])box(dx,dg+h,dz-4.3,2.6,0.32,0.3,56,0.03);box(dx+1.7,dg+4.1,dz-4.55,0.3,0.5,0.2,54,0.04);}}];
this.birds=[8,36,-12,4];
this.blockers=[[cx-1.9,cx+1.9,cz-2.4,cz+2.4],[dx-3.2,dx+3.2,dz-5.6,dz-3]];
this.poi={start:[0,-46],elder:[5,-10.5],merchant:[9.8,-21],girl:[12,7],guard:[-10.5,-43],chest:[48,-44,cg+1-G0],door:[40,31.6,dg+4-G0],mill:[-38,40]};
}});

SCENES.push({name:'Underhall',ry0:0,focus:[0,5,0],bg:[10,13,24],LD:[-0.4,0.75,-0.52],amb:[0.31,0.35,0.5],sun:[0.66,0.72,0.95],level:null,pv:[0.04,0.5,0.03],pcol:[120,255,226],pn:26,tile:[[98,104,116],[84,90,104],[40,44,58]],
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
this.birds=null;}});

function baseOld(m,x,y,z){const X=Math.floor(x),Y=Math.floor(y),Z=Math.floor(z),v=h3(X,Y+200,Z);let c;
switch(m){
case 1:{const p=n2(x*0.11+50,z*0.11);c=p<0.4?[44,96,52]:p<0.7?[58,112,50]:[76,126,52];break;}
case 41:{const p=n2(x*0.11+50,z*0.11);c=p<0.5?[34,84,64]:[46,100,62];break;}
case 15:c=v<0.5?[70,128,54]:[98,150,60];break;
case 2:c=[92,70,52];break;
case 3:{const q=0.85+0.3*n3(x*0.2,y*0.6,z*0.2);c=[84*q,88*q,104*q];break;}
case 35:c=[50,58,76];break;
case 4:{const yy=y/2.4,row=Math.floor(yy),f=yy-row,q=X+Z+row*3;c=(f<0.2||((q%5)+5)%5===0)?[86,84,92]:v<0.5?[128,124,128]:[146,142,144];break;}
case 5:c=[94,62,42];break;
case 34:c=((X+Z)%3===0)?[120,88,58]:[156,116,78];break;
case 38:c=(Y%2===0)?[112,84,58]:[142,110,74];break;
case 6:c=v<0.2?[128,170,66]:v<0.55?[66,128,54]:[38,92,50];break;
case 27:c=v<0.3?[120,176,70]:v<0.7?[70,146,62]:[44,110,56];break;
case 28:c=v<0.3?[92,150,96]:[58,120,82];break;
case 7:c=S.name==='Lighthouse rock'?[30,84,130]:S.name==='Desert oasis'?[40,150,160]:S.name==='Shipwreck cove'?[34,120,140]:[26,78,96];break;
case 33:c=[226,238,244];break;
case 8:c=v<0.4?[240,236,250]:v<0.7?[190,150,240]:[250,214,110];break;
case 13:c=[140,132,120];break;
case 14:c=[112,150,70];break;
case 16:c=[96,168,84];break;
case 18:c=v<0.5?[70,110,56]:[88,128,60];break;
case 20:c=Math.sin((x+z*0.6)*0.9+4*n2(x*0.1,z*0.1))>0.55?[206,170,112]:[226,192,132];break;
case 21:{const q=((Math.floor((y+2*n2(x*0.05,z*0.05))/2.2)%4)+4)%4;c=[[196,128,84],[216,152,98],[176,108,74],[228,172,112]][q];break;}
case 40:c=[226,198,152];break;
case 22:c=[226,220,206];break;
case 39:c=(((Math.floor((y-G.lby-1)/5.8)%2)+2)%2===0)?[230,226,214]:[186,60,50];break;
case 23:c=[176,58,48];break;
case 24:c=[66,72,96];break;
case 25:c=(Y%2===0)?[176,96,64]:[150,78,54];break;
case 26:c=(((Math.floor(Math.atan2(z-G.tcz,x-G.tcx)*2.55)%2)+2)%2===0)?[232,220,196]:[190,84,60];break;
case 29:c=n3(x*0.5,y*0.5,z*0.5)>0.66?[244,232,206]:[200,66,58];break;
case 37:c=v<0.5?[112,76,168]:[132,94,188];break;
case 30:c=[226,214,190];break;
case 32:c=[62,54,56];break;
case 36:c=[26,30,52];break;
case 42:c=v<0.5?[40,96,70]:[54,116,78];break;
case 43:c=[196,150,96];break;
case 45:c=[150,140,80];break;
case 46:c=[198,162,108];break;
case 47:c=v<0.5?[224,142,72]:[236,170,96];break;
case 48:c=v<0.4?[44,112,96]:[30,88,84];break;
case 50:c=v<0.06?[250,252,255]:[222,232,244];break;
case 51:c=v<0.3?[176,216,240]:[146,196,230];break;
case 64:c=[104,150,196];break;
case 52:c=v<0.4?[44,96,78]:[30,74,66];break;
case 53:c=[178,52,44];break;
case 54:c=v<0.3?[232,190,96]:[206,160,72];break;
case 55:c=v<0.4?[96,164,140]:[74,138,124];break;
case 56:c=[62,64,80];break;
case 57:c=[216,206,182];break;
case 58:c=[176,154,112];break;
case 59:c=((X+Y)%3===0)?[70,48,38]:[98,66,46];break;
case 62:c=[232,122,112];break;
case 63:c=v<0.3?[236,170,70]:v<0.7?[214,120,56]:[168,76,48];break;
case 67:c=v<0.25?[128,170,66]:v<0.6?[66,128,54]:[40,96,50];break;
case 70:c=n3(x*0.18,y*0.18,z*0.18)>0.68?[150,98,62]:((X%5===0)||(Y%6===0))?[124,130,130]:[198,200,192];break;
case 71:c=n3(x*0.18,y*0.18,z*0.18)>0.62?[142,82,52]:[210,120,58];break;
case 66:c=v<0.5?[240,120,150]:[230,70,80];break;
default:c=[255,220,140];}
const k=0.93+0.14*h3(X,Y,Z+300);return[c[0]*k,c[1]*k,c[2]*k];}

const LEAF={6:1,27:1,48:1,63:1,52:1,67:1},GRASS={1:1,41:1},METAL={110:1,112:1,113:1,114:1,117:1,123:1,70:1,71:1,56:1,73:1,54:1,55:1,72:1,75:1,39:1,22:1,23:1,24:1,25:1,4:1,34:1,82:1,85:1,88:1,90:1,93:1,95:1,43:1,96:1,98:1,99:1,3:1,5:1,40:1,21:1,53:1,59:1},WRAP={6:1,18:1,15:1,14:1,8:1,27:1,28:1,16:1,42:1,45:1,48:1,52:1,63:1,66:1,67:1},
EMI={10:[255,232,150],11:[255,176,84],31:[110,240,220],61:[170,220,255],65:[255,96,64],68:[120,255,170],89:[255,248,214]};
function base(m,x,y,z,edge){const v=h3(Math.floor(x*2),Math.floor(y*2)+200,Math.floor(z*2));
switch(m){
case 110:{const k=0.92+0.1*n3(x*0.4,y*0.4,z*0.4);return edge?[252*k,242*k,216*k]:[238*k,224*k,192*k];}
case 111:return v<0.5?[94,64,46]:[82,56,42];
case 112:{const r=((Math.floor(y*1.6)%2)+2)%2,k=0.84+0.28*h3(Math.floor(x*1.3+z*1.3),Math.floor(y*1.6),7);return edge?[240,138,92]:r?[208*k,94*k,62*k]:[184*k,76*k,54*k];}
case 113:{const r=((Math.floor(y*1.6)%2)+2)%2,k=0.84+0.28*h3(Math.floor(x*1.3+z*1.3),Math.floor(y*1.6),7);return edge?[132,166,204]:r?[84,116,158]:[70*k,98*k,140*k];}
case 114:{const r=((Math.floor(y*1.6)%2)+2)%2,k=0.84+0.28*h3(Math.floor(x*1.3+z*1.3),Math.floor(y*1.6),7);return edge?[120,190,160]:r?[66*k,134*k,116*k]:[54*k,112*k,100*k];}
case 115:{const a=x/1.5+0.3*Math.sin(z*1.3),b=z/1.5+0.3*Math.sin(x*1.1),ca=Math.floor(a),cb=Math.floor(b),hs=h3(ca,3,cb);if(a-ca<0.16||b-cb<0.16)return[118,108,98];const k=0.86+0.26*h3(ca,5,cb);return hs<0.33?[184*k,172*k,152*k]:hs<0.66?[164*k,156*k,146*k]:[196*k,180*k,152*k];}
case 116:return v<0.3?[168,214,230]:[72,116,160];
case 117:{const f=(x+z)*1.1;return(f-Math.floor(f)<0.2)?[88,56,38]:edge?[176,120,74]:[152,100,60];}
case 119:return(((Math.floor((x+z)*0.6)%2)+2)%2)?[214,72,60]:[242,234,216];
case 120:{const k=0.9+0.2*n2(x*0.5,z*0.5);return v<0.08?[150*k,128*k,96*k]:[190*k,162*k,118*k];}
case 121:return(((Math.floor(x*0.8)%2)+2)%2)?[112,82,58]:[88,64,46];
case 122:{const a=x-Math.floor(x),b=y-Math.floor(y);return(a<0.22||b<0.22)?[150,116,78]:[236,226,198];}
case 123:{const k=0.94+0.08*n3(x*0.3,y*0.3,z*0.3),st=n3(x*1.2,y*0.12,z*1.2)>0.66;return st?[204*k,196*k,178*k]:edge?[252,250,240]:[234*k,230*k,216*k];}

case 56:return edge?[92,96,108]:v<0.5?[52,56,66]:[60,64,74];
case 70:{const r2=n3(x*0.22,y*0.22,z*0.22),g2=n3(x*1.1,y*1.1,z*1.1);return r2>0.66?(g2>0.5?[156,98,58]:[128,76,48]):edge?[226,228,222]:r2>0.6?[176,150,120]:[188+10*g2,192+10*g2,186+10*g2];}
case 71:{const r2=n3(x*0.22+7,y*0.22,z*0.22);return r2>0.64?[136,78,48]:edge?[236,170,110]:[214,118,52];}
case 72:return[58,62,66];
case 73:return edge?[196,200,206]:[138,144,154];
case 75:return v<0.5?[44,38,38]:[74,52,40];
case 5:{const q=0.75+0.5*n3(x*1.6,y*0.25,z*1.6);return[98*q,66*q,44*q];}
case 1:{const p=n2(x*0.11+50,z*0.11);return p<0.4?[34,66,40]:p<0.7?[42,78,40]:[54,88,42];}
case 82:{const q=((Math.floor((y+1.2*n2(x*0.12,z*0.12))/2)%3)+3)%3,k=0.82+0.36*n3(x*0.5,y*1.4,z*0.5),c=[[104,106,120],[88,90,106],[118,114,120]][q];return edge?[c[0]*k*1.25,c[1]*k*1.25,c[2]*k*1.22]:[c[0]*k,c[1]*k,c[2]*k];}
case 83:return v<0.5?[196,168,76]:[168,150,96];
case 85:return edge?[70,118,104]:[44,84,74];
case 86:return v<0.5?[182,156,108]:[158,132,90];
case 87:return((Math.floor(x*3)+Math.floor(y*3)+Math.floor(z*3))%2===0)?[132,120,100]:[84,78,72];
case 88:return edge?[96,140,190]:(y<G0+0.9?[150,60,52]:[56,100,156]);
case 90:{const a=Math.atan2(z-G.lz,x-G.lx)*8/6.2832;return(a-Math.floor(a)<0.13||edge)?[122,38,34]:[190,62,52];}
case 39:{const band=(((Math.floor((y-G.lby-1.4)/5.72)%2)+2)%2===0),st=n3(x*1.3,y*0.14,z*1.3)>0.62,c=band?[232,228,216]:[190,60,50];return st?[c[0]*0.82,c[1]*0.76,c[2]*0.7]:edge?[c[0]*1.06,c[1]*1.06,c[2]*1.06]:c;}
case 7:if(S.shallow){const dp=S.level-HT[mi(x,z)],f=dp<1?0:dp>5?1:(dp-1)/4,w=S.wc||[[58,146,160],[28,76,126]];return[w[0][0]+(w[1][0]-w[0][0])*f,w[0][1]+(w[1][1]-w[0][1])*f,w[0][2]+(w[1][2]-w[0][2])*f];}break;
case 40:{const k=0.86+0.2*n3(x*0.6,y*0.6,z*0.6);return edge?[236*k,208*k,164*k]:[212*k,182*k,138*k];}
case 94:{const q=((Math.floor((x+z)*1.4)%4)+4)%4;return q===0?[180,58,48]:q===1?[228,202,150]:q===2?[52,96,150]:[214,160,70];}
case 95:{const fx=x/1.7-Math.floor(x/1.7),fz=z/1.7-Math.floor(z/1.7);return(fx<0.1||fz<0.1)?[150,124,92]:((Math.floor(x/1.7)+Math.floor(z/1.7))%2===0)?[226,200,154]:[206,178,134];}
case 96:return edge?[240,168,116]:(v<0.5?[198,114,70]:[182,100,62]);
case 97:{const T=S.tile||[[112,108,112],[96,92,98],[60,58,64]],fx=x/3-Math.floor(x/3),fz=z/3-Math.floor(z/3);if(fx<0.13||fz<0.13)return T[2];const hs=h3(Math.floor(x/3),7,Math.floor(z/3)),k=0.88+0.24*hs,c=hs<0.5?T[0]:T[1];return[c[0]*k,c[1]*k,c[2]*k];}
case 98:{const k=(0.84+0.3*n3(x*0.5,y*0.5,z*0.5))*(edge?1.18:1);return[124*k,128*k,120*k];}
case 99:{if(Math.abs(n3(x*0.45,y*0.45,z*0.45)-0.5)<0.03)return[44,48,58];const k=(0.8+0.4*n3(x*0.25,y*0.6,z*0.25))*(edge?1.2:1);return[108*k,112*k,126*k];}
case 100:return v<0.5?[112,72,164]:[98,62,148];
case 101:return v<0.5?[58,112,72]:[50,98,64];
case 102:return[238,194,156];
case 103:return v<0.5?[184,100,54]:[168,88,46];
case 93:{const q=n3(x*0.5,y*0.2,z*0.5);return(y*0.8-Math.floor(y*0.8)<0.15)?[56,40,32]:edge?[150,112,80]:n3(x*0.2+4,y*0.2,z*0.2)>0.64?[124,112,102]:q<0.5?[106,72,50]:[90,60,42];}
case 41:{const p=n2(x*0.11+50,z*0.11);return p<0.5?[26,62,50]:[34,74,50];}
}
const c=baseOld(m,x,y,z);if(edge){const e=(m===54||m===55)?1.25:1.14;c[0]=Math.min(255,c[0]*e);c[1]=Math.min(255,c[1]*e);c[2]=Math.min(255,c[2]*e);}return c;}
// A scene the game brings itself arrives as { src, data }: src is the text of a function (tools, data) => scene.
if(SI&&typeof SI==='object'){const TOOLS={C,G0,NU,HU,RS,HT,DRm,h3,n2,n3,sm,hAt,mi,prim,sdBox,ball,cap,ell,cyl,box,abox,steps,ring,crag,pillar,torch,carve,barrel,column,lamp,get G(){return G;}};S=(0,eval)('('+SI.src+')')(TOOLS,SI.data);}
else S=SCENES[SI];
if(!S)throw new Error('no such scene');LD=S.LD;S.lights=[];S.emit=null;S.birds=S.beam=S.waves=S.beamShaft=null;G={};
progress('Shaping the ground');
if(S.init)S.init();
for(let z=0;z<N;z++)for(let x=0;x<N;x++){const i=z*N+x,X=(x+0.5)/RS,Z=(z+0.5)/RS;DRm[i]=S.foot(X,Z);HT[i]=S.h(X,Z);YB[i]=S.bot(X,Z);}
const HMX=new Float32Array(NN),HMN=new Float32Array(NN);{const tx=new Float32Array(NN),tn=new Float32Array(NN);
for(let z=0;z<N;z++)for(let x=0;x<N;x++){let a=-1e9,b=1e9;for(let k=-2;k<=2;k++){const X=x+k<0?0:x+k>=N?N-1:x+k,v=HT[z*N+X];if(v>a)a=v;if(v<b)b=v;}tx[z*N+x]=a;tn[z*N+x]=b;}
for(let z=0;z<N;z++)for(let x=0;x<N;x++){let a=-1e9,b=1e9;for(let k=-2;k<=2;k++){const Z=z+k<0?0:z+k>=N?N-1:z+k;if(tx[Z*N+x]>a)a=tx[Z*N+x];if(tn[Z*N+x]<b)b=tn[Z*N+x];}HMX[z*N+x]=a;HMN[z*N+x]=b;}}
for(let y=0;y<H;y++){const fy=(y+0.5)/RS;for(let j=0;j<NN;j++){let dh=fy-HT[j];
if(dh>0?fy<HMX[j]:fy>HMN[j]){const x=j%N,z=(j/N)|0,air=dh>0;let m=air?dh:-dh;for(let dz=-2;dz<=2;dz++){const Z=z+dz;if(Z<0||Z>=N)continue;for(let dx=-2;dx<=2;dx++){const X=x+dx;if(X<0||X>=N||(!dx&&!dz))continue;const hk=HT[Z*N+X];if(air?hk>fy:hk<fy){const q=(Math.hypot(dx,dz)-0.5)/RS;if(q<m)m=q;}}}dh=air?m:-m;}
const d=Math.max(dh,YB[j]-fy,DRm[j])*0.8;if(d<4){const i=y*NN+j;D[i]=d;MT[i]=1;}}}
if(S.level!=null){const L=S.level;prim(8,NU-8,L-34,L+1,8,NU-8,7,(x,y,z)=>{const j=mi(x,z);return Math.max(y-L,DRm[j]+0.2,YB[j]+0.6-y);});}
progress('Building the scene');
S.build();
let WK=null;
if(S.walk){progress('Mapping the paths');const B0=new Uint8Array(NU*NU),BL=new Uint8Array(NU*NU),SH=new Uint8Array(NU*NU),GH=new Float32Array(NN);
for(let j=0;j<NN;j++)GH[j]=DRm[j]>0?-999:HT[j]-G0;
for(let z=0;z<NU;z++)for(let x=0;x<NU;x++){const X=x+0.5,Z=z+0.5,j=mi(X,Z),g=HT[j];let b=0;
if(DRm[j]>-3.2)b=1;else if(S.level!=null&&g<S.level-0.1)b=1;
else{const gx=HT[mi(X+1,Z)]-HT[mi(X-1,Z)],gz=HT[mi(X,Z+1)]-HT[mi(X,Z-1)];if(Math.abs(gx)>2.4||Math.abs(gz)>2.4)b=1;
else for(const q of[[0,0],[-0.3,-0.3],[0.3,-0.3],[-0.3,0.3],[0.3,0.3]]){if(Dg(X+q[0],g+1.5,Z+q[1])<0.3||Dg(X+q[0],g+3.2,Z+q[1])<0.3){b=1;break;}}}
B0[z*NU+x]=b;SH[z*NU+x]=Math.round(255*shadow(X,g+3.2,Z,0,1,0));}
if(S.blockers)for(const q of S.blockers)for(let z=Math.floor(q[2]);z<=Math.floor(q[3]);z++)for(let x=Math.floor(q[0]);x<=Math.floor(q[1]);x++)B0[mu(x,z)]=1;
for(let z=0;z<NU;z++)for(let x=0;x<NU;x++){let b=B0[z*NU+x];if(!b)for(let dz=-1;dz<=1&&!b;dz++)for(let dx=-1;dx<=1;dx++){const X=x+dx,Z=z+dz;if(X<0||Z<0||X>=NU||Z>=NU||B0[Z*NU+X]){b=1;break;}}BL[z*NU+x]=b;}
WK={BL,B0,SH,GH,NU,N,RS,C,G0,poi:S.poi};}
progress('Placing splats');
const CAP=1500000;let F=new Float32Array(CAP*6),NB=new Int8Array(CAP*4),CB=new Uint8Array(CAP*4),n=0;
function put(x,y,z,nx,ny,nz,su,sv,rot,r,g,b,flag,sway){if(n>=CAP)return;const i=n*6,j=n*4;F[i]=x-C;F[i+1]=y-G0;F[i+2]=z-C;F[i+3]=su;F[i+4]=sv;F[i+5]=rot;NB[j]=nx*127;NB[j+1]=ny*127;NB[j+2]=nz*127;NB[j+3]=sway;CB[j]=r>255?255:r;CB[j+1]=g>255?255:g;CB[j+2]=b>255?255:b;CB[j+3]=flag;n++;}
const amb=S.amb,sun=S.sun,lights=S.lights;
function shadow(sx,sy,sz,nx,ny,nz){let res=1,tt=0.8;for(let s=0;s<64;s++){const qx=sx+nx*0.7+LD[0]*tt,qy=sy+ny*0.7+LD[1]*tt,qz=sz+nz*0.7+LD[2]*tt;if(qy>=HU||qx<0||qz<0||qx>=NU||qz>=NU)break;const dd=Dg(qx,qy,qz);if(dd<0.1){res=LEAF[Mg(qx,qy,qz)]?0.4:0;break;}if(dd<3.5)res=Math.min(res,8*dd/tt);tt+=Math.max(dd,0.45);}return 0.22+0.78*Math.max(0,res);}
function lit(b,dif,sh,ao,x,y,z){let lr=0,lg2=0,lb=0;for(const q of lights){const dx=q[0]-x,dy=q[1]-y,dz=q[2]-z,dd=dx*dx+dy*dy+dz*dz;if(dd<1400){const w=q[3]/(1+dd/18);lr+=w*q[4];lg2+=w*q[5];lb+=w*q[6];}}const d=dif*sh;return[b[0]*(amb[0]*ao+sun[0]*d+lr)+24*lr,b[1]*(amb[1]*ao+sun[1]*d+lg2)+24*lg2,b[2]*(amb[2]*ao+sun[2]*d+lb)+24*lb];}
function flower(x,y,z,sh,stem,warm){const t=rnd(),pc=warm?(t<0.5?[244,128,160]:[232,76,84]):t<0.3?[244,240,250]:t<0.5?[244,128,160]:t<0.68?[232,76,84]:t<0.84?[196,156,244]:[252,214,104],cl=lit(pc,0.85,sh,1,x,y,z),cc=lit([250,200,70],0.85,sh,1,x,y,z),a0=rnd()*6.28,s=0.2+rnd()*0.1;
if(stem){const cb=lit([70,120,52],0.8,sh,0.9,x,y,z);put(x,y-0.45,z,0.2,0.9,0.1,0.07,0.45,0,cb[0],cb[1],cb[2],2,90);}
for(let k=0;k<5;k++){const a=a0+k*1.257;put(x+Math.cos(a)*s*1.1,y+0.02,z+Math.sin(a)*s*1.1,Math.cos(a)*0.35,0.9,Math.sin(a)*0.35,s,s*0.75,a,cl[0],cl[1],cl[2],4,stem?90:40);}
put(x,y+0.06,z,0,1,0,s*0.5,s*0.5,0,cc[0],cc[1],cc[2],4,stem?90:40);}
const seeds=[];let cells=0;
function extract(gid,bb){const X0=bb?Math.max(1,Math.floor(bb[0]*RS)):1,X1=bb?Math.min(N-2,Math.ceil(bb[1]*RS)):N-2,Y0=bb?Math.max(1,Math.floor(bb[2]*RS)):1,Y1=bb?Math.min(H-2,Math.ceil(bb[3]*RS)):H-2,Z0=bb?Math.max(1,Math.floor(bb[4]*RS)):1,Z1=bb?Math.min(N-2,Math.ceil(bb[5]*RS)):N-2;
for(let y=Y0;y<=Y1;y++){for(let z=Z0;z<=Z1;z++)for(let x=X0;x<=X1;x++){const i=(y*N+z)*N+x,d=D[i];if(d>0.36||d<-0.36)continue;
let nx=D[i+1]-D[i-1],ny=D[i+NN]-D[i-NN],nz=D[i+N]-D[i-N];const l=Math.hypot(nx,ny,nz);if(l<1e-5)continue;nx/=l;ny/=l;nz/=l;
const sx=(x+0.5)/RS-nx*d,sy=(y+0.5)/RS-ny*d,sz=(z+0.5)/RS-nz*d;if(ny<-0.25&&sy<G0-7)continue;
const j=mi(sx,sz),hv=h3(x,y+900,z),hw=h3(x+77,y,z+31);let mm=MT[i];
if(mm===1)mm=(ny>0.35&&sy>HT[j]-1)?S.top(sx,sy,sz,j,hv,ny):S.side(sx,sy,sz,j,hv);
if(S.fix)mm=S.fix(mm,sx,sy,sz,nx,ny,nz,hv,j);
cells++;const sh=shadow(sx,sy,sz,nx,ny,nz),ao0=Math.max(0.2,Math.min(1,0.2+0.8*Math.min(Dg(sx+nx*0.8,sy+ny*0.8,sz+nz*0.8)/0.8,Dg(sx+nx*2.5,sy+ny*2.5,sz+nz*2.5)/2.5))),ao=ao0*(0.72+0.28*ny),gs=gid?-gid:(S.swm?(S.swm[mm]|0):0);
const dif=nx*LD[0]+ny*LD[1]+nz*LD[2],metal=METAL[mm]===1;
if(S.vines&&(mm===70||mm===71||mm===56||mm===72||mm===73||mm===75)&&(cells%23===0))seeds.push([sx,sy,sz]);
const em=EMI[mm];if(em){put(sx,sy,sz,nx,ny,nz,0.42,0.42,0,em[0],em[1],em[2],1,gs);continue;}
if(LEAF[mm]){const wd=0.5+0.5*dif,big=mm===27?1.25:1;for(let q=0;q<2;q++){const a=rnd(),b2=rnd(),c2=rnd(),o=rnd()*0.45,jx=nx+(a-0.5)*1.3,jy=ny+(b2-0.5)*1.3,jz=nz+(c2-0.5)*1.3,jl=Math.hypot(jx,jy,jz)||1,cl=lit(base(mm,sx+a*3,sy+b2*3,sz+c2*3),wd,sh,ao0*(0.55+o),sx,sy,sz);
put(sx+nx*o+(a-0.5)*0.4,sy+ny*o+(b2-0.5)*0.4,sz+nz*o+(c2-0.5)*0.4,jx/jl,jy/jl,jz/jl,(0.26+rnd()*0.16)*big,(0.4+rnd()*0.26)*big,rnd()*6.28,cl[0],cl[1],cl[2],4,gid?gs:50+rnd()*77);}continue;}
if(mm===18){const wd=0.5+0.5*dif;for(let q=0;q<2;q++){const cl=lit(base(18,sx+q,sy,sz),wd,sh,ao,sx,sy,sz),o=rnd()*0.22;put(sx+nx*o+(rnd()-0.5)*0.3,sy+ny*o+(rnd()-0.5)*0.3,sz+nz*o+(rnd()-0.5)*0.3,nx,ny,nz,0.3,0.3,0,cl[0],cl[1],cl[2],0,gs);}
if(S.scatter&&!gid)S.scatter(mm,sx,sy,sz,hv,(X,Y,Z,m2)=>sc(X,Y,Z,m2,sh,hw),ny);continue;}
if(mm===7){const wb=base(7,sx,sy,sz);if(ny<0.5){const cl=lit([wb[0]*0.8,wb[1]*0.75,wb[2]*0.8],Math.max(0,dif),sh,ao,sx,sy,sz);put(sx,sy,sz,nx,ny,nz,0.42,0.42,0,cl[0],cl[1],cl[2],0,0);continue;}
const cl=lit(wb,0,sh,1,sx,sy,sz),f=sun[1]*0.5*sh;put(sx,sy,sz,0,1,0,0.45,0.45,0,cl[0]*0.9+wb[0]*f,cl[1]*0.9+wb[1]*f,cl[2]*0.9+wb[2]*f,3,0);continue;}
const edge=metal&&Dg(sx-nx*1.0,sy-ny*1.0,sz-nz*1.0)>-0.7,grass=GRASS[mm]===1,cl=lit(base(mm,sx,sy,sz,edge),WRAP[mm]?0.5+0.5*dif:Math.max(0,dif),sh,ao,sx,sy,sz);
let tx=nz,tz=-nx;const tl=Math.hypot(tx,tz);if(tl<0.05){tx=1;tz=0;}else{tx/=tl;tz/=tl;}const o=0.13,ux=(tx+ny*tz)*o,uy=(nz*tx-nx*tz)*o,uz=(tz-ny*tx)*o,k1=0.94+0.12*hv,k2=0.94+0.12*hw;
if(mm===16){put(sx,sy+0.12,sz,0,1,0,0.75,0.6,rnd()*6.28,cl[0],cl[1],cl[2],0,0);if(hw<0.25)flower(sx,sy+0.3,sz,sh);continue;}
put(sx+ux,sy+uy,sz+uz,nx,ny,nz,0.4,0.4,0,cl[0]*k1,cl[1]*k1,cl[2]*k1,0,gs);put(sx-ux,sy-uy,sz-uz,nx,ny,nz,0.4,0.4,0,cl[0]*k2,cl[1]*k2,cl[2]*k2,0,gs);
if(gid)continue;
if(grass){const dk=mm===41;for(let q=0;q<2;q++){const hh=(0.35+rnd()*0.6+(hv<0.08?0.5:0))*(S.gk||1),t=rnd(),bc=dk?(t<0.4?[70,136,84]:[48,108,72]):(t<0.3?[110,160,62]:t<0.7?[78,132,54]:[56,108,50]),cb=lit(bc,0.8,sh,0.9,sx,sy,sz);put(sx+(rnd()-0.5)*0.5,sy+hh,sz+(rnd()-0.5)*0.5,(rnd()-0.5)*0.7,0.9,(rnd()-0.5)*0.7,0.1,hh,0,cb[0],cb[1],cb[2],2,60+rnd()*67);}}
if(S.scatter)S.scatter(mm,sx,sy,sz,hv,(X,Y,Z,m2)=>sc(X,Y,Z,m2,sh,hw),ny);
}if(!gid&&y%40===0)progress('Placing splats '+Math.round(y/H*100)+'%');}}
function sc(X,Y,Z,m2,sh,hw){
if(m2===15)return;
if(m2===8||m2===66){if(hw<0.55)flower(X,Y,Z,sh,true,m2===66);return;}
if(m2===14||m2===45){if(hw>0.7)return;const cb=lit(m2===14?[112,150,70]:[156,144,84],0.8,sh,1,X,Y,Z);put(X+(rnd()-0.5)*0.3,Y,Z+(rnd()-0.5)*0.3,(rnd()-0.5)*0.4,0.9,(rnd()-0.5)*0.4,0.09,0.42,0,cb[0],cb[1],cb[2],2,m2===14?80:50);return;}
const em=EMI[m2];if(em){put(X,Y,Z,0,1,0,0.2,0.2,0,em[0],em[1],em[2],1,0);return;}
if(m2===6||m2===18){const cl=lit(base(m2,X,Y*3,Z),0.7,sh,0.85,X,Y,Z),jx=rnd()-0.5,jz=rnd()-0.5;put(X+jx*0.3,Y,Z+jz*0.3,jx,0.5,jz,0.24,0.4,rnd()*6.28,cl[0],cl[1],cl[2],4,100);return;}
const cl=lit(base(m2,X,Y,Z),0.8,sh,1,X,Y,Z);put(X,Y,Z,0,1,0,0.24,0.24,0,cl[0],cl[1],cl[2],0,0);}
extract(0);
const groups=[];
if(G.dyn)G.dyn.forEach((d,k)=>{progress('Building moving parts');D.fill(4);MT.fill(0);d.fn();extract(k+1,d.bb);groups.push([d.cx-C,d.cy-G0,d.cz-C,d.ax,d.sp,d.amp||0]);});
if(S.vines&&!G.dyn){progress('Growing vines');
const grad=(x,y,z)=>{const gx=Dg(x+0.5,y,z)-Dg(x-0.5,y,z),gy=Dg(x,y+0.5,z)-Dg(x,y-0.5,z),gz=Dg(x,y,z+0.5)-Dg(x,y,z-0.5),l=Math.hypot(gx,gy,gz)||1;return[gx/l,gy/l,gz/l];};
const vine=(s,up,steps,thick)=>{let px=s[0],py=s[1],pz=s[2],dx=rnd()-0.5,dy=up*0.6,dz=rnd()-0.5,hang=false,nx=0,ny=1,nz=0,sh=1;
for(let k=0;k<steps;k++){
if(!hang){const g=grad(px,py,pz),dt=dx*g[0]+dy*g[1]+dz*g[2];dx-=g[0]*dt;dy-=g[1]*dt;dz-=g[2]*dt;dy+=up*0.22;dx+=(rnd()-0.5)*0.5;dz+=(rnd()-0.5)*0.5;const l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;px+=dx*0.38;py+=dy*0.38;pz+=dz*0.38;
const d2=Dg(px,py,pz);if(d2>1.3){if(up>0)break;hang=true;continue;}const g2=grad(px,py,pz);px-=g2[0]*(d2-0.14);py-=g2[1]*(d2-0.14);pz-=g2[2]*(d2-0.14);nx=g2[0];ny=g2[1];nz=g2[2];if(py<G.gy-1)break;}
else{py-=0.38;px+=(rnd()-0.5)*0.08;pz+=(rnd()-0.5)*0.08;nx=rnd()-0.5;ny=0.3;nz=rnd()-0.5;const l=Math.hypot(nx,ny,nz);nx/=l;ny/=l;nz/=l;if(Dg(px,py,pz)<0.15)break;}
if(k%6===0)sh=shadow(px,py,pz,nx,ny,nz);
const st=lit(thick?[84,62,42]:[52,92,44],0.6,sh,0.8,px,py,pz),sw=hang?30+k:0;put(px,py,pz,nx,ny,nz,thick?0.24:0.15,thick?0.34:0.26,rnd()*3,st[0],st[1],st[2],0,sw>127?127:sw);
if(k%2===0||hang){const t=rnd(),bc=t<0.25?[140,184,70]:t<0.6?[84,146,58]:[52,112,52],cl=lit(bc,0.75,sh,0.9,px,py,pz),jx=nx+(rnd()-0.5)*0.9,jy=ny+(rnd()-0.5)*0.9,jz=nz+(rnd()-0.5)*0.9,jl=Math.hypot(jx,jy,jz)||1;
put(px+nx*0.14+(rnd()-0.5)*0.5,py+ny*0.14+(rnd()-0.5)*0.5,pz+nz*0.14+(rnd()-0.5)*0.5,jx/jl,jy/jl,jz/jl,0.24+rnd()*0.14,0.36+rnd()*0.22,rnd()*6.28,cl[0],cl[1],cl[2],4,hang?100:40+rnd()*40);}
if(rnd()<0.03)flower(px+nx*0.3,py+ny*0.3,pz+nz*0.3,sh);}};
const lo=seeds.filter(q=>q[1]<G.gy+9),hi=seeds.filter(q=>q[1]>G.gy+16);
for(let i=0;i<190&&lo.length;i++)vine(lo[Math.floor(rnd()*lo.length)],1,60+Math.floor(rnd()*120),i<34);
for(let i=0;i<130&&hi.length;i++)vine(hi[Math.floor(rnd()*hi.length)],-1,60+Math.floor(rnd()*110),false);}
progress('Finishing');
const un=c=>[c&255,(c>>8)&255,(c>>16)&255];
if(S.emit)for(const e of S.emit){const c1=un(e[4]);for(let k=0;k<12;k++)put(e[0]+C,e[1]+G0,e[2]+C,0,1,0,0.95,0.95,k/12,c1[0],c1[1],c1[2],8,0);}
if(S.birds){const b=S.birds;for(let q=0;q<b[3];q++)for(const w of[-1,0,1])put(b[0]+C,b[1]+G0+q*1.5,b[2]+C,w,0,0,9+q*3.5,w?0.34:0.46,(q+0.5)/b[3],w?216:244,w?208:240,w?208:240,9,0);}
const AC=900,AF=new Float32Array(AC*6),ANB=new Int8Array(AC*4),ACB=new Uint8Array(AC*4);let an=0;
const addA=(x,y,z,nx,ny,nz,su,sv,r,g,b,flag,sway)=>{if(an>=AC)return;const i=an*6,j=an*4;AF[i]=x-C;AF[i+1]=y-G0;AF[i+2]=z-C;AF[i+3]=su;AF[i+4]=sv;AF[i+5]=0;ANB[j]=nx*127;ANB[j+1]=ny*127;ANB[j+2]=nz*127;ANB[j+3]=sway;ACB[j]=Math.min(255,r);ACB[j+1]=Math.min(255,g);ACB[j+2]=Math.min(255,b);ACB[j+3]=flag;an++;};
if(S.beamShaft){const q=S.beamShaft;addA(q[0],q[1],q[2],0,1,0,q[3],q[4],q[5],q[5]*0.88,q[5]*0.6,10,0);}
if(S.shafts)for(const q of S.shafts)addA(q[0],q[1],q[2],LD[0],LD[1],LD[2],q[3],q[4],q[5],q[5]*0.9,q[5]*0.6,6,0);
if(S.glows)for(const q of S.glows)addA(q[0],q[1],q[2],0,1,0,q[3],q[3],q[4],q[5],q[6],5,0);
else for(const q of lights){const k=70*Math.min(1.6,q[3]);addA(q[0],q[1],q[2],0,1,0,1.6+1.3*q[3],1.6+1.3*q[3],k*q[4],k*q[5],k*q[6],5,0);}
if(S.flies)for(let i=0;i<S.flies;i++)addA(C-40+rnd()*80,G0+2+rnd()*30,C-40+rnd()*80,0,1,0,0.55,0.55,150,140,70,5,20+rnd()*107);
for(let i=0;i<S.pn*3;i++)addA(C-46+rnd()*92,G0+rnd()*44,C-46+rnd()*92,0,1,0,0.32,0.32,S.pcol[0]*0.75,S.pcol[1]*0.75,S.pcol[2]*0.75,7,0);
return{F:F.slice(0,n*6),NB:NB.slice(0,n*4),CB:CB.slice(0,n*4),n,AF:AF.slice(0,an*6),ANB:ANB.slice(0,an*4),ACB:ACB.slice(0,an*4),an,cells,walk:WK,
meta:{name:S.name,bg:S.bg,vel:S.pv,beam:S.beam,waves:S.waves,groups,ry0:S.ry0==null?0.785:S.ry0,focus:S.focus||[0,14,0]}};
}
