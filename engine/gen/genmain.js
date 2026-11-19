// The scene generator: signed-distance scenes -> splats, lights and a walk map. One self-contained function, because it is
// handed to a Web Worker as text. A scene is a function too (see game/scenes/): genMain hands it the kit, the sculpting
// tools below, and it returns the scene's ground, materials and build. genMain(scene, progress)
export function genMain(scene,progress){
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
function hull(bx,bY,bz,ra,m){const c=Math.cos(ra),s=Math.sin(ra);prim(bx-8,bx+8,bY-4,bY+4,bz-8,bz+8,m,(x,y,z)=>{const u=(x-bx)*c+(z-bz)*s,w=(z-bz)*c-(x-bx)*s,v=y-bY;return Math.max((Math.hypot(u/5.2,v/1.9,w/2.2)-1)*1.9,-(Math.hypot(u/4.6,(v-0.5)/1.9,w/1.7)-1)*1.7,v-0.9);});}
function pyr(cx,yb,cz,R,sl,m){prim(cx-R-3,cx+R+3,yb-2,yb+R/sl+3,cz-R-3,cz+R+3,m,(x,y,z)=>Math.max((Math.max(Math.abs(x-cx),Math.abs(z-cz))+(y-yb)*sl-R)*0.6,yb-y));}
function ring(cx,cy,cz,R,th,m){prim(cx-R-2,cx+R+2,cy-th-2,cy+th+2,cz-R-2,cz+R+2,m,(x,y,z)=>Math.hypot(Math.hypot(x-cx,z-cz)-R,y-cy)-th);}
function crag(cx,cy,cz,rx,ry2,rz,m,k){const R=Math.max(rx,ry2,rz)+3;prim(cx-R,cx+R,cy-R,cy+R,cz-R,cz+R,m,(x,y,z)=>((Math.hypot((x-cx)/rx,(y-cy)/ry2,(z-cz)/rz)-1)*Math.min(rx,ry2,rz)+2.2*(n3(x*0.3+k,y*0.45,z*0.3)-0.5)+0.8*(n3(x*0.9,y*0.9+k,z*0.9)-0.5))*0.7);}
function carveW(cx,cy,cz,r,m0,m1){const x0=Math.max(0,Math.floor((cx-r-2)*RS)),x1=Math.min(N-1,Math.ceil((cx+r+2)*RS)),y0=Math.max(0,Math.floor((cy-r-2)*RS)),y1=Math.min(H-1,Math.ceil((cy+r+2)*RS)),z0=Math.max(0,Math.floor((cz-r-2)*RS)),z1=Math.min(N-1,Math.ceil((cz+r+2)*RS));
for(let y=y0;y<=y1;y++)for(let z=z0;z<=z1;z++)for(let x=x0;x<=x1;x++){const i=(y*N+z)*N+x;if(MT[i]!==m0)continue;const X=(x+0.5)/RS,Y=(y+0.5)/RS,Z=(z+0.5)/RS,s=Math.hypot(X-cx,Y-cy,Z-cz)-r+1.4*(n3(X*0.7,Y*0.7,Z*0.7)-0.5);if(-s>D[i]){D[i]=-s;MT[i]=m1;}}}
function barrel(x,z,y,h){cyl(x,z,y,y+h,0.85,0.85,5);ring(x,y+h*0.25,z,0.88,0.09,56);ring(x,y+h*0.75,z,0.88,0.09,56);cyl(x,z,y+h,y+h+0.1,0.7,0.7,34);}
function hero(x,z,fa,o){const y=hAt(x,z),c=Math.cos(fa),s=Math.sin(fa),P=(u,v)=>[x+u*c-v*s,z+u*s+v*c];let p,q;
for(const v of[-0.55,0.55]){p=P(0,v);cap(p[0],y+0.3,p[1],p[0],y+2,p[1],0.46,o.legs);q=P(0.25,v);ell(q[0],y+0.35,q[1],0.62,0.4,0.62,o.boot||5);}
if(o.robe){cyl(x,z,y+0.25,y+4.1,1.55,0.95,o.body);if(o.trim)ring(x,y+0.5,z,1.5,0.2,o.trim);}else cap(x,y+2.2,z,x,y+3.8,z,1.05,o.body);
if(o.belt)ring(x,y+2.5,z,o.robe?1.24:1.07,0.16,o.belt);
const hands=[];for(const v of[-1,1]){p=P(0,v*1.12);const hp=o.hands[v<0?0:1];q=P(hp[0],hp[1]);cap(p[0],y+3.9,p[1],q[0],y+hp[2],q[1],0.36,o.arm||o.body);ball(q[0],y+hp[2],q[1],0.4,102);hands.push([q[0],y+hp[2],q[1]]);}
ball(x,y+5.3,z,1.25,102);for(const v of[-0.45,0.45]){p=P(1.12,v);ball(p[0],y+5.4,p[1],0.17,36);}
return{y,P,hands};}
function pillar(x,z,y,h,brk){box(x,y+0.5,z,2.2,0.55,2.2,98,0.12);prim(x-3,x+3,y+1,y+h,z-3,z+3,98,(X,Y,Z)=>Math.max(Math.hypot(X-x,Z-z)-(1.6+0.13*Math.cos(8*Math.atan2(Z-z,X-x))),y+1-Y,Y-(y+h-(brk?1.4*n2(X*1.3,Z*1.3):0)))*0.85);if(!brk){box(x,y+h+0.35,z,1.95,0.35,1.95,98,0.1);box(x,y+h+1,z,2.3,0.35,2.3,98,0.1);}}
function gableR(cx,yb,cz,hw,len,m,ra,sl,th){const c=Math.cos(ra),s=Math.sin(ra),R=Math.hypot(hw,len)+3,k=1/Math.hypot(1,sl);
prim(cx-R,cx+R,yb-2,yb+hw*sl+3,cz-R,cz+R,m,(x,y,z)=>{const u=(x-cx)*c+(z-cz)*s,v=(z-cz)*c-(x-cx)*s,a=(Math.abs(u)*sl+(y-yb)-hw*sl)*k;return Math.max(a,th?-(a+th):yb-y,Math.abs(v)-len,yb-0.3-y);});}
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
case 7:c=S.water||[26,78,96];break;
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
// the kit: everything a scene may use, handed to it by name
const K={RS,NU,HU,N,H,C,G0,NN,D,MT,HT,DRm,YB,G,pk,mu,rnd,h3,n2,n3,Dg,Mg,mi,prim,sm,hAt,seam,sdBox,ball,cap,abox,ell,leafM,alimb,carve,tree2,foot,cyl,box,gable,palm,steps,plank,lamp,tree,hull,pyr,ring,crag,carveW,barrel,hero,pillar,gableR,LEAF,GRASS,METAL,WRAP,EMI,base,baseOld};
S=scene(K);LD=S.LD;S.lights=[];S.emit=null;S.birds=S.beam=S.waves=S.beamShaft=null;
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