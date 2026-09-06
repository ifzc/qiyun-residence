import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createMansion, landmarks } from './mansion-model';

export type ViewName = 'overview' | 'top' | 'courtyard' | 'garden';
export type SceneOptions = { roofs: boolean; labels: boolean; rotate: boolean; night: boolean };
export type SceneApi = { setView:(view:ViewName)=>void; setOptions:(options:SceneOptions)=>void; zoom:(direction:number)=>void; dispose:()=>void };

export function mountMansion(host:HTMLElement, labelHost:HTMLElement, compass:HTMLElement, onReady:()=>void, onError:(message:string)=>void):SceneApi {
  const scene=new T.Scene();
  const renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.8));
  renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.32;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
  renderer.setClearColor('#26392e');
  renderer.domElement.setAttribute('aria-label','栖云府三维模型。拖动旋转，滚轮缩放，方向键平移。');
  renderer.domElement.tabIndex=0;
  host.appendChild(renderer.domElement);
  const camera=new T.PerspectiveCamera(36,1,.2,280);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true;controls.dampingFactor=.065;controls.minDistance=5;controls.maxDistance=125;
  controls.maxPolarAngle=Math.PI*.475;controls.minPolarAngle=.035;controls.autoRotateSpeed=.45;
  controls.enablePan=true;controls.screenSpacePanning=false;
  let model:ReturnType<typeof createMansion>;
  try { model=createMansion(); } catch(error) {renderer.dispose();renderer.domElement.remove();throw error;}
  scene.add(model.root);
  const ambient=new T.HemisphereLight('#e7edce','#475443',2.5);scene.add(ambient);
  const sun=new T.DirectionalLight('#ffe0a0',4.1);sun.position.set(-22,36,22);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-34;sun.shadow.camera.right=34;sun.shadow.camera.top=34;sun.shadow.camera.bottom=-34;
  sun.shadow.camera.near=1;sun.shadow.camera.far=100;sun.shadow.normalBias=.07;sun.shadow.bias=-.0001;sun.shadow.radius=3;
  scene.add(sun);
  const rim=new T.DirectionalLight('#bad4c0',1.1);rim.position.set(25,15,-25);scene.add(rim);
  const ground=new T.Mesh(new T.PlaneGeometry(500,500),new T.MeshStandardMaterial({color:'#304335',roughness:1}));
  ground.rotation.x=-Math.PI/2;ground.position.y=-1.23;ground.receiveShadow=true;scene.add(ground);
  scene.fog=new T.Fog('#26392e',110,210);
  const pools:T.PointLight[]=[];
  for(const pos of [[-3,2.4,17],[-3,2.7,7.7],[-3,3,-3],[12,2.5,9],[-7,2,0],[2,2,0]]){
    const light=new T.PointLight('#ffb45d',0,10,2);light.position.set(pos[0],pos[1],pos[2]);pools.push(light);scene.add(light);
  }
  let options:SceneOptions={roofs:true,labels:false,rotate:false,night:false};
  let targetNight=0,currentNight=0;
  let transition:{fromPosition:T.Vector3;toPosition:T.Vector3;fromTarget:T.Vector3;toTarget:T.Vector3;started:number}|null=null;
  const isSmall=()=>host.clientWidth<760;
  function preset(name:ViewName) {
    const mobile=isSmall();
    const choices={
      overview:{position:new T.Vector3(48,43,59).multiplyScalar(mobile?1.53:1),target:new T.Vector3(mobile?0:-2,0,0)},
      top:{position:new T.Vector3(-3, mobile?99:70,.2),target:new T.Vector3(-1,0,0)},
      courtyard:{position:new T.Vector3(1,7,3.8),target:new T.Vector3(-3,2,-5.6)},
      garden:{position:new T.Vector3(25,15,22),target:new T.Vector3(11,1,-1)},
    };
    return choices[name];
  }
  function framing(){
    const width=host.clientWidth,height=host.clientHeight;
    renderer.setSize(width,height,false);camera.aspect=width/height;
    // Reserve a quiet strip for the introductory copy without hiding the model.
    camera.setViewOffset(width,height,width>=1100?-width*.065:0,width<760?-height*.015:0,width,height);
    camera.updateProjectionMatrix();
  }
  framing();
  const initial=preset('overview');camera.position.copy(initial.position);controls.target.copy(initial.target);controls.update();
  const resize=new ResizeObserver(framing);resize.observe(host);
  const labels=landmarks.map(({name,position})=>{
    const el=document.createElement('span');el.className='scene-label';el.textContent=name;labelHost.appendChild(el);
    return {el,position:new T.Vector3(...position as [number,number,number])};
  });
  const screenPoint=new T.Vector3();
  let disposed=false,ready=false,lastFrame=0;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function setView(name:ViewName){
    const next=preset(name);
    transition={fromPosition:camera.position.clone(),toPosition:next.position,fromTarget:controls.target.clone(),toTarget:next.target,started:performance.now()};
    if(reduced){camera.position.copy(next.position);controls.target.copy(next.target);transition=null;controls.update();}
  }
  const cancelTransition=()=>{transition=null;};controls.addEventListener('start',cancelTransition);
  function keydown(e:KeyboardEvent){
    const amount=e.shiftKey?1.8:.65;
    if(e.key==='+'||e.key==='='){zoom(1);e.preventDefault();}
    else if(e.key==='-'){zoom(-1);e.preventDefault();}
    else if(e.key==='Home'){setView('overview');e.preventDefault();}
    else if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){
      transition=null;
      const forward=camera.getWorldDirection(new T.Vector3());forward.y=0;forward.normalize();
      const right=new T.Vector3().crossVectors(forward,new T.Vector3(0,1,0));
      const delta=(e.key==='ArrowUp'?forward:e.key==='ArrowDown'?forward.negate():e.key==='ArrowRight'?right:right.negate()).multiplyScalar(amount);
      controls.target.add(delta);camera.position.add(delta);controls.update();e.preventDefault();
    }
  }
  renderer.domElement.addEventListener('keydown',keydown);
  const contextLost=(event:Event)=>{event.preventDefault();renderer.setAnimationLoop(null);onError('三维画面已暂停，请重新载入模型。');};
  renderer.domElement.addEventListener('webglcontextlost',contextLost);
  function zoom(direction:number){
    transition=null;const offset=camera.position.clone().sub(controls.target);
    const distance=T.MathUtils.clamp(offset.length()*(direction>0?.83:1.2),controls.minDistance,controls.maxDistance);
    camera.position.copy(controls.target).add(offset.setLength(distance));controls.update();
  }
  const dayGround=new T.Color('#304335'),nightGround=new T.Color('#14252a');
  const dayFog=new T.Color('#26392e'),nightFog=new T.Color('#101f28');
  renderer.setAnimationLoop((time)=>{
    if(disposed||document.hidden)return;
    const delta=Math.min((time-lastFrame)/1000,.05);lastFrame=time;
    if(transition){
      const t=T.MathUtils.clamp((performance.now()-transition.started)/1100,0,1),e=1-Math.pow(1-t,3);
      camera.position.lerpVectors(transition.fromPosition,transition.toPosition,e);controls.target.lerpVectors(transition.fromTarget,transition.toTarget,e);
      if(t===1)transition=null;
    }
    controls.autoRotate=options.rotate&&!transition;
    controls.update(delta);
    currentNight=T.MathUtils.lerp(currentNight,targetNight,Math.min(1,delta*3));
    ambient.intensity=T.MathUtils.lerp(2.5,.55,currentNight);
    sun.intensity=T.MathUtils.lerp(4.1,.85,currentNight);
    sun.color.set(options.night?'#9bbad8':'#ffe0a0');
    rim.intensity=T.MathUtils.lerp(1.1,.65,currentNight);
    model.materials.lantern.emissiveIntensity=T.MathUtils.lerp(.12,2.6,currentNight);
    model.materials.window.emissiveIntensity=T.MathUtils.lerp(.06,1.0,currentNight);
    ground.material.color.lerpColors(dayGround,nightGround,currentNight);
    scene.fog!.color.lerpColors(dayFog,nightFog,currentNight);renderer.setClearColor(scene.fog!.color);
    for(const light of pools)light.intensity=25*currentNight;
    renderer.render(scene,camera);
    compass.style.transform=`rotate(${-T.MathUtils.radToDeg(controls.getAzimuthalAngle())}deg) scale(${isSmall()?.7:1})`;
    for(const label of labels){
      if(!options.labels){label.el.style.display='none';continue;}
      screenPoint.copy(label.position).project(camera);
      const visible=screenPoint.z<1&&screenPoint.z>-1&&Math.abs(screenPoint.x)<.97&&Math.abs(screenPoint.y)<.88;
      label.el.style.display=visible?'block':'none';
      if(visible)label.el.style.transform=`translate(-50%,-100%) translate(${(screenPoint.x*.5+.5)*host.clientWidth}px,${(-screenPoint.y*.5+.5)*host.clientHeight-18}px)`;
    }
    if(!ready){ready=true;onReady();}
  });
  return {
    setView,zoom,
    setOptions(next){options=next;model.roofs.visible=next.roofs;targetNight=next.night?1:0;},
    dispose(){
      disposed=true;renderer.setAnimationLoop(null);resize.disconnect();controls.removeEventListener('start',cancelTransition);controls.dispose();
      renderer.domElement.removeEventListener('keydown',keydown);renderer.domElement.removeEventListener('webglcontextlost',contextLost);
      scene.traverse(obj=>{if(obj instanceof T.Mesh){obj.geometry.dispose();const mats=Array.isArray(obj.material)?obj.material:[obj.material];mats.forEach(m=>{if(m instanceof T.MeshStandardMaterial)m.map?.dispose();m.dispose();});}});
      renderer.dispose();renderer.domElement.remove();labelHost.replaceChildren();
    },
  };
}
