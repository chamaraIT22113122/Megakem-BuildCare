const prods = [
  'Megalastic Super 540 36 Kg', 
  'MEGATITANIUM - White 20Kg', 
  'MEGATITANIUM 1 Kg - YELLOW', 
  'Megaproof Grey 4 kg', 
  'Megaproof White 1 kg - Ultra', 
  'Ecolastic 32 Kg Set', 
  'Megamix SBR 1L (New Formula)', 
  'MEGA SHIELD B 5010 10L CAN'
]; 
const sizeRegex = /\b(\d+(?:\.\d+)?\s*(?:Kg|kg|KG|g|G|Ltr|ltr|L|l|ML|ml)(?:\s*(?:Set|CAN|Can|can))?)\b/i; 
const knownColors = ['White', 'Light Grey', 'Grey', 'Black', 'Yellow', 'Clear', 'Red', 'Blue', 'Green', 'Orange']; 

prods.forEach(p => { 
  let size = ''; 
  const sm = p.match(sizeRegex); 
  if(sm) size = sm[1]; 
  
  let color = 'Default'; 
  for(const c of knownColors) { 
    if(new RegExp('\\b'+c+'\\b', 'i').test(p)) { 
      color = c; 
      break; 
    } 
  } 
  
  let base = p; 
  if(size) base = base.replace(sm[0], ''); 
  if(color !== 'Default') base = base.replace(new RegExp('\\b'+color+'\\b', 'i'), ''); 
  
  base = base.replace(/[\-\s]+/g, ' ').replace(/\s{2,}/g, ' ').trim(); 
  console.log(`${p} => BASE: [${base}] | SIZE: [${size}] | COLOR: [${color}]`); 
});
