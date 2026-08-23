import re,sys
def inl(t):
    t=t.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')
    return re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', t)
def conv(p):
    out=['<html><body style="font-family:Meiryo,sans-serif">']
    lines=open(p,encoding='utf-8').read().split('\n'); i=0
    while i<len(lines):
        s=lines[i].strip()
        if not s: i+=1; continue
        if s.startswith('|') and i+1<len(lines) and re.match(r'^\|[\s:\-|]+\|$',lines[i+1].strip()):
            hdr=[c.strip() for c in s.strip('|').split('|')]; i+=2; rows=[]
            while i<len(lines) and lines[i].strip().startswith('|'):
                rows.append([c.strip() for c in lines[i].strip().strip('|').split('|')]); i+=1
            out.append('<table border=1 cellpadding=4 style="border-collapse:collapse">')
            out.append('<tr>'+''.join(f'<th bgcolor="#1B3A5C"><font color="#FFFFFF">{inl(c)}</font></th>' for c in hdr)+'</tr>')
            for r in rows: out.append('<tr>'+''.join(f'<td>{inl(c)}</td>' for c in r)+'</tr>')
            out.append('</table>'); continue
        if s.startswith('```'):
            i+=1; b=[]
            while i<len(lines) and not lines[i].strip().startswith('```'): b.append(lines[i]); i+=1
            i+=1; out.append('<pre>'+inl('\n'.join(b))+'</pre>'); continue
        if s.startswith('---'): out.append('<hr>'); i+=1; continue
        if s.startswith('#'):
            l=min(len(s)-len(s.lstrip('#')),6); out.append(f'<h{l}>{inl(s.lstrip("#").strip())}</h{l}>'); i+=1; continue
        if s=='>': i+=1; continue
        if s.startswith('> '): out.append(f'<blockquote>{inl(s[2:])}</blockquote>'); i+=1; continue
        if re.match(r'^\s*[-*] ',lines[i]):
            out.append('<ul>')
            while i<len(lines):
                mm=re.match(r'^\s*[-*] (\[[ x]\] )?(.*)$',lines[i])
                if not mm: break
                out.append(f'<li>{"□ " if mm.group(1) else ""}{inl(mm.group(2))}</li>'); i+=1
            out.append('</ul>'); continue
        if re.match(r'^\s*\d+\. ',lines[i]):
            out.append('<ol>')
            while i<len(lines):
                mm=re.match(r'^\s*\d+\. (.*)$',lines[i])
                if not mm: break
                out.append(f'<li>{inl(mm.group(1))}</li>'); i+=1
            out.append('</ol>'); continue
        out.append(f'<p>{inl(s)}</p>'); i+=1
    return '\n'.join(out)+'\n</body></html>'
if __name__=='__main__': open(sys.argv[2],'w',encoding='utf-8').write(conv(sys.argv[1]))
