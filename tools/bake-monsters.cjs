// node tools/bake-monsters.cjs <ink-studio dir> <out json>
// Bakes the monsters sculpted and animated in Ink Studio (scenes/ink/monsters.cjs) to rest splats plus bone clips at 20 fps,
// which the engine skins itself. Each splat is 17 bytes: position, normal, radius, colour, glow flag, two bones and a weight.
const kit=require(process.argv[2]).load(),K=kit.KIT,M=require(require('path').join(__dirname,'../scenes/ink/monsters.cjs')),fs=require('fs');
const SUN=[-0.4,0.75,-0.52],FPS=20,SCALE={mossback:2.3,wisp:2.3},KR=2.05;
const out={};
for(const name of ['mossback','wisp']){const st={clip:'idle',t:0},W=M[name](kit,st,SUN),D=W.data,n=W.count,s=SCALE[name],an=W.anim,nb=an.bones.length/12;
if(an.boned.length!==n)throw new Error('not every splat is boned');
let md=0;for(let i=0;i<n;i++)for(let a=0;a<3;a++)md=Math.max(md,Math.abs(W.chk[i*3+a]-D[i*16+a]));if(md>1e-5)throw new Error('normals are out of step with the data: '+md);
// rest pose bounds (over the idle loop, so the feet rest on y = 0)
let ylo=1e9;for(let f=0;f<24;f++){st.clip='idle';st.t=f*0.1;an.update(0.1,st.t);const d=K.bones.posed(W);for(let i=0;i<n;i++)if(d[i*16+1]<ylo)ylo=d[i*16+1];}
let range=0,rmax=0;const rad=new Float32Array(n);
for(let i=0;i<n;i++){const o=i*16;rad[i]=KR*Math.sqrt((D[o+4]+D[o+8]+D[o+10])/3)*s;if(rad[i]>rmax)rmax=rad[i];for(let a=0;a<3;a++)range=Math.max(range,Math.abs(D[o+a]*s));}
range=Math.ceil(range+0.5);
const buf=Buffer.alloc(n*17);
for(let i=0;i<n;i++){const o=i*16,q=i*17;for(let a=0;a<3;a++)buf.writeInt16LE(Math.round(D[o+a]*s/range*32767),q+a*2);
for(let a=0;a<3;a++)buf.writeInt8(Math.max(-127,Math.min(127,Math.round(W.nrm[i*3+a]*127))),q+6+a);
buf[q+9]=Math.max(1,Math.round(rad[i]/rmax*255));const c=D[o+7];buf[q+10]=c&255;buf[q+11]=(c>>8)&255;buf[q+12]=(c>>16)&255;
const kind=Math.round(D[o+11]);buf[q+13]=(kind&32)?1:0;buf[q+14]=D[o+12];buf[q+15]=D[o+13];buf[q+16]=Math.round(D[o+14]*255);}
// clips
const clips={};let tr=0;const raw={};
for(const cn in M.CLIPS){const c=M.CLIPS[cn],nf=Math.round(c.dur*FPS)+1,fr=new Float32Array(nf*nb*12);
for(let f=0;f<nf;f++){st.clip=cn;st.t=f/FPS;an.update(1/FPS,st.t);const b=an.bones;for(let k=0;k<nb;k++)for(let e=0;e<12;e++){let v=b[k*12+e];if(e>=9){v=v*s;if(e===10)v-=0;tr=Math.max(tr,Math.abs(v));}fr[(f*nb+k)*12+e]=v;}}
raw[cn]={nf,fr,dur:c.dur,loop:!!c.loop};}
tr=Math.ceil(tr+0.5);
for(const cn in raw){const r=raw[cn],b=Buffer.alloc(r.fr.length*2);for(let i=0;i<r.fr.length;i++){const e=i%12,v=e<9?r.fr[i]*8192:r.fr[i]/tr*32767;b.writeInt16LE(Math.max(-32767,Math.min(32767,Math.round(v))),i*2);}
clips[cn]={dur:r.dur,loop:r.loop,nf:r.nf,d:b.toString('base64')};}
out[name]={n,nb,range,rmax:+rmax.toFixed(4),tr,lift:+(-ylo*s).toFixed(3),fps:FPS,d:buf.toString('base64'),clips};
// check: decode and skin in the same way the page will, against the toolkit's own posed splats
let worst=0;for(const cn of ['attack','defeat']){const r=raw[cn];for(const f of [3,7,r.nf-1]){st.clip=cn;st.t=f/FPS;an.update(1/FPS,st.t);const d=K.bones.posed(W);
for(let i=0;i<n;i+=7){const q=i*17,x=buf.readInt16LE(q)/32767*range,y=buf.readInt16LE(q+2)/32767*range,z=buf.readInt16LE(q+4)/32767*range,b1=buf[q+14],b2=buf[q+15],w=buf[q+16]/255;
const m=(k,e)=>{const v=Math.max(-32767,Math.min(32767,Math.round(e<9?r.fr[(f*nb+k)*12+e]*8192:r.fr[(f*nb+k)*12+e]/tr*32767)));return e<9?v/8192:v/32767*tr;};
const P=k=>[m(k,0)*x+m(k,1)*y+m(k,2)*z+m(k,9),m(k,3)*x+m(k,4)*y+m(k,5)*z+m(k,10),m(k,6)*x+m(k,7)*y+m(k,8)*z+m(k,11)];
let p=P(b1);if(w>0){const p2=P(b2);p=[p[0]+(p2[0]-p[0])*w,p[1]+(p2[1]-p[1])*w,p[2]+(p2[2]-p[2])*w];}
for(let a=0;a<3;a++)worst=Math.max(worst,Math.abs(p[a]-d[i*16+a]*s));}}}
console.log(name,'splats',n,'bones',nb,'range',range,'rmax',rmax.toFixed(3),'tr',tr,'lift',out[name].lift,'bytes',buf.length,'clip bytes',Object.values(clips).reduce((a,c)=>a+c.d.length,0),'worst skin error (world units)',worst.toFixed(4));}
fs.writeFileSync(process.argv[3],JSON.stringify(out));console.log('wrote',process.argv[3],fs.statSync(process.argv[3]).size);
