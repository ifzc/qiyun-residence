import type { SceneOptions, ViewName } from './mansion-scene';
type Registry = { registerTool:(tool:{name:string;title:string;description:string;inputSchema:object;annotations:{readOnlyHint:boolean;untrustedContentHint:boolean};execute:(input:unknown)=>Promise<unknown>},options:{signal:AbortSignal})=>unknown };
export function registerMansionTools(apply:(view:ViewName,options:Partial<SceneOptions>)=>void,isReady:()=>boolean){
  const context=(document as Document & {modelContext?:Registry}).modelContext;
  if(!context?.registerTool)return;
  const lifecycle=new AbortController();
  try{
    Promise.resolve(context.registerTool({
      name:'configure_mansion_view', title:'观览栖云府',
      description:'切换府邸三维模型的游览视角，可同时设置屋顶、建筑标注、自动环游和日夜光照。',
      inputSchema:{type:'object',properties:{view:{type:'string',enum:['overview','top','courtyard','garden']},roofs:{type:'boolean'},labels:{type:'boolean'},rotate:{type:'boolean'},night:{type:'boolean'}},required:['view'],additionalProperties:false},
      annotations:{readOnlyHint:false,untrustedContentHint:false},
      async execute(input:unknown){
        if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('请输入有效的观览设置');
        const data=input as Record<string,unknown>;
        if(!['overview','top','courtyard','garden'].includes(data.view as string))throw new Error('未知游览视角');
        const allowed=['view','roofs','labels','rotate','night'];
        if(Object.keys(data).some(key=>!allowed.includes(key)))throw new Error('包含不支持的设置');
        const settings:Partial<SceneOptions>={};
        for(const key of ['roofs','labels','rotate','night'] as const){
          if(key in data){if(typeof data[key]!=='boolean')throw new Error(`${key} 必须是布尔值`);settings[key]=data[key];}
        }
        if(!isReady())throw new Error('模型尚未载入，请稍后重试');
        apply(data.view as ViewName,settings);
        await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
        return {view:data.view,...settings};
      },
    },{signal:lifecycle.signal})).catch(()=>{});
  }catch{/* Browsers without the proposed API keep the standard interface. */}
  return ()=>lifecycle.abort();
}
