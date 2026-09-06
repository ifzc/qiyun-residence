import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const landmarks = [
  { name: '府门', position: [-3, 5.5, 16] },
  { name: '前厅', position: [-3, 6, 6.3] },
  { name: '正堂', position: [-3, 7.3, -5.5] },
  { name: '后寝', position: [-3, 6, -15.5] },
  { name: '听雨亭', position: [12, 5.5, 9] },
  { name: '荷池', position: [12, 1, -3] },
];

export function createMansion() {
  const root = new T.Group();
  root.name = '栖云府';
  const roofs = new T.Group();
  roofs.name = '灰瓦屋顶';
  const fixed = new T.Group();
  const material = (color: string, extra: T.MeshStandardMaterialParameters = {}) => new T.MeshStandardMaterial({ color, roughness: .88, ...extra });
  const m = {
    plaster: material('#e3decb'), stone: material('#9a9c88'), stoneLight: material('#c6c5af'),
    plinth: material('#626e5c'), earth: material('#7b8067'), paver: material('#a8ad97'),
    wood: material('#663a25'), woodLight: material('#946143'), woodDark: material('#392b23'),
    roof: material('#384746'), tile: material('#566462'), ridge: material('#75847a'),
    gold: material('#bfa56f', { metalness:.35, roughness:.55 }), door: material('#733528'),
    window: material('#917b50', { emissive:'#f2bb56', emissiveIntensity:.06 }),
    lantern: material('#ad482c', { emissive:'#ff832d', emissiveIntensity:.12 }),
    foliage: material('#526b40', { flatShading:true }), foliageLight: material('#788350', { flatShading:true }),
    pine: material('#3d5a40', { flatShading:true }), grass: material('#66704c'),
    water: material('#456e66', { metalness:.3, roughness:.19, transparent:true, opacity:.92 }),
    rock: material('#92988b', { flatShading:true }), lotus: material('#b29984'), leaf: material('#617e52'),
  };
  const unitBox = new T.BoxGeometry(1,1,1);
  const unitCylinder = new T.CylinderGeometry(1,1,1,10);
  const sphere = new T.IcosahedronGeometry(1,1);
  let seed = 2767;
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  function add(parent:T.Group, geometry:T.BufferGeometry, mat:T.Material, x=0,y=0,z=0) {
    const mesh = new T.Mesh(geometry,mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function box(parent:T.Group,x:number,y:number,z:number,w:number,h:number,d:number,mat:T.Material) {
    const mesh=add(parent,unitBox,mat,x,y,z);mesh.scale.set(w,h,d);return mesh;
  }
  function cylinder(parent:T.Group,x:number,y:number,z:number,r:number,h:number,mat:T.Material) {
    const mesh=add(parent,unitCylinder,mat,x,y,z);mesh.scale.set(r,h,r);return mesh;
  }
  function line(parent:T.Group,points:T.Vector3[],radius:number,mat:T.Material) {
    const curve = new T.CatmullRomCurve3(points);
    return add(parent,new T.TubeGeometry(curve, Math.max(6,points.length*2),radius,5,false),mat);
  }
  function beam(parent:T.Group,a:T.Vector3,b:T.Vector3,r:number,mat:T.Material) {
    const mesh=cylinder(parent,0,0,0,r,a.distanceTo(b),mat);
    mesh.position.copy(a).add(b).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize());return mesh;
  }
  function roof(parent:T.Group,w:number,d:number,eave:number,rise:number) {
    const g = new T.Group(); g.userData.roof=true;parent.add(g);
    const a=w/2,b=d/2,hip=Math.min(b*.78,a*.7);
    const height=(x:number,z:number) => {
      const t=Math.max(0,Math.min(1-Math.abs(z)/b,(a-Math.abs(x))/hip));
      return eave+rise*(.40*t+.60*t*t)+.55*Math.pow(Math.abs(x)/a,10)*Math.pow(Math.abs(z)/b,8);
    };
    const positions:number[]=[],indices:number[]=[];
    const nx=Math.ceil(w*5),nz=Math.ceil(d*5);
    for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
      const x=-a+w*i/nx,z=-b+d*j/nz;positions.push(x,height(x,z),z);
    }
    for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){
      const k=j*(nx+1)+i;indices.push(k,k+nx+1,k+1,k+1,k+nx+1,k+nx+2);
    }
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
    add(g,geometry,m.roof);
    // Individually modelled tile rolls follow the concave roof slopes.
    for(let x=-a+.09;x<a;x+=.26) {
      const points=[];for(let i=0;i<=18;i++){const z=-b+d*i/18;points.push(new T.Vector3(x,height(x,z)+.04,z));}
      line(g,points,.031,m.tile);
    }
    // Tile courses and raised stone ridges.
    for(let z=-b+.12;z<b;z+=.43){
      const points=[];for(let i=0;i<=28;i++){const x=-a+w*i/28;points.push(new T.Vector3(x,height(x,z)+.013,z));}
      line(g,points,.013,m.tile);
    }
    for(const s of [-1,1]) {
      const points=[];for(let i=0;i<=24;i++){const x=-a+w*i/24;points.push(new T.Vector3(x,height(x,s*b),s*b));}
      line(g,points,.095,m.ridge);
      for(const end of [-1,1]) {
        const pts=[];for(let j=0;j<=12;j++){const t=j/12;const x=end*(a-hip+hip*t),z=s*b*t;pts.push(new T.Vector3(x,height(x,z)+.09,z));}
        line(g,pts,.082,m.ridge);
      }
    }
    for(const s of [-1,1]) {
      const pts=[];for(let i=0;i<=20;i++){const z=-b+d*i/20;pts.push(new T.Vector3(s*a,height(s*a,z),z));}
      line(g,pts,.084,m.ridge);
    }
    line(g,[new T.Vector3(-a+hip-.3,eave+rise+.25,0),new T.Vector3(-a+hip,eave+rise+.13,0),new T.Vector3(0,eave+rise+.12,0),new T.Vector3(a-hip,eave+rise+.13,0),new T.Vector3(a-hip+.3,eave+rise+.25,0)],.115,m.ridge);
    for(const s of [-1,1]) {
      line(g,[new T.Vector3(s*(a-hip-.1),eave+rise+.13,0),new T.Vector3(s*(a-hip+.34),eave+rise+.25,0),new T.Vector3(s*(a-hip+.48),eave+rise+.69,.02)],.095,m.ridge);
    }
  }
  function lattice(parent:T.Group,x:number,y:number,z:number,w:number,h:number) {
    box(parent,x,y,z,w,h,.10,m.woodDark);
    box(parent,x,y,z+.061,w-.13,h-.13,.04,m.window);
    for(let dx=-w/2+.07;dx<=w/2;dx+=w/5)box(parent,x+dx,y,z+.12,.045,h,.055,m.wood);
    for(let dy=-h/2+.04;dy<=h/2;dy+=h/5)box(parent,x,y+dy,z+.12,w,.045,.055,m.wood);
    box(parent,x,y-h/2-.065,z+.10,w+.12,.13,.16,m.woodLight);
    box(parent,x,y+h/2+.045,z+.10,w+.12,.1,.16,m.woodLight);
  }
  function lantern(parent:T.Group,x:number,y:number,z:number) {
    cylinder(parent,x,y+.35,z,.024,.45,m.woodDark);
    const bulb=add(parent,new T.SphereGeometry(.26,10,8),m.lantern,x,y,z);bulb.scale.set(.92,1.25,.92);
    cylinder(parent,x,y+.31,z,.14,.065,m.gold);cylinder(parent,x,y-.31,z,.12,.065,m.gold);
    cylinder(parent,x,y-.49,z,.025,.25,m.gold);
    for(let i=0;i<6;i++){const a=i*Math.PI/3;line(parent,[new T.Vector3(x+.1*Math.cos(a),y-.30,z+.1*Math.sin(a)),new T.Vector3(x+.25*Math.cos(a),y,z+.25*Math.sin(a)),new T.Vector3(x+.1*Math.cos(a),y+.30,z+.1*Math.sin(a))],.012,m.gold);}
  }
  function building(x:number,z:number,w:number,d:number,h:number,rotation=0,grand=false) {
    const g = new T.Group();root.add(g);g.position.set(x,0,z);g.rotation.y=rotation;
    box(g,0,.2,0,w+.85,.4,d+1.05,m.stone);
    box(g,0,.43,0,w+.65,.10,d+.85,m.stoneLight);
    box(g,0,1.0,-.15,w,.95,d-.35,m.plaster);
    box(g,0,(h+.45)/2,-d/2+.1,w,h-.45,.23,m.plaster);
    box(g,-w/2+.1,(h+.45)/2,0,.22,h-.45,d,m.plaster);
    box(g,w/2-.1,(h+.45)/2,0,.22,h-.45,d,m.plaster);
    box(g,0,.5,0,w-.3,.06,d-.3,m.woodLight);
    const bays=Math.max(3,Math.round(w/2.1));
    for(let i=0;i<=bays;i++){
      const cx=-w/2+i*w/bays;
      cylinder(g,cx,.61,d/2,.22,.24,m.stoneLight);
      cylinder(g,cx,(h+.55)/2,d/2,.105,h-.55,m.wood);
      box(g,cx,h-.20,d/2,.46,.14,.42,m.woodLight);
      box(g,cx,h-.05,d/2,.70,.14,.62,m.wood);
      for(const sign of [-1,1])beam(g,new T.Vector3(cx,h-.75,d/2),new T.Vector3(cx+sign*.47,h-.18,d/2),.042,m.woodLight);
    }
    const facadeZ=d/2-.52;
    for(let i=0;i<bays;i++){
      const cx=-w/2+(i+.5)*w/bays,bw=w/bays-.20;
      if(Math.abs(cx)<w/bays*.58){
        for(const side of [-1,1]){
          const doorX=cx+side*bw*.25;
          box(g,doorX,1.70,facadeZ,bw*.47,2.42,.16,m.door);
          lattice(g,doorX,2.12,facadeZ+.10,bw*.39,1.25);
          cylinder(g,doorX,1.35,facadeZ+.13,.065,.05,m.gold).rotation.x=Math.PI/2;
        }
      } else {
        box(g,cx,1.05,facadeZ,bw,1.1,.18,m.plaster);
        lattice(g,cx,(h+1.1)/2,facadeZ+.11,bw-.16,h-1.5);
      }
    }
    box(g,0,h-.12,d/2,w+.20,.27,.22,m.wood);
    box(g,0,h+.06,0,w+.27,.20,d+.28,m.woodDark);
    for(let i=0;i<3;i++)box(g,0,.08+i*.12,d/2+.98-i*.25,grand?4:2.7,.16,.45,m.stoneLight);
    for(const side of [-1,1])lantern(g,side*(grand?3:Math.min(2.3,w*.32)),h-.72,d/2+.16);
    if(grand){
      box(g,0,h-.56,d/2+.15,2.1,.62,.15,m.woodDark);
      box(g,0,h-.87,d/2+.25,2.16,.045,.06,m.gold);box(g,0,h-.24,d/2+.25,2.16,.045,.06,m.gold);
      if(typeof document!=='undefined'){
        const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
        const context=canvas.getContext('2d');
        if(context){
          context.fillStyle='#30251c';context.fillRect(0,0,512,128);
          context.fillStyle='#d5b46c';context.font='84px \"Songti SC\", \"STSong\", serif';context.textAlign='center';context.textBaseline='middle';
          context.fillText(z>12?'栖云府':z>0?'承礼堂':'栖云堂',256,67);
          const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
          const sign=material('#ffffff',{map:texture,roughness:1});
          add(g,new T.PlaneGeometry(1.94,.47),sign,0,h-.55,d/2+.24);
        }
      }
    }
    roof(g,w+1.65,d+1.6,h+.12,grand?2.1:1.55);
    return g;
  }
  // A stepped island plinth holds all three courtyards and the side garden.
  box(root,0,-.90,0,36.8,.55,41.8,m.plinth);
  box(root,0,-.56,0,37.2,.16,42.2,m.stoneLight);
  box(root,0,-.26,0,36.6,.48,41.6,m.earth);
  box(root,0,.015,0,35.7,.06,40.7,m.paver);
  box(root,0,-.51,0,37.26,.045,42.26,m.gold);
  // Paving slabs are actual geometry, varied deterministically.
  for(let x=-17.1;x<17.2;x+=1.12)for(let z=-19.8;z<20;z+=1.18){
    if(rand()<.26)box(root,x,.062,z,1.08,.025,1.14,rand()>.45?m.stoneLight:m.stone);
  }
  // Broad central stone path.
  for(let z=-18.7;z<20;z+=.81)box(root,-3,.095,z,2.12,.09,.76,m.stoneLight);
  building(-3,16,7.2,3.5,3.45,0,true);
  building(-3,6.4,12,4.4,3.8,0,true);
  building(-3,-5.5,13,4.9,4.35,0,true);
  building(-3,-15.5,12.6,4.2,3.65);
  building(-12,0,9.3,3.6,3.35,Math.PI/2);
  building(6,0,9.3,3.6,3.35,-Math.PI/2);
  building(-12,11.3,5.4,3.6,3.1,Math.PI/2);
  building(6,11.3,5.4,3.6,3.1,-Math.PI/2);
  building(-12,-11.3,4.1,3.6,3.2,Math.PI/2);
  building(6,-11.3,4.1,3.6,3.2,-Math.PI/2);
  function corridor(x:number,z:number,length:number,rotation=0) {
    const g=new T.Group();root.add(g);g.position.set(x,0,z);g.rotation.y=rotation;
    box(g,0,.18,0,length,.34,1.5,m.stoneLight);
    const count=Math.ceil(length/2.5);
    for(let i=0;i<=count;i++)for(const side of [-1,1]){
      const dx=-length/2+i*length/count;
      cylinder(g,dx,1.50,side*.58,.074,2.7,m.wood);
      box(g,dx,2.66,side*.58,.34,.18,.32,m.woodLight);
      if(i<count){box(g,dx+length/count/2,.8,side*.58,length/count,.065,.075,m.wood);}
    }
    for(const side of [-1,1])box(g,0,2.8,side*.58,length+.3,.20,.15,m.wood);
    roof(g,length+.6,2.05,2.87,.7);
  }
  corridor(-9.2,11.1,5.9,Math.PI/2);corridor(3.2,11.1,5.9,Math.PI/2);
  corridor(-9.2,.2,6.75,Math.PI/2);corridor(3.2,.2,6.75,Math.PI/2);
  corridor(-9.2,-10.8,5.25,Math.PI/2);corridor(3.2,-10.8,5.25,Math.PI/2);
  function wall(x:number,z:number,length:number,rotation=0,h=2.20){
    const g=new T.Group();g.position.set(x,0,z);g.rotation.y=rotation;root.add(g);
    box(g,0,h/2,0,length,h,.34,m.plaster);box(g,0,.27,0,length,.45,.40,m.stone);
    box(g,0,h+.06,0,length+.1,.12,.58,m.roof);
    for(let k=-length/2;k<=length/2;k+=.25)cylinder(g,k,h+.13,0,.064,.62,m.tile).rotation.x=Math.PI/2;
  }
  wall(-10.6,18.8,12.3);wall(9.8,18.8,14.2);wall(-16.8,-.2,38,Math.PI/2);wall(16.8,-.2,38,Math.PI/2);wall(0,-19.2,33.6);
  // The front boundary remains open through the central gate approach.
  function moonGate() {
    const s=new T.Shape();s.moveTo(-3.2,0);s.lineTo(3.2,0);s.lineTo(3.2,2.9);s.lineTo(-3.2,2.9);s.closePath();
    const hole=new T.Path();hole.absarc(0,1.35,1.15,0,Math.PI*2,true);s.holes.push(hole);
    const g=new T.Group();root.add(g);g.position.set(8.5,0,-10.4);g.rotation.y=Math.PI/2;
    add(g,new T.ExtrudeGeometry(s,{depth:.27,bevelEnabled:false,curveSegments:36}),m.plaster);
    const ring=add(g,new T.TorusGeometry(1.15,.075,6,48),m.stoneLight,0,1.35,.17);
    box(g,0,2.96,.13,6.6,.13,.52,m.roof);
    ring.receiveShadow=true;
  }
  moonGate();
  function tree(x:number,z:number,height=4.5,pine=false) {
    const g=new T.Group();g.position.set(x,.12,z);root.add(g);
    cylinder(g,0,.12,0,1.07,.23,m.stoneLight);cylinder(g,0,.24,0,.93,.08,m.grass);
    beam(g,new T.Vector3(0,.2,0),new T.Vector3(.20,height*.75,.05),.12,m.woodDark);
    for(let i=0;i<7;i++){
      const a=i*2.4,r=.65+rand()*.55,y=height*(.55+rand()*.45);
      const point=new T.Vector3(Math.cos(a)*r,y,Math.sin(a)*r);
      beam(g,new T.Vector3(.1,height*.46,0),point,.048,m.woodDark);
      const crown=add(g,sphere,pine?m.pine:i%2?m.foliage:m.foliageLight,point.x,point.y,point.z);
      crown.scale.set(1.05+rand()*.45,pine?.45:.8+rand()*.35,.9+rand()*.45);crown.rotation.set(rand(),rand(),rand());
    }
  }
  tree(-6.6,11,3.6);tree(.6,11,3.6);tree(-6.7,.1,4.1);tree(.7,.1,3.8);
  tree(-6.5,-11.2,3.4);tree(.7,-11.3,3.6);tree(12,-14.8,4.5,true);tree(12,14.5,4.6,true);tree(14.7,3,3.6,true);
  function roundedRect(w:number,d:number,r:number){const s=new T.Shape();s.moveTo(-w/2+r,-d/2);s.lineTo(w/2-r,-d/2);s.quadraticCurveTo(w/2,-d/2,w/2,-d/2+r);s.lineTo(w/2,d/2-r);s.quadraticCurveTo(w/2,d/2,w/2-r,d/2);s.lineTo(-w/2+r,d/2);s.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r);s.lineTo(-w/2,-d/2+r);s.quadraticCurveTo(-w/2,-d/2,-w/2+r,-d/2);return s;}
  const pondBase=add(root,new T.ExtrudeGeometry(roundedRect(6.6,10.8,1.7),{depth:.17,bevelEnabled:false}),m.stoneLight,12,.16,-2.5);pondBase.rotation.x=-Math.PI/2;
  const water=add(root,new T.ShapeGeometry(roundedRect(6.15,10.3,1.5),28),m.water,12,.20,-2.5);water.rotation.x=-Math.PI/2;
  // Lotus leaves and a small arched bridge.
  for(let i=0;i<16;i++){
    const x=10+rand()*3.5,z=-6.5+rand()*7;
    const leaf=add(root,new T.CircleGeometry(.18+rand()*.15,12),m.leaf,x,.23,z);leaf.rotation.x=-Math.PI/2;
    if(i%4===0){const flower=add(root,sphere,m.lotus,x,.31,z);flower.scale.set(.14,.12,.14);}
  }
  for(let i=0;i<24;i++){
    const a=i/24*Math.PI*2;
    if(Math.abs(Math.sin(a))<.3)continue;
    const rock=add(root,sphere,m.rock,12+Math.cos(a)*3.2,.22,-2.5+Math.sin(a)*5.3);rock.scale.set(.25+rand()*.24,.18+rand()*.26,.24+rand()*.20);
  }
  for(let i=0;i<20;i++){
    const x=8.5+i*.37,y=.24+Math.sin(i/19*Math.PI)*.73;
    box(root,x,y,-2.7,.39,.17,1.38,m.woodLight);
    if(i%3===0)for(const side of [-1,1])cylinder(root,x,y+.4,-2.7+side*.66,.047,.85,m.wood);
  }
  for(const side of [-1,1]){
    const pts=[];for(let i=0;i<20;i++)pts.push(new T.Vector3(8.5+i*.37,1.06+Math.sin(i/19*Math.PI)*.73,-2.7+side*.66));
    line(root,pts,.055,m.wood);
  }
  const pavilion=new T.Group();root.add(pavilion);pavilion.position.set(12,0,9);
  box(pavilion,0,.22,0,4.2,.44,4.2,m.stoneLight);box(pavilion,0,.48,0,3.9,.09,3.9,m.woodLight);
  for(const x of [-1.55,1.55])for(const z of [-1.55,1.55]){
    cylinder(pavilion,x,1.8,z,.11,2.7,m.wood);box(pavilion,x,3.02,z,.4,.18,.4,m.woodLight);
  }
  for(const s of [-1,1]){box(pavilion,s*1.55,.85,0,.38,.10,2.8,m.wood);box(pavilion,s*1.55,3.13,0,.18,.2,3.3,m.wood);box(pavilion,0,3.13,s*1.55,3.3,.2,.18,m.wood);}
  cylinder(pavilion,0,.85,0,.55,.10,m.stoneLight);cylinder(pavilion,0,.64,0,.16,.35,m.stoneLight);
  roof(pavilion,4.9,4.9,3.27,1.9);lantern(pavilion,0,2.6,0);
  // Scholar rocks, bamboo and garden stepping stones.
  for(let i=0;i<7;i++){
    const rock=add(root,sphere,m.rock,10.5+rand()*3,.3+rand()*.45,-10.8+rand()*2.2);rock.scale.set(.5+rand()*.45,.7+rand()*1.3,.4+rand()*.4);rock.rotation.z=rand()*.6;
  }
  for(let i=0;i<17;i++){
    const x=14.5+rand()*.75,z=-13.3+rand()*3.5,h=2+rand()*1.6;
    cylinder(root,x,h/2,z,.038,h,m.pine);
    for(let j=0;j<4;j++){
      cylinder(root,x,.5+j*.65,z,.045,.045,m.foliageLight);
      const leaf=add(root,sphere,m.pine,x+(j%2?-.19:.19),h*.5+j*.3,z);leaf.scale.set(.38,.07,.19);leaf.rotation.z=j%2?.45:-.45;
    }
  }
  for(let i=0;i<9;i++)box(root,11.6+Math.sin(i*.7)*.7,.14,3.6+i*.37,.8,.16,.55,m.stoneLight);
  // Paired stone guardians on the entrance steps.
  for(const x of [-7.7,1.7]){
    box(root,x,.32,18, .8,.55,.9,m.stone);box(root,x,.64,18,.91,.11,1.0,m.stoneLight);
    const body=add(root,sphere,m.stoneLight,x,1.06,18);body.scale.set(.30,.50,.36);
    const head=add(root,sphere,m.stoneLight,x,1.55,18.08);head.scale.set(.32,.31,.30);
    for(const side of [-1,1])box(root,x+side*.23,.86,18.25,.13,.47,.22,m.stoneLight);
  }
  // Merge by material and roof layer, reducing thousands of details to a few draw calls.
  root.updateMatrixWorld(true);
  const buckets=new Map<string,{material:T.Material,geometries:T.BufferGeometry[],isRoof:boolean}>();
  root.traverse(obj=>{
    if(!(obj instanceof T.Mesh) || Array.isArray(obj.material))return;
    let parent:T.Object3D|null=obj;let isRoof=false;
    while(parent){if(parent.userData.roof)isRoof=true;parent=parent.parent;}
    const key=obj.material.uuid+String(isRoof);
    if(!buckets.has(key))buckets.set(key,{material:obj.material,geometries:[],isRoof});
    const geo=(obj.geometry.index?obj.geometry.toNonIndexed():obj.geometry.clone()).applyMatrix4(obj.matrixWorld);
    for(const key of Object.keys(geo.attributes))if(!['position','normal','uv'].includes(key))geo.deleteAttribute(key);
    if(!geo.getAttribute('uv'))geo.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(geo.getAttribute('position').count*2),2));
    buckets.get(key)!.geometries.push(geo);
  });
  const oldGeometries=new Set<T.BufferGeometry>();root.traverse(obj=>{if(obj instanceof T.Mesh)oldGeometries.add(obj.geometry);});
  root.clear();root.add(fixed,roofs);
  for(const bucket of buckets.values()){
    const geometry=mergeGeometries(bucket.geometries,false);
    if(!geometry)throw new Error('模型几何合并失败');
    const mesh=add(bucket.isRoof?roofs:fixed,geometry,bucket.material);mesh.name=bucket.isRoof?'瓦作':'建筑与园林';
    bucket.geometries.forEach(g=>g.dispose());
  }
  oldGeometries.forEach(g=>g.dispose());
  unitBox.dispose();unitCylinder.dispose();sphere.dispose();
  return {root,roofs,materials:m};
}
