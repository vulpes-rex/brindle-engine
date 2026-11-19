// The cast, drawn by code: each character as 4 walk frames x 5 facings (S, SE, E, NE, N; the west side is mirrored), a knocked-out
// frame each, and the little icons that bob over things you can use. All original pixel art. Not loaded by the game itself:
// tools/bake-sprites.mjs bakes it (or the PixelLab art in art/pixellab/) into the sprite pack the game loads.
export function makeSprites(){
const SW=24,SH=32,DIRS=5,FR=4;
const CH=[
{name:'hero',skin:[240,196,160],hair:[112,70,44],top:[44,132,140],bot:[70,62,92],boot:[92,58,40],acc:[206,64,56],style:'short'},
{name:'elder',skin:[232,188,150],hair:[226,226,232],top:[112,74,160],bot:[112,74,160],boot:[70,50,40],acc:[214,170,80],style:'long',robe:true},
{name:'merchant',skin:[214,160,116],hair:[52,40,40],top:[214,150,60],bot:[92,70,56],boot:[60,44,36],acc:[176,58,48],style:'hat'},
{name:'girl',skin:[244,204,170],hair:[214,120,60],top:[232,226,214],bot:[66,110,150],boot:[110,70,48],acc:[70,150,110],style:'long'},
{name:'guard',skin:[226,180,140],hair:[150,156,170],top:[150,156,170],bot:[70,74,96],boot:[50,50,60],acc:[52,96,150],style:'hat',cape:true},
{name:'keeper',skin:[222,176,138],hair:[206,208,214],top:[40,58,96],bot:[58,60,74],boot:[46,40,40],acc:[226,184,64],style:'hat'}];
const AW=SW*FR*CH.length,KY=SH*DIRS+16,AH=KY+SW,A=new Uint8ClampedArray(AW*AH*4);
const pk=c=>(c[0]<<16)|(c[1]<<8)|c[2],sh=(c,f)=>[Math.min(255,c[0]*f)|0,Math.min(255,c[1]*f)|0,Math.min(255,c[2]*f)|0];
function draw(sp,dir,fr){const g=new Int32Array(SW*SH).fill(-1);
const P=(x,y,c)=>{if(x>=0&&y>=0&&x<SW&&y<SH)g[y*SW+x]=pk(c);},R=(x,y,w,h,c)=>{for(let j=0;j<h;j++)for(let i=0;i<w;i++)P(x+i,y+j,c);};
const skin=sp.skin,skS=sh(skin,0.82),hood=sp.style==='hood',hair=hood?sp.top:sp.hair,haS=sh(hair,0.72),haH=sh(hair,1.28),top=sp.top,toS=sh(top,0.72),bot=sp.bot,boS=sh(bot,0.7),boot=sp.boot,acc=sp.acc,acS=sh(acc,0.74),eye=[40,30,52],wh=[250,250,255];
const st=fr%4,by=(st===1||st===3)?-1:0,side=dir===2,front=dir<2,fx=(dir===1||dir===3)?1:0,hs=[[8,15],[7,16],[6,17],[6,17],[6,17],[6,17],[6,17],[6,17],[7,16],[8,15]];
if(!side){
const leg=(x0,up)=>{R(x0,22,4,up?5:7,bot);R(x0+3,22,1,up?5:7,boS);R(x0,up?27:29,4,2,boot);if(fx)P(x0+4,up?28:30,boot);};
if(sp.robe){const sw=st===0?-1:st===2?1:0;R(8,22,8,6,top);R(15,22,1,6,toS);R(8+sw,28,8,1,toS);R(9,29,2,2,boot);R(13,29,2,2,boot);}
else{leg(8,front?st===2:st===0);leg(12,front?st===0:st===2);}
R(8,15+by,8,8,top);R(15,15+by,1,8,toS);R(8,22+by,8,1,toS);if(!sp.robe)R(8,21+by,8,1,acS);else R(11,16+by,2,6,acS);
const al=st===0?1:st===2?-1:0,arm=(x0,d,s)=>{const n=4+d;R(x0,15+by,2,n,s?toS:top);R(x0,15+by+n,2,2,skin);};arm(6,al,0);arm(16,-al,1);
for(let i=0;i<10;i++)R(hs[i][0],5+i+by,hs[i][1]-hs[i][0]+1,1,skin);for(let i=2;i<8;i++)P(17,5+i+by,skS);R(8,14+by,8,1,skS);
if(front){R(8,4+by,8,1,hair);R(7,5+by,10,1,hair);R(6,6+by,12,2,hair);R(6,8+by,3,1,hair);R(15+fx,8+by,3-fx,1,hair);R(6,9+by,1+fx,3+fx,hair);if(!fx)R(17,9+by,1,3,haS);R(9,5+by,3,1,haH);
const e1=8+fx,e2=14+fx;R(e1,10+by,2,2,eye);P(e1,10+by,wh);R(e2,10+by,fx?1:2,2,eye);if(!fx)P(e2,10+by,wh);P(11+fx,13+by,skS);P(12+fx,13+by,skS);R(8,15+by,8,1,acc);P(9,16+by,acS);
if(sp.style==='long'){R(6,9+by,1,8,hair);if(!fx)R(17,9+by,1,8,haS);else R(7,12+by,1,5,hair);}}
else{R(8,4+by,8,1,hair);for(let i=0;i<9;i++)R(hs[i][0],5+i+by,hs[i][1]-hs[i][0]+1,1,hair);for(let i=1;i<9;i++)P(hs[i][1],5+i+by,haS);R(9,5+by,3,1,haH);R(10,14+by,4,1,skS);
if(fx){R(16,9+by,2,4,skin);P(17,10+by,eye);P(17,12+by,skS);}
if(sp.cape){R(8,15+by,8,10,acc);R(15,15+by,1,10,acS);R(8,24+by,8,1,acS);}
if(sp.style==='long'){R(7,13+by,10,5,hair);R(16,13+by,1,5,haS);R(8,18+by,8,1,haS);}}
if(sp.style==='hat'){R(7,3+by,10,4,acc);R(16,3+by,1,4,acS);R(5,7+by,14,1,acS);R(7,6+by,10,1,sh(acc,1.2));}
if(hood&&front){R(6,9+by,1,6,hair);R(17,9+by,1,6,haS);}
}else{
const sl=(k,c,bc)=>{for(let i=0;i<7;i++)R(10+Math.round(k*i*0.5),22+i,3,1,c);R(10+k*3,29,4,2,bc);};
if(sp.robe){const sw=st===0?1:st===2?-1:0;R(9,22,6,6,top);R(9,22,1,6,toS);R(9+sw,28,6,1,toS);R(10,29,4,2,boot);}
else if(st===0){sl(-1,boS,sh(boot,0.75));sl(1,bot,boot);}else if(st===2){sl(1,boS,sh(boot,0.75));sl(-1,bot,boot);}
else{R(10,22,3,5,boS);R(10,27,4,2,sh(boot,0.75));R(10,22,3,7,bot);R(10,29,4,2,boot);if(st===3){R(10,22,3,7,bot);R(11,22,3,5,boS);R(11,27,4,2,sh(boot,0.75));R(10,22,3,7,bot);R(10,29,4,2,boot);}}
R(9,15+by,6,8,top);R(9,15+by,1,8,toS);R(9,22+by,6,1,toS);if(!sp.robe)R(9,21+by,6,1,acS);
if(sp.cape){R(7,15+by,3,10,acc);R(7,15+by,1,10,acS);}
const as=st===0?-1:st===2?1:0;for(let i=0;i<5;i++)R(11+Math.round(as*i*0.5),15+by+i,2,1,toS);R(11+Math.round(as*2.5),20+by,2,2,skin);
for(let i=0;i<10;i++)R(hs[i][0]+1,5+i+by,hs[i][1]-hs[i][0]+1,1,skin);R(9,14+by,8,1,skS);
R(9,4+by,8,1,hair);R(8,5+by,10,1,hair);R(7,6+by,12,2,hair);R(7,8+by,5,5,hair);R(8,13+by,3,1,hair);R(12,8+by,5,1,hair);R(7,8+by,1,5,haS);R(10,5+by,3,1,haH);
R(15,10+by,2,2,eye);P(15,10+by,wh);P(19,11+by,skin);P(16,13+by,skS);P(17,13+by,skS);R(9,15+by,6,1,acc);if(st===0||st===2){P(8,16+by,acc);P(7,17+by,acS);}
if(sp.style==='long'){R(7,13+by,3,5,hair);R(7,13+by,1,5,haS);}
if(sp.style==='hat'){R(8,3+by,10,4,acc);R(8,3+by,1,4,acS);R(6,7+by,15,1,acS);R(8,6+by,10,1,sh(acc,1.2));}
}
const o=new Int32Array(g),ol=pk([34,26,44]);for(let y=0;y<SH;y++)for(let x=0;x<SW;x++){if(g[y*SW+x]>=0)continue;if((x>0&&g[y*SW+x-1]>=0)||(x<SW-1&&g[y*SW+x+1]>=0)||(y>0&&g[(y-1)*SW+x]>=0)||(y<SH-1&&g[(y+1)*SW+x]>=0))o[y*SW+x]=ol;}
return o;}
CH.forEach((sp,ci)=>{for(let d=0;d<DIRS;d++)for(let f=0;f<FR;f++){const g=draw(sp,d,f),ox=ci*SW*FR+f*SW,oy=d*SH;for(let y=0;y<SH;y++)for(let x=0;x<SW;x++){const v=g[y*SW+x];if(v<0)continue;const k=((oy+y)*AW+ox+x)*4;A[k]=v>>16;A[k+1]=(v>>8)&255;A[k+2]=v&255;A[k+3]=255;}}});
CH.forEach((sp,ci)=>{const g=draw(sp,2,1);for(let dy=0;dy<SW;dy++)for(let dx=0;dx<SH;dx++){const v=g[(SH-1-dx)*SW+(SW-1-dy)];if(v<0)continue;const k=((KY+dy)*AW+ci*SH+dx)*4;A[k]=v>>16;A[k+1]=(v>>8)&255;A[k+2]=v&255;A[k+3]=255;}});
const ic=["..#########...",".#wwwwwwwww#..","#wwwwwwwwwww#.","#ww#ww#ww#ww#.","#wwwwwwwwwww#.",".#wwwwwwwww#..","..###ww####...",".....#w#......","......#......."];
ic.forEach((row,y)=>{for(let x=0;x<row.length;x++){const c=row[x];if(c==='.')continue;const k=((SH*DIRS+2+y)*AW+x)*4,v=c==='#'?[34,26,44]:[250,250,255];A[k]=v[0];A[k+1]=v[1];A[k+2]=v[2];A[k+3]=255;}});
const ex=["......#.......",".....#y#......","....#yyy#.....","...#yyyyy#....","..#yyyyyyy#...",".####yyy####..","....#yyy#.....","....#yyy#.....","....#####....."];
ex.forEach((row,y)=>{for(let x=0;x<row.length;x++){const c=row[x];if(c==='.')continue;const k=((SH*DIRS+2+y)*AW+16+x)*4,v=c==='#'?[34,26,44]:[255,214,96];A[k]=v[0];A[k+1]=v[1];A[k+2]=v[2];A[k+3]=255;}});
return{data:A,w:AW,h:AH,SW,SH,FR,DIRS,names:CH.map(c=>c.name),icons:{talk:[0,SH*DIRS+2,14,9],exit:[16,SH*DIRS+2,14,9]},ko:ci=>[ci*SH,KY,SH,SW]};}
