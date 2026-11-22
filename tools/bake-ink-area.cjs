// node tools/bake-ink-area.cjs <ink-studio dir> <scene.cjs> <out dir> [game scale] [nav debug png]
// Builds an Ink Studio scene and bakes it into an area pack the engine's "ink" look can draw and walk on:
//   splats.png  the splats that can ever be seen, as 5 stacked RGB planes (position hi/lo, facing+size, colour row+light, ramp+cell key)
//   lut.png     colour by light level for every colour row, in 4 variants (body, below, above, left edge of a pattern cell)
//   nav.png     the walk map: ground height per half game unit, and which game-unit cells are blocked (only with a game scale)
//   pack.json   palette, ramps, camera, sizes and checksums
// The game scale is world units per game unit (the lighthouse uses 0.05); leave it out for a pack that is only looked at.
const fs=require('fs'),zlib=require('zlib'),path=require('path');
const INK=process.argv[2],SC=process.argv[3],OUT=process.argv[4],SCALE=+process.argv[5]||0,DBG=process.argv[6];
const kit=require(INK).load(),K=kit.KIT;
const sc=require(SC)(kit);
let t0=Date.now();
const w=sc.build(sc.seed);
console.log('built',w.count,'splats in',Date.now()-t0,'ms');
const PT=K.pixel.evaluators(w),CELL=K.pixel.CELL,VW=K.pixel.VIEW,RP=w.ramps,N=w.count,d=w.data,PX=w.pix;
// patterns are asked with the "upright picture" branch on, but from a pixel that is nowhere: so marks and ripples never land,
// and what comes back is the pattern's ground (ripples are drawn by the viewer itself)
Object.assign(VW,{on:true,t:0,R:[1,0,0,0,1,0,0,0,1],e:[0,0,1e6],tp:1,ortho:false,oh:1,asp:1,W:1,H:1,x:1e9,y:1e9});
const FOV=38*Math.PI/180,TP=1/Math.tan(FOV/2),FP=(w.cam.dist*2)/(TP*360);
const NL=60,LITMAX=1.2;
const pal=w.pal.map(h=>[(h>>16)&255,(h>>8)&255,h&255]);
const palOf=pk=>{const r=pk%256,g=Math.floor(pk/256)%256,b=Math.floor(pk/65536);let bi=0,bd=1e9;pal.forEach((c,i)=>{const dd=(c[0]-r)**2+(c[1]-g)**2+(c[2]-b)**2;if(dd<bd){bd=dd;bi=i;}});return bi;};
// ---- colour rows
const rowMap=new Map(),rows=[];
const rowId=buf=>{const k=buf.toString('latin1');let id=rowMap.get(k);if(id===undefined){id=rows.length;rows.push(Buffer.from(buf));rowMap.set(k,id);}return id;};
const rampRow=new Map();
const ROW=new Uint16Array(N),KEY=new Uint16Array(N),FLG=new Uint8Array(N),NRM=new Float32Array(N*3),SIG=new Float32Array(N);
const hash32=(a,b)=>{let h=(Math.imul(a|0,374761393)+Math.imul(b|0,668265263))|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return h>>>0;};
const tmp=Buffer.alloc(NL*4);
t0=Date.now();
const kinds=w.pats.map(p=>p.kind);
for(let i=0;i<N;i++){
  const f=i*8,q=i*16,rid=PX[f],pat=PX[f+2];
  // shape: an oblate dab; its flat radius from the trace
  const tr=d[q+4]+d[q+8]+d[q+10];SIG[i]=Math.sqrt(tr/(2+0.652*0.652));
  let nx=PX[f+3],ny=PX[f+4],nz=PX[f+5];
  if(Math.hypot(nx,ny,nz)<0.5){ // no facing given: the dab's own thin axis (power iteration on the inverse is overkill; use the smallest column response)
    const C=[[d[q+4],d[q+5],d[q+6]],[d[q+5],d[q+8],d[q+9]],[d[q+6],d[q+9],d[q+10]]];
    let v=[0.3,0.5,0.8];const s=tr; // iterate (sI - C) to find the smallest eigenvector
    for(let it=0;it<40;it++){const u=[s*v[0]-(C[0][0]*v[0]+C[0][1]*v[1]+C[0][2]*v[2]),s*v[1]-(C[1][0]*v[0]+C[1][1]*v[1]+C[1][2]*v[2]),s*v[2]-(C[2][0]*v[0]+C[2][1]*v[1]+C[2][2]*v[2])];const l=Math.hypot(...u)||1;v=u.map(x=>x/l);}
    [nx,ny,nz]=v;if(ny<0){nx=-nx;ny=-ny;nz=-nz;}
  }
  NRM[i*3]=nx;NRM[i*3+1]=ny;NRM[i*3+2]=nz;
  const x=d[q],y=d[q+1],z=d[q+2];
  if(!rid){tmp.fill(palOf(d[q+7]));ROW[i]=rowId(tmp);continue;}
  const ramp=RP[rid-1],ev=pat?PT[pat-1]:null;
  if(!ev){let id=rampRow.get(rid);if(id===undefined){for(let j=0;j<NL;j++){const c=ramp[Math.max(0,Math.min(ramp.length-1,Math.floor((j+0.5)/NL*ramp.length)))];tmp[j]=tmp[NL+j]=tmp[2*NL+j]=tmp[3*NL+j]=c;}id=rowId(tmp);rampRow.set(rid,id);}ROW[i]=id;continue;}
  const form=K.pixel.unfold(PX[f+6],PX[f+7]);
  const kd=kinds[pat-1];
  if(kd==='leaves'||kd==='turf')FLG[i]|=1; // no crease lines
  if(kd==='water')FLG[i]|=2;
  let key=NaN;
  for(let j=0;j<NL;j++){const t=(j+0.5)/NL;
    if(ev.cell){const k=ev.cell(x,y,z,ny,t,nx,nz,null,FP,ramp,form);if(j===NL>>1)key=k;tmp[j]=CELL.body;tmp[NL+j]=CELL.below;tmp[2*NL+j]=CELL.above;tmp[3*NL+j]=CELL.left;}
    else{const c=ev.tex(x,y,z,ny,t,nx,nz,null,FP,ramp,form);tmp[j]=tmp[NL+j]=tmp[2*NL+j]=tmp[3*NL+j]=c;}
  }
  ROW[i]=rowId(tmp);
  if(key===key){const lo=key%4294967296,hi=Math.floor(key/4294967296);let h=hash32(lo^(pat*7919),hi+pat)&65535;KEY[i]=h||1;}
}
console.log('rows',rows.length,'colour bake ms',Date.now()-t0);
// ---- which dabs can ever be seen: many cameras all round, at the viewer's own distances
t0=Date.now();
const AL=d[3],FOOT=Math.sqrt(2*Math.log(2*AL));for(let i=0;i<N;i++)if(d[i*16+3]!==AL)throw new Error('mixed densities');
const seen=new Uint8Array(N),VB=1100,zb=new Float32Array(VB*VB),T=w.cam.target;
const SXY=new Float32Array(N*2),DZ=new Float32Array(N);
const view=(yaw,pitch,dist,focal)=>{const cp=Math.cos(pitch),sp=Math.sin(pitch),e=[T[0]+dist*cp*Math.sin(yaw),T[1]+dist*sp,T[2]+dist*cp*Math.cos(yaw)];
  const zx=cp*Math.sin(yaw),zy=sp,zz=cp*Math.cos(yaw);let xx=zz,xz=-zx;const xl=Math.hypot(xx,xz);xx/=xl;xz/=xl;const yx=zy*xz,yy=zz*xx-zx*xz,yz=-zy*xx;
  zb.fill(1e9);
  for(let i=0;i<N;i++){const q=i*16,px=d[q]-e[0],py=d[q+1]-e[1],pz=d[q+2]-e[2],cx=xx*px+xz*pz,cy=yx*px+yy*py+yz*pz,dz=-(zx*px+zy*py+zz*pz);
    DZ[i]=dz;if(dz<0.5){SXY[i*2]=-1;continue;}
    const sx=cx/dz*focal+VB/2,sy=cy/dz*focal+VB/2;SXY[i*2]=sx;SXY[i*2+1]=sy;
    const r=FOOT*SIG[i]*focal/dz+0.6,x0=Math.max(0,Math.floor(sx-r)),x1=Math.min(VB-1,Math.ceil(sx+r)),y0=Math.max(0,Math.floor(sy-r)),y1=Math.min(VB-1,Math.ceil(sy+r));
    for(let yy2=y0;yy2<=y1;yy2++)for(let xx2=x0;xx2<=x1;xx2++){const p=yy2*VB+xx2;if(dz<zb[p])zb[p]=dz;}
  }
  for(let i=0;i<N;i++){if(seen[i])continue;const sx=SXY[i*2];if(sx<0)continue;const X=Math.floor(sx),Y=Math.floor(SXY[i*2+1]);if(X<0||Y<0||X>=VB||Y>=VB)continue;if(DZ[i]<=zb[Y*VB+X]+0.05)seen[i]=1;}
};
const PITCH=[3,9,16,24,33,43,54,65,76,87].map(v=>v*Math.PI/180);let nv=0;
for(const p of PITCH)for(let k=0;k<30;k++){view(k/30*Math.PI*2+p,p,w.cam.dist,1034);nv++;}
for(const p of [6,20,38,58,80].map(v=>v*Math.PI/180))for(let k=0;k<18;k++){view(k/18*Math.PI*2+0.1,p,7,520);nv++;}
let keep=[];for(let i=0;i<N;i++)if(seen[i])keep.push(i);
console.log('views',nv,'seen',keep.length,'of',N,'visibility ms',Date.now()-t0);
// ---- walk map. Ground is the lowest seen, up-facing, dry surface in a column (so the lawn under a tree, not its crown), climbed
// up small steps (stair treads); a column is an obstacle when something stands in the party's body height above that ground; a
// cell is blocked when it has no ground, holds an obstacle, or steps too far to its neighbour (tier walls).
let NAV=null;
if(process.env.NAVDUMP){const dump=new Float32Array(N*6);for(let i=0;i<N;i++){dump[i*6]=d[i*16];dump[i*6+1]=d[i*16+1];dump[i*6+2]=d[i*16+2];dump[i*6+3]=NRM[i*3+1];dump[i*6+4]=FLG[i];dump[i*6+5]=seen[i];}fs.writeFileSync(process.env.NAVDUMP,Buffer.from(dump.buffer));}
if(SCALE){
  const fc=SCALE/2,EXT=Math.ceil(4.7/SCALE-1e-6)*SCALE,NF=Math.round(2*EXT/fc),NUc=NF/2,STEP=0.095,LO=0.09,HI=0.30,JUMP=0.2;
  const ups=new Array(NF*NF),any=new Array(NF*NF);
  const put=(arr,x,z,y,r)=>{const cx=Math.floor((x+EXT)/fc+1e-6),cz=Math.floor((z+EXT)/fc+1e-6);for(let dz=-r;dz<=r;dz++)for(let dx=-r;dx<=r;dx++){const X=cx+dx,Z=cz+dz;if(X<0||Z<0||X>=NF||Z>=NF)continue;const j=Z*NF+X;(arr[j]||(arr[j]=[])).push(y);}};
  for(let i=0;i<N;i++){if(!seen[i]||(FLG[i]&2))continue;const q=i*16,y=d[q+1];if(y<0.02)continue;put(any,d[q],d[q+2],y,0);if(NRM[i*3+1]>0.6)put(ups,d[q],d[q+2],y,1);}
  const GF=new Float32Array(NF*NF).fill(-999),OB=new Uint8Array(NF*NF);
  // The numbers above suit a diorama, where a stair tread rises most of a hero's height. A scene can mark places it built to the hero's
  // own size (W.navFine = [{ at: [x, z], r, step, low }], world units): inside one, a step is only `step` high and anything
  // standing `low` above the ground already blocks, so a picket fence or a flower pot is not climbed like a stair.
  const FINE=w.navFine||[],fineAt=j=>{const x=(j%NF+0.5)*fc-EXT,z=(Math.floor(j/NF)+0.5)*fc-EXT;for(const f of FINE)if(Math.hypot(x-f.at[0],z-f.at[1])<f.r)return f;return null;};
  for(let j=0;j<NF*NF;j++){const u=ups[j];if(!u)continue;const fn=fineAt(j),ST=fn?fn.step:STEP,LW=fn?fn.low:LO;u.sort((a,b)=>a-b);let g=u[0];for(let k=1;k<u.length;k++){if(u[k]-g<=ST)g=u[k];else break;}
    GF[j]=g;if(any[j])for(const y of any[j])if(y>g+LW&&y<g+HI){OB[j]=1;break;}}
  const B0=new Uint8Array(NUc*NUc),HC=new Float32Array(NUc*NUc).fill(-999);
  for(let z=0;z<NUc;z++)for(let x=0;x<NUc;x++){let h=-999,bad=0;for(let b=0;b<2;b++)for(let a=0;a<2;a++){const j=(z*2+b)*NF+x*2+a;if(GF[j]<-900||OB[j])bad=1;else if(GF[j]>h)h=GF[j];}
    if(bad||h<-900)B0[z*NUc+x]=1;HC[z*NUc+x]=h;}
  const J=new Uint8Array(NUc*NUc);
  for(let z=0;z<NUc;z++)for(let x=0;x<NUc;x++){const j=z*NUc+x;if(HC[j]<-900)continue;for(const [dx,dz] of [[1,0],[0,1]]){const X=x+dx,Z=z+dz;if(X>=NUc||Z>=NUc)continue;const k=Z*NUc+X;if(HC[k]<-900)continue;if(Math.abs(HC[j]-HC[k])>JUMP){J[j]=1;J[k]=1;}}}
  for(let j=0;j<NUc*NUc;j++)if(J[j])B0[j]=1;
  // (no widening of blocked cells here: at this scale a cell is already half the party's width)
  const BL=B0.slice();
  // (heights are kept under blocked cells too, where there is ground, so feet stay on it at a cell's edge)
  const nimg=Buffer.alloc(NF*NF*3);let free=0;
  for(let z=0;z<NF;z++)for(let x=0;x<NF;x++){const j=z*NF+x,o=j*3,c=(z>>1)*NUc+(x>>1),v=GF[j]<-900?0:Math.max(1,Math.min(65535,Math.round(GF[j]/SCALE*1000)+1));nimg[o]=v&255;nimg[o+1]=v>>8;nimg[o+2]=BL[c]|(B0[c]<<1);}
  for(let j=0;j<NUc*NUc;j++)if(!BL[j])free++;
  NAV={img:nimg,NF,NUc,EXT,free,BL,B0,HC};
  console.log('nav',NUc,'x',NUc,'cells of',SCALE,'world units, free',free);
}
// ---- order: by surface (ramp), then along a space-filling curve, so neighbours in the file are neighbours on a surface
const Q=512,O=[-4.75,-1.05,-4.75];
const part=v=>{v&=1023;v=(v|(v<<16))&0x030000ff;v=(v|(v<<8))&0x0300f00f;v=(v|(v<<4))&0x030c30c3;v=(v|(v<<2))&0x09249249;return v;};
const mort=i=>{const q=i*16,a=Math.floor((d[q]-O[0])/9.5*1023),b=Math.floor((d[q+1]-O[1])/9.5*1023),c=Math.floor((d[q+2]-O[2])/9.5*1023);return (part(a)|(part(b)<<1)|(part(c)<<2))>>>0;};
const MC=new Float64Array(N);for(const i of keep)MC[i]=PX[i*8]*4294967296+mort(i);
keep.sort((a,b)=>MC[a]-MC[b]);
// ---- pack
const M=keep.length,TW=1024,TH=Math.ceil(M/TW),img=Buffer.alloc(TW*TH*5*3);
const oct=(x,y,z)=>{const s=Math.abs(x)+Math.abs(y)+Math.abs(z)||1;let u=x/s,v=z/s;if(y<0){const u2=(1-Math.abs(v))*(u>=0?1:-1),v2=(1-Math.abs(u))*(v>=0?1:-1);u=u2;v=v2;}return [Math.round((u*0.5+0.5)*255),Math.round((v*0.5+0.5)*255)];};
const SIGMAX=0.04;let sigClip=0,posClip=0;
keep.forEach((i,k)=>{const q=i*16,o=k*3,pl=TW*TH*3;
  const P=[0,1,2].map(a=>{let v=Math.round((d[q+a]-O[a])*Q);if(v<0||v>65535){posClip++;v=Math.max(0,Math.min(65535,v));}return v;});
  img[o]=P[0]>>8;img[o+1]=P[1]>>8;img[o+2]=P[2]>>8;
  img[pl+o]=P[0]&255;img[pl+o+1]=P[1]&255;img[pl+o+2]=P[2]&255;
  const [ou,ov]=oct(NRM[i*3],NRM[i*3+1],NRM[i*3+2]);let sg=Math.round(SIG[i]/SIGMAX*255);if(sg>255){sg=255;sigClip++;}
  img[2*pl+o]=ou;img[2*pl+o+1]=ov;img[2*pl+o+2]=sg;
  img[3*pl+o]=ROW[i]&255;img[3*pl+o+1]=ROW[i]>>8;img[3*pl+o+2]=Math.max(0,Math.min(255,Math.round(PX[i*8+1]/LITMAX*255)));
  img[4*pl+o]=PX[i*8]|(FLG[i]<<5);img[4*pl+o+1]=KEY[i]&255;img[4*pl+o+2]=KEY[i]>>8;});
console.log('packed',M,'tex',TW,'x',TH*5,'sigClip',sigClip,'posClip',posClip);
// ---- png
const crcT=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
const crc=b=>{let c=0xffffffff;for(let i=0;i<b.length;i++)c=crcT[(c^b[i])&255]^(c>>>8);return (c^0xffffffff)>>>0;};
const chunk=(ty,data)=>{const len=Buffer.alloc(4);len.writeUInt32BE(data.length);const td=Buffer.concat([Buffer.from(ty,'latin1'),data]);const c=Buffer.alloc(4);c.writeUInt32BE(crc(td));return Buffer.concat([len,td,c]);};
const png=(W,H,rgb)=>{const bpp=3,st=W*bpp,raw=Buffer.alloc((st+1)*H),cand=[0,1,2,3,4].map(()=>Buffer.alloc(st));
  for(let y=0;y<H;y++){const row=rgb.subarray(y*st,(y+1)*st),prev=y?rgb.subarray((y-1)*st,y*st):null;let bf=0,bs=1e18;
    for(let f=0;f<5;f++){const c=cand[f];let s=0;for(let x=0;x<st;x++){const a=x>=bpp?row[x-bpp]:0,b=prev?prev[x]:0,cc=prev&&x>=bpp?prev[x-bpp]:0;let p;
        if(f===0)p=0;else if(f===1)p=a;else if(f===2)p=b;else if(f===3)p=(a+b)>>1;else{const pa=Math.abs(b-cc),pb=Math.abs(a-cc),pc=Math.abs(a+b-2*cc);p=pa<=pb&&pa<=pc?a:pb<=pc?b:cc;}
        const v=(row[x]-p)&255;c[x]=v;s+=v<128?v:256-v;}
      if(s<bs){bs=s;bf=f;}}
    raw[y*(st+1)]=bf;cand[bf].copy(raw,y*(st+1)+1);}
  const ih=Buffer.alloc(13);ih.writeUInt32BE(W,0);ih.writeUInt32BE(H,4);ih[8]=8;ih[9]=2;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ih),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);};
fs.mkdirSync(OUT,{recursive:true});
const sp=png(TW,TH*5,img);fs.writeFileSync(path.join(OUT,'splats.png'),sp);
// colour rows: 80 texels of 3 across = 240 entries
const LW=NL*4/3,lut=Buffer.alloc(rows.length*NL*4);rows.forEach((r,i)=>r.copy(lut,i*NL*4));
const lp=png(LW,rows.length,lut);fs.writeFileSync(path.join(OUT,'lut.png'),lp);
let sum=0;for(let i=0;i<img.length;i++)sum=(sum+img[i]*((i%251)+1))>>>0;
let lsum=0;for(let i=0;i<lut.length;i++)lsum=(lsum+lut[i]*((i%251)+1))>>>0;
// (a dab's ramp shares a byte with its flags: five bits)
if(RP.length>31)throw new Error('this scene uses '+RP.length+' ramps; a pack holds 31 at most. Give materials that share colours the same r');
const meta={al:AL,n:M,tw:TW,th:TH,rows:rows.length,nl:NL,litMax:LITMAX,q:Q,o:O,sigMax:SIGMAX,sum,lsum,pal:w.pal,ramps:RP,cam:w.cam,radius:w.radius,detail:w.detail,lantern:w.lantern,kinds};
// (which ramp the water lies on, and how high)
let wy=0,wn=0,wr={};for(const i of keep)if(FLG[i]&2){wy+=d[i*16+1];wn++;wr[PX[i*8]]=(wr[PX[i*8]]||0)+1;}
meta.water={y:wy/wn,ramp:+Object.keys(wr)[0],n:wn};
if(NAV){const np=png(NAV.NF,NAV.NF,NAV.img);fs.writeFileSync(path.join(OUT,'nav.png'),np);let ns=0;for(let i=0;i<NAV.img.length;i++)ns=(ns+NAV.img[i]*((i%251)+1))>>>0;
  meta.nav={nu:NAV.NUc,n:NAV.NF,rs:2,c:NAV.EXT/SCALE,scale:SCALE,hq:1000,sum:ns};console.log('nav.png',np.length);
  if(DBG){const K2=4,W2=NAV.NUc*K2,im=Buffer.alloc(W2*W2*3);for(let z=0;z<NAV.NUc;z++)for(let x=0;x<NAV.NUc;x++){const j=z*NAV.NUc+x,h=NAV.HC[j];
      const c=NAV.B0[j]?(h<-900?[14,20,40]:[70,40,46]):NAV.BL[j]?[120,90,60]:[40+Math.min(200,h*110),150+Math.min(100,h*60),70];
      for(let b=0;b<K2;b++)for(let a=0;a<K2;a++){const o=((z*K2+b)*W2+x*K2+a)*3;im[o]=c[0];im[o+1]=c[1];im[o+2]=c[2];}}
    fs.writeFileSync(DBG,png(W2,W2,im));console.log('debug map',DBG,'(x right, z down, 4 px per cell)');}}
fs.writeFileSync(path.join(OUT,'pack.json'),JSON.stringify(meta));
console.log('splats.png',sp.length,'lut.png',lp.length,'water',JSON.stringify(meta.water));
