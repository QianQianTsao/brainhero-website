document.querySelector('.hamburger')?.addEventListener('click',e=>{
  const m=document.querySelector('.mobile-menu');
  const b=e.currentTarget;
  const open=m.hidden;
  m.hidden=!open;
  b.setAttribute('aria-expanded', open?'true':'false');
});
document.querySelectorAll('.mobile-menu a').forEach(a=>a.addEventListener('click',()=>{
  document.querySelector('.mobile-menu').hidden=true;
  document.querySelector('.hamburger').setAttribute('aria-expanded','false');
}));
