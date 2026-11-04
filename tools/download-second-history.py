"""Private, resumable Dukascopy tick -> observed S1 archive for MyTradingJourney.

Stores one compressed raw tick file and one compressed BID/ASK S1 file per hour.
No interpolation, public publication, database upload or paid service is used.
"""
import argparse, csv, gzip, hashlib, io, json, lzma, math, os, shutil, sqlite3, struct, time
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

UTC=timezone.utc
META=Path(__file__).with_name('seconds-instruments.json')
class StopDownload(Exception): pass

def atomic(path,raw):
    path.parent.mkdir(parents=True,exist_ok=True)
    temp=path.with_suffix(path.suffix+'.part');temp.write_bytes(raw);temp.replace(path)

def decode_ticks(raw,origin,scale):
    """BI5: millisecond offset, ask integer, bid integer, ask/bid volume."""
    if raw:
        decoder=lzma.LZMADecompressor(memlimit=64*1024*1024)
        body=decoder.decompress(raw,max_length=32*1024*1024+1)
        if not decoder.eof or decoder.unused_data:raise ValueError('Incomplete, oversized or concatenated BI5 stream')
    else:body=b''
    if len(body)%20: raise ValueError('Invalid tick record length')
    if len(body)>32*1024*1024: raise ValueError('Tick decompression limit')
    previous=-1;bars={};invalid=0;count=0
    for ms,ask,bid,av,bv in struct.iter_unpack('>3I2f',body):
        if not (0<=ms<3600000 and ms>=previous and 0<bid<=ask and all(math.isfinite(v) and v>=0 for v in (av,bv))):
            raise ValueError('Unordered, out-of-hour, crossed or invalid tick')
        previous=ms;count+=1;t=origin+ms//1000
        if t not in bars: bars[t]=[bid,bid,bid,bid,ask,ask,ask,ask,1]
        else:
            b=bars[t];b[1]=max(b[1],bid);b[2]=min(b[2],bid);b[3]=bid
            b[5]=max(b[5],ask);b[6]=min(b[6],ask);b[7]=ask;b[8]+=1
    digits=len(str(scale))-1
    def price(n): return f'{n//scale}.{n%scale:0{digits}d}'
    rows=[[t,*[price(v) for v in b[:8]],b[8]] for t,b in bars.items()]
    return rows,{'ticks':count,'invalid_ticks':invalid,'observed_seconds':len(rows)}

def aggregate(rows,seconds):
    """Exact larger UTC buckets from observed S1; tick count is not market volume."""
    from decimal import Decimal
    out={}
    for row in rows:
        t,*v=row;k=t//seconds*seconds
        if k not in out: out[k]=list(v)
        else:
            b=out[k]
            for offset in (0,4):
                if Decimal(v[offset+1])>Decimal(b[offset+1]):b[offset+1]=v[offset+1]
                if Decimal(v[offset+2])<Decimal(b[offset+2]):b[offset+2]=v[offset+2]
                b[offset+3]=v[offset+3]
            b[8]+=v[8]
    return [[t,*v] for t,v in sorted(out.items())]

def fetch(url,pause,root):
    for attempt in range(3):
        if (root/'STOP').exists():raise StopDownload('STOP file requested')
        time.sleep(pause)
        try:
            with urlopen(Request(url,headers={'User-Agent':'MyTradingJourney personal historical research'}),timeout=30) as response:
                raw=response.read(5*1024*1024+1)
                if len(raw)>5*1024*1024:raise ValueError('Tick download exceeds limit')
                return raw
        except HTTPError as error:
            if error.code==404:return None
            if error.code in (401,403,429):raise StopDownload(f'Provider HTTP {error.code}; stopped without bypassing access or rate limits')
            if error.code<500:raise
        except (URLError,TimeoutError,ConnectionError,OSError):
            if attempt==2:raise
        if attempt==2:raise RuntimeError('Provider remained unavailable')
        time.sleep(min(30,5*(attempt+1)))

def verify_file(path,sha):return path.is_file() and hashlib.sha256(path.read_bytes()).hexdigest()==sha

def run(args):
    root=args.out.resolve();root.mkdir(parents=True,exist_ok=True)
    lock=root/'worker.lock'
    try:lock_fd=os.open(lock,os.O_CREAT|os.O_EXCL|os.O_WRONLY)
    except FileExistsError:raise SystemExit('Worker lock exists. Verify the recorded PID before removing a stale lock.')
    os.write(lock_fd,str(os.getpid()).encode());os.close(lock_fd)
    db=sqlite3.connect(root/'progress.sqlite3')
    db.execute('create table if not exists hours(symbol text, hour integer, status text, raw_sha text, s1_sha text, candles integer, ticks integer, primary key(symbol,hour))')
    status={'schema':1,'website':'https://hooki535.github.io/MyTradingJourney/','status':'starting','pid':os.getpid(),'requested_from':args.start,'requested_until_exclusive':args.until,'frames_stored':['S1'],'price_sides':['bid','ask'],'gap_fill':False,'uploaded':False,'storage_budget_gb':args.max_gb}
    def report(**values):
        status.update(values);status['updated_at']=datetime.now(UTC).isoformat()
        status['downloaded_hours']=db.execute("select count(*) from hours where status='complete'").fetchone()[0]
        status['observed_second_candles']=db.execute("select coalesce(sum(candles),0) from hours where status='complete'").fetchone()[0]
        atomic(root/'status.json',json.dumps(status,indent=2).encode());print(json.dumps(status),flush=True)
    try:
        end_date=datetime.fromisoformat(args.until.replace('Z','+00:00'))
        if end_date.tzinfo is None or end_date.utcoffset().total_seconds()!=0:raise ValueError('End must explicitly use UTC')
        until=int(end_date.timestamp())
        if until%3600 or until>int(datetime.now(UTC).timestamp())//3600*3600:raise ValueError('End must be an already completed UTC hour')
        start=int(datetime.fromisoformat(args.start+'T00:00:00+00:00').timestamp())
        if start>=until:raise ValueError('Start must precede the exclusive end')
        metadata=json.loads(META.read_text())
        items=[x for x in metadata['instruments'] if not args.symbols or x['symbol'] in args.symbols.split(',')]
        if not items or args.symbols and set(args.symbols.split(','))!={x['symbol'] for x in items}:raise ValueError('Unknown symbol')
        bounds={x['symbol']:max(start,int(datetime.fromisoformat(x['earliest_tick'].replace('Z','+00:00')).timestamp())//3600*3600) for x in items}
        atomic(root/'coverage-plan.json',json.dumps({**metadata,'requested_from':args.start,'until_exclusive':args.until,'effective_first_hours':bounds,'estimated_hour_requests':sum(max(0,(until-t)//3600) for t in bounds.values()),'coverage_note':'Provider-listed bounds; actual available hours recorded individually. Empty and absent hours are not filled.'},indent=2).encode())
        # Resume cursors can advance only after a verified artifact or an actual missing response.
        cursor_file=root/'cursors.json';cursors=json.loads(cursor_file.read_text()) if cursor_file.exists() else {}
        key=args.start+'|'+args.until;cursor=cursors.setdefault(key,{})
        stored=db.execute('select count(*) from hours').fetchone()[0]
        archive_bytes=sum(p.stat().st_size for p in root.rglob('*') if p.is_file())
        processed=0;network_errors=0;report(status='downloading',symbols=[x['symbol'] for x in items])
        for hour in range(max(cursor.get(x['symbol'],until-3600) for x in items),min(bounds.values())-1,-3600):
            for item in items:
                symbol=item['symbol']
                if hour<bounds[symbol] or hour>cursor.get(symbol,until-3600):continue
                if (root/'STOP').exists():raise StopDownload('STOP file requested')
                if shutil.disk_usage(root).free<args.reserve_gb*1024**3:raise StopDownload('Free disk reserve reached')
                if archive_bytes>=args.max_gb*1024**3:raise StopDownload('Archive storage budget reached; more space is needed to continue')
                dt=datetime.fromtimestamp(hour,UTC);part=dt.strftime('%Y/%m/%d/%H')
                rawpath=root/symbol/'ticks'/(part+'.bi5');s1path=root/symbol/'S1'/(part+'.json.gz')
                old=db.execute('select status,raw_sha,s1_sha from hours where symbol=? and hour=?',(symbol,hour)).fetchone()
                if old and (old[0]=='missing' or old[0]=='complete' and verify_file(rawpath,old[1]) and verify_file(s1path,old[2])):
                    cursor[symbol]=hour-3600;continue
                url=f"https://datafeed.dukascopy.com/datafeed/{item['provider_symbol']}/{dt.year}/{dt.month-1:02d}/{dt.day:02d}/{dt.hour:02d}h_ticks.bi5"
                try:
                    if old and old[0]=='complete' and rawpath.exists() and not verify_file(rawpath,old[1]):raise ValueError('Stored original tick checksum changed; inspect before resuming')
                    raw=rawpath.read_bytes() if rawpath.exists() else fetch(url,args.pause,root)
                    if raw is None:
                        db.execute('insert or replace into hours values(?,?,?,?,?,?,?)',(symbol,hour,'missing',None,None,0,0))
                    else:
                        rows,quality=decode_ticks(raw,hour,item['price_scale'])
                        body={'schema':1,'provider':'dukascopy','symbol':symbol,'timeframe':'S1','timezone':'UTC','price_side':'bid_and_ask','source_url':url,'quality':quality,'columns':['time','open','high','low','close','ask_open','ask_high','ask_low','ask_close','tick_count'],'candles':rows}
                        packed=gzip.compress(json.dumps(body,separators=(',',':')).encode(),mtime=0)
                        atomic(rawpath,raw);atomic(s1path,packed);archive_bytes+=len(raw)+len(packed)
                        db.execute('insert or replace into hours values(?,?,?,?,?,?,?)',(symbol,hour,'complete',hashlib.sha256(raw).hexdigest(),hashlib.sha256(packed).hexdigest(),len(rows),quality['ticks']))
                    db.commit();cursor[symbol]=hour-3600;atomic(cursor_file,json.dumps(cursors).encode());network_errors=0;processed+=1
                    report(status='downloading',current_symbol=symbol,current_hour=dt.isoformat(),processed_this_run=processed,archive_bytes=archive_bytes)
                    if args.max_jobs and processed>=args.max_jobs:report(status='batch_complete');return
                except StopDownload:raise
                except (URLError,TimeoutError,ConnectionError,OSError) as error:
                    network_errors+=1;report(status='waiting_for_network',error=str(error),current_symbol=symbol,current_hour=dt.isoformat())
                    if network_errors>=3:raise StopDownload('Repeated network failure; rerun to resume this hour')
                    # Never advance past an errored hour. Restart the worker after backoff.
                    raise StopDownload('Network interrupted; rerun to resume this hour')
        report(status='complete_for_available_source_range')
    except (StopDownload,Exception) as error:
        report(status='paused',error=str(error));raise
    finally:
        db.close();lock.unlink(missing_ok=True)

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--out',type=Path,required=True);p.add_argument('--start',default='2000-01-01');p.add_argument('--until',required=True,help='Exclusive completed UTC hour, e.g. 2026-11-04T00:00:00Z');p.add_argument('--symbols');p.add_argument('--max-jobs',type=int);p.add_argument('--pause',type=float,default=4);p.add_argument('--max-gb',type=float,default=20);p.add_argument('--reserve-gb',type=float,default=20);a=p.parse_args()
    if a.pause<2 or a.max_gb<=0 or a.reserve_gb<10 or a.max_jobs is not None and a.max_jobs<1:raise SystemExit('Use pause >=2s, positive budget/jobs, reserve >=10 GB')
    run(a)
if __name__=='__main__':main()
