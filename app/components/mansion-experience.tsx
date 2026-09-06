'use client';
import { useEffect, useRef, useState } from 'react';
import { Box, Grid2X2, DoorOpen, Flower2, Maximize, Minimize, Sun, Moon, Plus, Minus, RotateCcw, MousePointer2, Move, SlidersHorizontal, Scan } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { registerMansionTools } from './mansion-agent-tools';
import type { SceneApi, SceneOptions, ViewName } from './mansion-scene';

const views = [
  {id:'overview' as const, label:'府邸全景', icon:Box, description:'一览三进院落与池畔园林'},
  {id:'top' as const, label:'院落俯瞰', icon:Grid2X2, description:'从上方观察府邸布局'},
  {id:'courtyard' as const, label:'步入庭院', icon:DoorOpen, description:'走近正堂，细看木作与檐下光影'},
  {id:'garden' as const, label:'池畔游园', icon:Flower2, description:'移步侧园，赏亭台与小桥'},
];
export default function MansionExperience(){
  const host=useRef<HTMLDivElement>(null),labelHost=useRef<HTMLDivElement>(null),compass=useRef<HTMLSpanElement>(null),container=useRef<HTMLElement>(null);
  const api=useRef<SceneApi|null>(null);
  const [ready,setReady]=useState(false),[error,setError]=useState(''),[retry,setRetry]=useState(0);
  const [view,setView]=useState<ViewName>('overview');
  const [options,setOptions]=useState<SceneOptions>({roofs:true,labels:false,rotate:false,night:false});
  const [fullscreen,setFullscreen]=useState(false);
  const optionRef=useRef(options);optionRef.current=options;
  const [notice,setNotice]=useState('');
  const readyRef=useRef(false);readyRef.current=ready&&!error;
  useEffect(()=>registerMansionTools((nextView,nextOptions)=>{
    setView(nextView);api.current?.setView(nextView);setOptions(o=>({...o,rotate:false,...nextOptions}));
  },()=>readyRef.current),[]);
  useEffect(()=>{
    let active=true;
    setReady(false);setError('');
    import('./mansion-scene').then(({mountMansion})=>{
      if(!active||!host.current||!labelHost.current||!compass.current)return;
      try{
        api.current=mountMansion(host.current,labelHost.current,compass.current,()=>{if(active)setReady(true);},message=>{if(active)setError(message);});
        api.current.setOptions(optionRef.current);
      }catch{setError('无法显示三维模型，请确认浏览器已开启硬件加速，或使用新版浏览器重试。');}
    }).catch(()=>{if(active)setError('模型载入失败，请检查网络后重试。');});
    return()=>{active=false;api.current?.dispose();api.current=null;};
  },[retry]);
  useEffect(()=>{api.current?.setOptions(options);},[options]);
  useEffect(()=>{
    const update=()=>setFullscreen(!!document.fullscreenElement);document.addEventListener('fullscreenchange',update);
    return()=>document.removeEventListener('fullscreenchange',update);
  },[]);
  function goTo(id:ViewName){setView(id);api.current?.setView(id);setOptions(o=>({...o,rotate:false}));}
  function changeOption(key:keyof SceneOptions,value:boolean){setOptions(o=>({...o,[key]:value}));}
  async function toggleFullscreen(){
    try{if(document.fullscreenElement)await document.exitFullscreen();else if(container.current?.requestFullscreen)await container.current.requestFullscreen();else setNotice('当前浏览器不支持全屏，请横屏查看。');}
    catch{setNotice('暂时无法进入全屏，可以直接在当前窗口浏览。');}
  }
  const selected=views.find(v=>v.id===view)!;
  return <main ref={container} className="experience">
    <div ref={host} className="scene" />
    <div className="scene-vignette" />
    <div ref={labelHost} className="scene-labels" aria-hidden="true" />
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true"><Scan size={23} strokeWidth={1}/></div>
        <div><span className="brand-name">观筑</span><span className="brand-en">GUANZHU STUDIO</span></div>
      </div>
      <div className="top-right"><span><i className="live-dot"/>三维建筑漫游</span><button className="icon-button" onClick={toggleFullscreen} title={fullscreen?'退出全屏':'全屏浏览'} aria-label={fullscreen?'退出全屏':'全屏浏览'}>{fullscreen?<Minimize size={17}/>:<Maximize size={17}/>}</button></div>
    </header>
    <section className="introduction" aria-labelledby="mansion-title">
      <div className="eyebrow">中国古典宅院 · 01</div>
      <h1 id="mansion-title">栖云府<span className="seal">雅居</span></h1>
      <div className="title-english">THE QIYUN RESIDENCE</div>
      <p className="description">一重院落，一方天地。<br/>循着青石小径，<br/>走进檐下的东方日常。</p>
      <div className="divider"/>
      <div className="facts"><div><strong>三</strong><span>进院落</span></div><div><strong>十</strong><span>座厅舍</span></div><div><strong>一</strong><span>方园林</span></div></div>
      <p className="model-note">中式府邸意象创作 · 非历史复原</p>
    </section>
    <div className="compass" aria-hidden="true"><span className="compass-n">N</span><span ref={compass} className="compass-arrow"/></div>
    <div className="zoom-controls" aria-label="视角调整">
      <button className="icon-button" disabled={!ready} onClick={()=>api.current?.zoom(1)} aria-label="放大模型" title="放大"><Plus size={17}/></button>
      <button className="icon-button" disabled={!ready} onClick={()=>api.current?.zoom(-1)} aria-label="缩小模型" title="缩小"><Minus size={17}/></button>
      <button className="icon-button" disabled={!ready} onClick={()=>goTo('overview')} aria-label="重置视角" title="重置视角"><RotateCcw size={15}/></button>
    </div>
    <div className="view-info" aria-live="polite"><span className="view-number">0{views.findIndex(v=>v.id===view)+1}</span><div><strong>{selected.label}</strong><p>{notice||selected.description}</p></div></div>
    <aside className="control-panel" aria-label="模型显示设置">
      <div className="panel-title">观览设置<SlidersHorizontal size={13}/></div>
      <div className="control-row"><label htmlFor="roof-toggle">显示屋顶</label><Switch id="roof-toggle" checked={options.roofs} onCheckedChange={v=>changeOption('roofs',v)} disabled={!ready}/></div>
      <div className="control-row"><label htmlFor="label-toggle">建筑标注</label><Switch id="label-toggle" checked={options.labels} onCheckedChange={v=>changeOption('labels',v)} disabled={!ready}/></div>
      <div className="control-row"><label htmlFor="rotate-toggle">缓缓环游</label><Switch id="rotate-toggle" checked={options.rotate} onCheckedChange={v=>changeOption('rotate',v)} disabled={!ready}/></div>
      <div className="lighting" aria-label="光照"><button onClick={()=>changeOption('night',false)} aria-pressed={!options.night} aria-label="日景" disabled={!ready}><Sun size={15}/>日景</button><button onClick={()=>changeOption('night',true)} aria-pressed={options.night} aria-label="夜景" disabled={!ready}><Moon size={15}/>夜景</button></div>
    </aside>
    <footer className="bottom-bar">
      <nav className="view-controls" aria-label="府邸游览视角">{views.map(({id,label,icon:Icon})=><button key={id} disabled={!ready} onClick={()=>goTo(id)} aria-pressed={view===id}><Icon size={17} strokeWidth={1.5}/>{label}</button>)}</nav>
      <div className="bottom-meta"><span>以方寸，见天地</span><div className="interaction-hint"><span><MousePointer2 size={13}/>拖动旋转</span><span><Move size={13}/>滚轮 / 双指缩放</span><span>右键拖动平移</span></div><span>中国建筑意象 / 001</span></div>
    </footer>
    {!ready&&!error&&<div className="loading" role="status"><div className="loading-icon"/><span>正在构筑栖云府</span></div>}
    {error&&<div className="loading error" role="alert"><span style={{maxWidth:360,lineHeight:1.9,padding:20}}>{error}</span><button onClick={()=>{setView('overview');setRetry(n=>n+1);}}>重新载入</button></div>}
    <noscript><div className="loading">请启用 JavaScript 以浏览三维府邸。</div></noscript>
  </main>;
}
