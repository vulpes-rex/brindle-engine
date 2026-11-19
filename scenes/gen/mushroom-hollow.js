// Mushroom hollow: A night swamp of giant glowing mushrooms, with a hut on stilts, a lantern-lit boardwalk, mossy trees, a punt and drifting spores.
// A scene for the generator in engine/gen/genmain.js. It must stay self-contained: the generator hands this function to a
// Web Worker as text, so it can use only what it takes from the kit `K`.
export default function (K) {
const {C,G0,HT,pk,h3,n2,n3,prim,hAt,ball,cap,ell,foot,cyl,box,plank,tree,hull}=K;
function shroom(x,z,hh,R,m,k){let px=x,pz=z,py=hAt(x,z)-1;const la=h3(k,31,1)*6.28,ln=0.25+h3(k,31,2)*0.5;for(let i=0;i<4;i++){const nx=px+Math.cos(la)*ln*(i+1)*0.5,nz=pz+Math.sin(la)*ln*(i+1)*0.5,ny=py+hh/4;cap(px,py,pz,nx,ny,nz,Math.max(0.7,R*0.24-0.1*i),30);px=nx;py=ny;pz=nz;}
const cy=py-R*0.1;prim(px-R-3,px+R+3,cy-R,cy+R,pz-R-3,pz+R+3,m,(X,Y,Z)=>{const u=X-px,v=Y-cy,w=Z-pz,k1=Math.hypot(u/R,v/(R*0.62),w/R),k2=Math.hypot(u/(R*0.86),(v+0.4)/(R*0.44),w/(R*0.86));return Math.max((k1-1)*R*0.62,-0.12*R-v,-(k2-1)*R*0.44);});
cyl(px,pz,cy-0.1*R,cy+0.05*R,R*0.78,R*0.78,31);return[px,cy,pz];}
return {name:'Mushroom hollow',cap:'A night swamp of giant glowing mushrooms, with a hut on stilts, a lantern-lit boardwalk, mossy trees, a punt and drifting spores.',bg:[8,10,22],LD:[0.4,0.75,0.45],amb:[0.24,0.32,0.5],sun:[0.36,0.46,0.7],level:G0-1,pv:[0.3,1.2,0.2],pcol:[110,240,220],pn:50,foot,
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
}};
}
