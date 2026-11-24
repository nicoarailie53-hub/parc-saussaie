path = 'C:/proiect-parc/index.html'
with open(path, encoding='utf-8') as f:
    s = f.read()

old = """  [1,2,3,4].forEach(n=>eq.acti['ACTI'+n]={
    tenant:'',surface:'',doors:{d1:'OK',d2:'OK',d3:'OK'},logs:[]}
  });"""

new = """  [1,2,3,4].forEach(n=>{
    const i='ACTI'+n;
    eq.acti[i]={tenant:'',surface:'',doors:{d1:'OK',d2:'OK',d3:'OK'},logs:[]};
  });"""

if old in s:
    s = s.replace(old, new, 1)
    print('OK acti forEach replaced')
else:
    print('MISS acti forEach')

with open(path, 'w', encoding='utf-8') as f:
    f.write(s)
