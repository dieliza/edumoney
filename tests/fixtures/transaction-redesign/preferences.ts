const prefix='edumoney-ui-review:';
export default {getItem:async(key:string)=>localStorage.getItem(prefix+key),setItem:async(key:string,value:string)=>{localStorage.setItem(prefix+key,value);},removeItem:async(key:string)=>{localStorage.removeItem(prefix+key);}};
