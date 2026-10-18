(() => {
  'use strict';
  const endpoint = 'https://avrtxtevrkckywptiiwb.supabase.co/functions/v1/leapi-guest-vote';
  const token = location.hash.slice(1);
  const byId = id => document.getElementById(id);
  const intro=byId('intro'), ballot=byId('ballot'), notice=byId('notice'), thanks=byId('thanks');
  const review=byId('review'), confirm=byId('confirm'), send=byId('send'), cancel=byId('cancel');
  const photo=byId('chosen-photo'), copy=byId('confirm-copy'), sendError=byId('send-error');
  let works=[], selected=null, submitting=false;
  function message(text) { notice.textContent=text; notice.hidden=false; }
  function finished(already) {
    if (confirm.open) confirm.close();
    intro.hidden=true; ballot.hidden=true; notice.hidden=true; thanks.hidden=false;
    byId('thanks-title').textContent=already?'Ваш голос уже учтён':'Спасибо за ваш голос!';
    byId('thanks-title').setAttribute('tabindex','-1'); byId('thanks-title').focus();
  }
  async function api(action, workId) {
    const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),12000);
    try {
      const response=await fetch(endpoint,{method:'POST',credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({action,work_id:workId}),signal:controller.signal});
      const data=await response.json();
      if (!data || typeof data.status!=='string') throw new Error('unavailable');
      if (data.status==='invalid'||data.status==='closed') throw new Error('expired');
      if (data.status==='rate_limited') throw new Error('rate');
      if (!response.ok) throw new Error('unavailable');
      return data;
    } finally { clearTimeout(timer); }
  }
  function safeImage(value) {
    const u=new URL(value);
    if(u.origin!=='https://avrtxtevrkckywptiiwb.supabase.co'||!u.pathname.startsWith('/storage/v1/object/public/apia-media/')) throw new Error('unavailable');
    return u.href;
  }
  function render(items) {
    if(!Array.isArray(items)||items.length===0||items.length>30) throw new Error('empty');
    const fragment=document.createDocumentFragment();
    works=items.map((w,index)=>{
      if(!w||typeof w.id!=='string'||typeof w.name!=='string') throw new Error('unavailable');
      const image=safeImage(w.image);
      const label=document.createElement('label');label.className='work';
      const radio=document.createElement('input');radio.type='radio';radio.name='work';radio.value=w.id;radio.setAttribute('aria-label',w.name);
      const card=document.createElement('span');card.className='work-card';
      const img=document.createElement('img');img.src=image;img.alt=w.name;img.loading=index<2?'eager':'lazy';img.decoding='async';
      const caption=document.createElement('span');caption.className='work-caption';
      const name=document.createElement('span');name.textContent=w.name;
      const tick=document.createElement('span');tick.className='checkmark';tick.textContent='✓';tick.setAttribute('aria-hidden','true');
      caption.append(name,tick);card.append(img,caption);label.append(radio,card);fragment.append(label);
      radio.addEventListener('change',()=>{selected=w;review.disabled=false;});
      return {...w,image};
    });
    byId('works').replaceChildren(fragment);ballot.hidden=false;notice.hidden=true;
  }
  review.addEventListener('click',()=>{
    if(!selected||submitting) return;
    const w=works.find(w=>w.id===selected.id); if(!w) return;
    photo.src=w.image;photo.alt='Выбранная работа — '+w.name;
    copy.textContent=w.name+'. Подтверждаете свой выбор?';sendError.hidden=true;
    confirm.showModal();cancel.focus();
  });
  cancel.addEventListener('click',()=>{if(!submitting)confirm.close();});
  confirm.addEventListener('cancel',e=>{if(submitting)e.preventDefault();});
  send.addEventListener('click',async()=>{
    if(!selected||submitting)return;
    submitting=true;send.disabled=true;cancel.disabled=true;send.textContent='Сохраняем ваш голос…';sendError.hidden=true;
    try {
      const data=await api('vote',selected.id);
      if(!['accepted','already_voted'].includes(data.status))throw new Error('unavailable');
      finished(data.status==='already_voted');
    } catch(error) {
      sendError.textContent=error.message==='expired'?'Приглашение больше не действует. Попросите администратора выдать новое.':error.message==='rate'?'Слишком много попыток. Подождите минуту.':'Не удалось подтвердить отправку. Попробуйте ещё раз — повторный голос не добавится.';
      sendError.hidden=false;
    } finally {
      submitting=false;send.disabled=false;cancel.disabled=false;send.textContent='Да, проголосовать';
    }
  });
  (async()=>{
    if(!/^[A-Za-z0-9_-]{43}$/.test(token)){message('Для голосования откройте персональную ссылку или QR-код, который выдал администратор.');return;}
    try {
      const data=await api('load');
      if(data.status==='already_voted'){finished(true);return;}
      if(data.status!=='ready')throw new Error('unavailable');
      render(data.works);
    }catch(error){message(error.message==='expired'?'Приглашение больше не действует. Попросите администратора выдать новое.':error.message==='empty'?'Работы готовятся к показу. Пожалуйста, обратитесь к администратору.':error.message==='rate'?'Подождите минуту и снова откройте приглашение.':'Не удалось загрузить работы. Обновите страницу немного позже.');}
  })();
})();
