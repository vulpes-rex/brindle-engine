// node tools/navcheck.cjs <pack dir> x0,z0,x1,z1 [fromX,fromZ toX,toZ ...]   prints a walk map window (world units) and checks routes
const fs=require('fs'),zlib=require('zlib'),path=require('path');
const dir=process.argv[2],P=JSON.parse(fs.readFileSync(path.join(dir,'pack.json'),'utf8')),nv=P.nav;
function readPng(f){const b=fs.readFileSync(f);let p=8,w=0,h=0;const parts=[];while(p<b.length){const len=b.readUInt32BE(p),ty=b.toString('latin1',p+4,p+8);if(ty==='IHDR'){w=b.readUInt32BE(p+8);h=b.readUInt32BE(p+12);}else if(ty==='IDAT')parts.push(b.subarray(p+8,p+8+len));p+=12+len;}
  const raw=zlib.inflateSync(Buffer.concat(parts)),st=w*3,out=Buffer.alloc(w*h*3);
  for(let y=0;y<h;y++){const f=raw[y*(st+1)],ro=y*(st+1)+1,o=y*st,po=o-st;for(let x=0;x<st;x++){const a=x>=3?out[o+x-3]:0,bb=y?out[po+x]:0,c=(y&&x>=3)?out[po+x-3]:0;let pr=0;
    if(f===1)pr=a;else if(f===2)pr=bb;else if(f===3)pr=(a+bb)>>1;else if(f===4){const pa=Math.abs(bb-c),pb=Math.abs(a-c),pc=Math.abs(a+bb-2*c);pr=pa<=pb&&pa<=pc?a:pb<=pc?bb:c;}out[o+x]=(raw[ro+x]+pr)&255;}}
  return {w,h,rgb:out};}
const im=readPng(path.join(dir,'nav.png')),N=nv.n,NU=nv.nu,s=nv.scale,C=nv.c;
const BL=(x,z)=>im.rgb[((z*2)*N+x*2)*3+2]&1,B0=(x,z)=>(im.rgb[((z*2)*N+x*2)*3+2]>>1)&1;
const H=(x,z)=>{const o=((z*2)*N+x*2)*3,v=im.rgb[o]|(im.rgb[o+1]<<8);return v?(v-1)/nv.hq:-999;};
const cell=(wx,wz)=>[Math.floor(wx/s+C),Math.floor(wz/s+C)];
const [x0,z0,x1,z1]=process.argv[3].split(',').map(Number),a=cell(x0,z0),b=cell(x1,z1);
const routes=process.argv.slice(4).map(r=>r.split(',').map(Number));
const mark=new Map();routes.forEach((r,i)=>{mark.set(cell(r[0],r[1]).join(),String.fromCharCode(65+i));});
for(let z=a[1];z<=b[1];z++){let row='';for(let x=a[0];x<=b[0];x++){const m=mark.get(x+','+z);row+=m?m:B0(x,z)?'#':BL(x,z)?'+':String(Math.min(9,Math.max(0,Math.floor(H(x,z)/3.5))));}console.log(row);}
// flood from the first point
if(routes.length){const st=cell(routes[0][0],routes[0][1]),seen=new Uint8Array(NU*NU),q=[st];if(BL(st[0],st[1]))console.log('start is blocked');seen[st[1]*NU+st[0]]=1;
  while(q.length){const [x,z]=q.pop();for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const X=x+dx,Z=z+dz;if(X<0||Z<0||X>=NU||Z>=NU||seen[Z*NU+X]||BL(X,Z))continue;seen[Z*NU+X]=1;q.push([X,Z]);}}
  let n=0;for(let i=0;i<NU*NU;i++)n+=seen[i];console.log('reachable cells from A:',n);
  routes.forEach((r,i)=>{const c=cell(r[0],r[1]);console.log(String.fromCharCode(65+i),r.join(','),'cell',c.join(','),'blocked',BL(c[0],c[1]),'reachable',seen[c[1]*NU+c[0]],'height (game units)',H(c[0],c[1]).toFixed(2));});}
